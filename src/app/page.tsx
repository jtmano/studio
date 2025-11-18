
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/fitness/DateSelector';
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger';
import { ProgressDisplay } from '@/components/fitness/ProgressDisplay';
import { AiExerciseSuggester } from '@/components/fitness/AiExerciseSuggester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutExercise, SerializableAppState, LoggedSetDatabaseEntry, QueuedWorkout } from '@/types/fitness';
import { loadWorkoutTemplate, logWorkout as logWorkoutToSupabase, getWorkoutHistory } from '@/lib/actions';
import { loadCurrentAppState, saveCurrentAppState, getSyncQueue, clearSyncQueue } from '@/lib/local-storage';
import { processLoadedWorkout, processWorkoutForPersistence } from '@/lib/utils';
import { Dumbbell, LineChart, Lightbulb } from 'lucide-react';

type LoadingState = 'idle' | 'loading-template' | 'logging' | 'saving-state' | 'loading-history' | 'syncing' | 'loading-specific-day' | 'populating-history';


export default function FitnessFocusPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | undefined>(undefined);
  const [initialTemplateWorkout, setInitialTemplateWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<LoggedSetDatabaseEntry[]>([]);
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const justLoadedStateRef = useRef<boolean>(false); 
  
  const getDefaultExercise = useCallback((): WorkoutExercise[] => [{
    id: crypto.randomUUID(),
    name: "New Exercise",
    tool: "",
    targetMuscleGroup: "",
    sets: [{
        id: crypto.randomUUID(),
        setNumber: 1,
        targetWeight: "", 
        targetReps: undefined,
        loggedWeight: "",
        loggedReps: "",
        notes: "",       
        isCompleted: false
    }],
  }], []);

  const syncOfflineWorkouts = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    setLoadingState('syncing');
    toast({ title: "Syncing Offline Data...", description: `Attempting to sync ${queue.length} workout(s).` });

    let successfullySynced = 0;
    const remainingQueue: QueuedWorkout[] = [];

    for (const item of queue) {
      const { success } = await logWorkoutToSupabase(item.week, item.day, item.workout);
      if (success) {
        successfullySynced++;
      } else {
        remainingQueue.push(item);
      }
    }

    clearSyncQueue();
    if (remainingQueue.length > 0) {
      saveCurrentAppState({ queuedWorkouts: remainingQueue });
      toast({ title: "Sync Partially Failed", description: `${remainingQueue.length} workout(s) could not be synced. They will be retried later.`, variant: "destructive" });
    } else {
      toast({ title: "Sync Complete!", description: `${successfullySynced} workout(s) successfully synced.` });
    }
    
    await fetchHistory();
    setLoadingState('idle');

  }, [toast]);


  // Effect for online/offline detection and syncing
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineWorkouts();
    };
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);
        if(navigator.onLine) {
            syncOfflineWorkouts();
        }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [syncOfflineWorkouts]);


  const fetchHistory = useCallback(async () => {
    setLoadingState('loading-history');
    try {
      const historyData = await getWorkoutHistory(); 
      setWorkoutHistory(historyData);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({ title: "Error Loading History", description: "Could not load workout history.", variant: "destructive" });
    } finally {
      setLoadingState('idle');
    }
  }, [toast]); 

  // Load initial state from localStorage and then fetch remote history
  useEffect(() => {
    const localState = loadCurrentAppState();
    if (localState) {
      const { selectedWeek, selectedDay, currentWorkout, initialTemplateWorkout, loadedTemplateName } = localState;
      if (selectedWeek) setSelectedWeek(selectedWeek);
      if (selectedDay) setSelectedDay(selectedDay);
      if (currentWorkout) setCurrentWorkout(processLoadedWorkout(currentWorkout));
      if (initialTemplateWorkout) setInitialTemplateWorkout(processLoadedWorkout(initialTemplateWorkout));
      if (loadedTemplateName) setLoadedTemplateName(loadedTemplateName);
      justLoadedStateRef.current = true;
    }
    fetchHistory();
  }, [fetchHistory]);

 const fetchTemplateForDay = useCallback(async (day: number, history: LoggedSetDatabaseEntry[]) => {
    setLoadingState('loading-template');
    toast({ title: "Loading Template...", description: `Fetching structure for Day ${day}.` });

    try {
        const template = await loadWorkoutTemplate(day);
        let exercisesToSet: WorkoutExercise[];
        let templateNameToSet: string;

        if (template && template.exercises) {
            exercisesToSet = processLoadedWorkout(template.exercises);
            templateNameToSet = template.name;
            toast({ title: "Template Loaded", description: `${template.name}. Populating from history...` });
        } else {
            exercisesToSet = getDefaultExercise();
            templateNameToSet = `Day ${day} (Default Blank)`;
            toast({ title: "No Template Found", description: `Loaded blank structure for Day ${day}.`, variant: "default" });
        }

        if (history && history.length > 0) {
            // Find the most recent week for the selected day
            const historyForDay = history.filter(entry => entry.Day === day);
            const latestWeek = historyForDay.reduce((max, entry) => (entry.Week > max ? entry.Week : max), 0);

            if (latestWeek > 0) {
                // Get all entries for that specific latest session (week and day)
                const lastSessionEntries = historyForDay.filter(entry => entry.Week === latestWeek);

                const populatedExercises = exercisesToSet.map(templateExercise => {
                    // Find all sets for this exercise from the last session
                    const exerciseHistory = lastSessionEntries.filter(
                        hist =>
                            hist.Exercise === templateExercise.name &&
                            (hist.Tool || "") === (templateExercise.tool || "")
                    );

                    if (exerciseHistory.length > 0) {
                        // Replace template sets with the actual logged sets from history
                        const newSets = exerciseHistory.map((histEntry, index) => ({
                            id: crypto.randomUUID(),
                            setNumber: index + 1,
                            loggedWeight: (histEntry.Weight !== undefined && histEntry.Weight !== null) ? String(histEntry.Weight) : "",
                            loggedReps: (histEntry.Reps !== undefined && histEntry.Reps !== null) ? String(histEntry.Reps) : "",
                            isCompleted: false, // Reset completion status
                            notes: "", // Reset notes
                        }));
                        return { ...templateExercise, sets: newSets };
                    }
                    return templateExercise; // Return exercise as is if no history for it
                });
                exercisesToSet = populatedExercises;
            }
        }

        setCurrentWorkout(exercisesToSet);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(exercisesToSet)));
        setLoadedTemplateName(templateNameToSet);

    } catch (error) {
        console.error("Failed to load template and populate from history:", error);
        const defaultWorkout = getDefaultExercise();
        setCurrentWorkout(defaultWorkout);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
        setLoadedTemplateName(`Day ${day} (Error Loading)`);
        toast({ title: "Error Loading Workout", description: (error as Error).message || "Could not load workout.", variant: "destructive" });
    } finally {
        setLoadingState('idle');
    }
}, [
    getDefaultExercise,
    toast,
]);


    // Effect to fetch template when day changes
  useEffect(() => {
    if (['saving-state', 'logging', 'syncing'].includes(loadingState)) return;
    
    if (justLoadedStateRef.current) {
      justLoadedStateRef.current = false;
      return;
    }

    if (workoutHistory.length > 0) {
        fetchTemplateForDay(selectedDay, workoutHistory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, workoutHistory]); 
  
  const handleResetToTemplate = useCallback(() => {
    if (initialTemplateWorkout.length > 0) {
      setCurrentWorkout(JSON.parse(JSON.stringify(initialTemplateWorkout))); 
      toast({ title: "Workout Reset", description: "Exercises reset to the loaded template/saved state." });
    } else {
       const defaultWorkout = getDefaultExercise();
       setCurrentWorkout(defaultWorkout);
       setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout))); 
       toast({ title: "Workout Reset", description: "Reset to a blank slate." });
    }
  }, [initialTemplateWorkout, getDefaultExercise, toast]);

  const handleLogWorkout = async () => {
    if (currentWorkout.length === 0 || currentWorkout.every(ex => ex.sets.length === 0)) {
      toast({ title: "Cannot Log Empty Workout", description: "Add some exercises and sets first.", variant: "destructive" });
      return;
    }
    if (currentWorkout.every(ex => ex.sets.every(s => !s.isCompleted))) {
      toast({ title: "No Sets Logged", description: "Please mark at least one set as completed to log the workout.", variant: "default" });
      return;
    }

    const workoutToLog = processWorkoutForPersistence(currentWorkout);

    if (isOnline) {
      setLoadingState('logging');
      try {
        const result = await logWorkoutToSupabase(selectedWeek, selectedDay, workoutToLog);
        if (result.success) {
          toast({ title: "Workout Logged!", description: `${result.loggedSetsCount} sets for Week ${selectedWeek}, Day ${selectedDay} saved.` });
          fetchHistory(); 
        } else {
          toast({ title: "Logging Failed", description: result.error || "Could not save your workout.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to log workout:", error);
        toast({ title: "Logging Failed", description: (error as Error).message || "Could not save your workout.", variant: "destructive" });
      } finally {
        setLoadingState('idle');
      }
    } else {
      // Offline: Add to queue
      const queuedWorkout: QueuedWorkout = { week: selectedWeek, day: selectedDay, workout: workoutToLog };
      saveCurrentAppState({ queuedWorkouts: [...getSyncQueue(), queuedWorkout] });
      toast({ title: "Workout Saved Offline", description: "Your workout is saved and will be synced when you're back online." });
    }
  };

  const handleSaveCurrentState = useCallback(async () => {
    setLoadingState('saving-state');
    const appState: Partial<SerializableAppState> = {
      selectedWeek,
      selectedDay,
      currentWorkout: processWorkoutForPersistence(currentWorkout),
      loadedTemplateName,
      initialTemplateWorkout: processWorkoutForPersistence(initialTemplateWorkout),
    };
    try {
      saveCurrentAppState(appState);
      toast({ title: "State Saved", description: "Your current progress has been saved locally." });
    } catch (error) {
      console.error("Failed to save app state:", error);
      toast({ title: "Save State Failed", description: "Could not save your current state.", variant: "destructive" });
    } finally {
      setLoadingState('idle');
    }
  }, [currentWorkout, initialTemplateWorkout, loadedTemplateName, selectedDay, selectedWeek, toast]);


  const handleLoadSpecificDay = useCallback(async (week: number, day: number) => {
    setLoadingState('loading-specific-day');
    setSelectedWeek(week);
    setSelectedDay(day);
  }, []);

  const handlePopulateFromHistory = useCallback(() => {
    if (workoutHistory.length === 0) {
        toast({ title: "No History", description: "No workout history available to populate from." });
        return;
    }
    if (currentWorkout.length === 0) {
        toast({ title: "No Workout Loaded", description: "Load a template or add exercises first." });
        return;
    }

    setLoadingState('populating-history');
    toast({ title: "Populating from History..." });

    const populatedExercises = currentWorkout.map(exercise => {
        const allInstances = workoutHistory.filter(
            hist => hist.Exercise === exercise.name && (hist.Tool || "") === (exercise.tool || "")
        );

        if (allInstances.length > 0) {
            const bestPerformance = allInstances.reduce((best, current) => {
                const currentWeight = current.Weight ?? 0;
                const bestWeight = best.Weight ?? 0;
                const currentReps = current.Reps ?? 0;
                const bestReps = best.Reps ?? 0;

                if (currentWeight > bestWeight) return current;
                if (currentWeight === bestWeight && currentReps > bestReps) return current;
                return best;
            }, allInstances[0]);
            
            const newSets = exercise.sets.map(set => ({
                ...set,
                loggedWeight: bestPerformance.Weight !== null ? String(bestPerformance.Weight) : "",
                loggedReps: bestPerformance.Reps !== null ? String(bestPerformance.Reps) : "",
            }));
            return { ...exercise, sets: newSets };
        }
        return exercise;
    });

    setCurrentWorkout(populatedExercises);
    justLoadedStateRef.current = true;
    setLoadingState('idle');
    toast({ title: "Workout Populated", description: "Exercises updated with your best performance." });
}, [currentWorkout, workoutHistory, toast]);


  const isLoading = loadingState !== 'idle';

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:max-w-md mx-auto mb-6 shadow-sm">
            <TabsTrigger value="log"><Dumbbell className="mr-2 h-4 w-4 inline-block sm:mr-1" /> <span className="hidden sm:inline">Log Workout</span></TabsTrigger>
            <TabsTrigger value="progress"><LineChart className="mr-2 h-4 w-4 inline-block sm:mr-1" /> <span className="hidden sm:inline">Progress</span></TabsTrigger>
            <TabsTrigger value="ai"><Lightbulb className="mr-2 h-4 w-4 inline-block sm:mr-1" /> <span className="hidden sm:inline">AI Coach</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="log" className="space-y-6">
            <DateSelector
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              isLoadingTemplate={loadingState === 'loading-template'}
            />
            <WorkoutLogger
              currentWorkout={currentWorkout}
              setCurrentWorkout={setCurrentWorkout}
              onLogWorkout={handleLogWorkout}
              onSaveCurrentState={handleSaveCurrentState} 
              onResetTemplate={handleResetToTemplate}
              loadingState={loadingState}
              templateName={loadedTemplateName}
              selectedDay={selectedDay}
              isOnline={isOnline}
              onLoadSpecificDay={handleLoadSpecificDay}
              onPopulateFromHistory={handlePopulateFromHistory}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDisplay historyFlat={workoutHistory} isLoading={loadingState === 'loading-history'} />
          </TabsContent>

          <TabsContent value="ai">
            <AiExerciseSuggester />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        Fitness Focus &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

    