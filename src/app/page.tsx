
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
import type { WorkoutExercise, IndividualSet, WorkoutHistoryItem, WorkoutTemplate, SerializableAppState, LoggedSetDatabaseEntry } from '@/types/fitness';
import { loadWorkoutTemplate, logWorkout, getWorkoutHistory, saveCurrentAppState, loadCurrentAppState } from '@/lib/actions';
import { processWorkoutForPersistence, processLoadedWorkout } from '@/lib/utils';
import { Dumbbell, LineChart, Lightbulb } from 'lucide-react';

type LoadingState = 'idle' | 'loading-template' | 'logging' | 'saving-state' | 'loading-history' | 'loading-week-day' | 'populating-workout';

export default function FitnessFocusPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | undefined>(undefined);
  const [initialTemplateWorkout, setInitialTemplateWorkout] = useState<WorkoutExercise[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<LoggedSetDatabaseEntry[]>([]);
  
  const [loadingState, setLoadingState] = useState<LoadingState>('loading-history');

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

  useEffect(() => {
     fetchHistory();
  }, [fetchHistory]);

  const fetchTemplateForDay = useCallback(async (day: number) => {
    setLoadingState('loading-template');
    toast({ title: "Loading Template...", description: `Fetching structure for Day ${day}.` });

    try {
      const template = await loadWorkoutTemplate(day);
      let exercisesToSet: WorkoutExercise[];
      let templateNameToSet: string;

      if (template && template.exercises) {
        exercisesToSet = template.exercises.map(ex => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: ex.sets.map(s => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            loggedWeight: "",
            loggedReps: "",
            isCompleted: false,
          }))
        }));
        templateNameToSet = template.name;
        toast({ title: "Template Loaded", description: `${template.name}. Populating from history...` });
      } else {
        exercisesToSet = getDefaultExercise();
        templateNameToSet = `Day ${day} (Default Blank)`;
        toast({ title: "No Template Found", description: `Loaded blank structure for Day ${day}. Populating from history...`, variant: "default" });
      }

      if (workoutHistory && workoutHistory.length > 0) {
          const populatedExercises = exercisesToSet.map(templateExercise => {
            const lastLoggedInstance = workoutHistory.find(
              histEntry =>
                histEntry.Exercise === templateExercise.name &&
                (histEntry.Tool || "") === (templateExercise.tool || "")
            );

            if (lastLoggedInstance) {
              const newSets = templateExercise.sets.map(templateSet => ({
                  ...templateSet,
                  loggedWeight: (lastLoggedInstance.Weight !== undefined && lastLoggedInstance.Weight !== null) ? String(lastLoggedInstance.Weight) : "",
                  loggedReps: (lastLoggedInstance.Reps !== undefined && lastLoggedInstance.Reps !== null) ? Number(lastLoggedInstance.Reps) : "",
              }));
              return { ...templateExercise, sets: newSets };
            }
            return templateExercise;
          });
          exercisesToSet = populatedExercises;
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
    workoutHistory,
    setCurrentWorkout,
    setInitialTemplateWorkout,
    setLoadedTemplateName,
    setLoadingState,
  ]);

  useEffect(() => {
    const isAnyLoading = loadingState !== 'idle';
    if (isAnyLoading) {
      return; 
    }
    if (justLoadedStateRef.current) {
      justLoadedStateRef.current = false; 
      return;
    }
    fetchTemplateForDay(selectedDay);
  }, [selectedDay, fetchTemplateForDay, loadingState, workoutHistory]);


  
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
    setLoadingState('logging');
    try {
      const result = await logWorkout(selectedWeek, selectedDay, currentWorkout);
      if (result.success) {
        toast({ title: "Workout Logged!", description: `${result.loggedSetsCount} sets for Week ${selectedWeek}, Day ${selectedDay} saved.` });
        fetchHistory(); 
      } else {
        toast({ title: "Logging Partially Failed", description: result.error || "Could not save your workout completely.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to log workout:", error);
      toast({ title: "Logging Failed", description: (error as Error).message || "Could not save your workout.", variant: "destructive" });
    } finally {
      setLoadingState('idle');
    }
  };

  const handleSaveCurrentState = useCallback(async () => {
    setLoadingState('saving-state');
    const appState: SerializableAppState = {
      selectedWeek,
      selectedDay,
      currentWorkout: processWorkoutForPersistence(currentWorkout),
      loadedTemplateName,
      initialTemplateWorkout: processWorkoutForPersistence(initialTemplateWorkout),
    };
    try {
      await saveCurrentAppState(appState);
      toast({ title: "State Saved", description: "Your current progress has been saved." });
    } catch (error) {
      console.error("Failed to save app state:", error);
      toast({ title: "Save State Failed", description: "Could not save your current state.", variant: "destructive" });
    } finally {
      setLoadingState('idle');
    }
  }, [currentWorkout, initialTemplateWorkout, loadedTemplateName, selectedDay, selectedWeek, toast]);

  const handleLoadWeekAndDay = useCallback(async () => {
    setLoadingState('loading-week-day');
    justLoadedStateRef.current = false; 
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); 
        toast({ title: "Week & Day Loaded", description: `Switched to Week ${loadedState.selectedWeek}, Day ${loadedState.selectedDay}. Template loading...` });
      } else {
        toast({ title: "No Saved State", description: "No saved state found to load week/day from.", variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load week/day from app state:", error);
      toast({ title: "Load Failed", description: "Could not load week/day.", variant: "destructive" });
    } finally {
      setLoadingState('idle');
    }
  }, [toast, setSelectedWeek, setSelectedDay]);

  const handlePopulateLoggedInfo = useCallback(async () => {
    setLoadingState('populating-workout');
    justLoadedStateRef.current = true; 
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState && loadedState.currentWorkout) {
        const processedCurrentWorkout = processLoadedWorkout(loadedState.currentWorkout);
        const processedInitialTemplateWorkout = processLoadedWorkout(loadedState.initialTemplateWorkout);
        
        setCurrentWorkout(processedCurrentWorkout);
        setInitialTemplateWorkout(processedInitialTemplateWorkout);
        setLoadedTemplateName(loadedState.loadedTemplateName);
        toast({ title: "Workout Info Populated", description: "Logged data applied to the current day." });
      } else {
        toast({ title: "No Workout Data", description: "No saved workout data found to populate.", variant: "default" });
        justLoadedStateRef.current = false; 
      }
    } catch (error) {
      console.error("Failed to populate workout info from app state:", error);
      toast({ title: "Population Failed", description: "Could not populate workout data.", variant: "destructive" });
      justLoadedStateRef.current = false; 
    } finally {
      setLoadingState('idle');
    }
  }, [toast, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName]);

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
              onLoadWeekAndDay={handleLoadWeekAndDay}
              onPopulateLoggedInfo={handlePopulateLoggedInfo}
              onResetTemplate={handleResetToTemplate}
              loadingState={loadingState}
              templateName={loadedTemplateName}
              selectedDay={selectedDay}
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

    