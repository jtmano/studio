
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/fitness/DateSelector';
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger';
import { ProgressDisplay } from '@/components/fitness/ProgressDisplay';
import { AiExerciseSuggester } from '@/components/fitness/AiExerciseSuggester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutExercise, IndividualSet, WorkoutHistoryItem, WorkoutTemplate, SerializableAppState } from '@/types/fitness';
import { loadWorkoutTemplate, logWorkout, getWorkoutHistory, saveCurrentAppState, loadCurrentAppState } from '@/lib/actions';
import { Dumbbell, LineChart, Lightbulb } from 'lucide-react';

export default function FitnessFocusPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | undefined>(undefined);
  const [initialTemplateWorkout, setInitialTemplateWorkout] = useState<WorkoutExercise[]>([]);

  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true); // Start true to fetch history initially
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const [isSavingState, setIsSavingState] = useState<boolean>(false);
  const [isLoadingWeekDay, setIsLoadingWeekDay] = useState<boolean>(false);
  const [isPopulatingWorkout, setIsPopulatingWorkout] = useState<boolean>(false);
  const [justLoadedState, setJustLoadedState] = useState<boolean>(false); 
  
  const getDefaultExercise = useCallback((): WorkoutExercise[] => [{
    id: crypto.randomUUID(),
    name: "New Exercise",
    tool: "",
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

  const resetToBlankWorkoutForDay = useCallback(async (day: number) => {
    setIsLoadingTemplate(true);
    // This function now only resets to a blank state or loads a placeholder.
    // It no longer fetches external templates unless modified to do so.
    try {
      // Simulating a "template" load that just provides a blank slate.
      // If you had actual Supabase template fetching, it would go here,
      // but for now, it aligns with "completely disable template loading".
      const defaultWorkout = getDefaultExercise();
      setCurrentWorkout(defaultWorkout);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
      setLoadedTemplateName(`Day ${day} (Blank)`); // Indicate it's a blank slate for the day
      // toast({ title: "Workout Area Reset", description: `Ready for Day ${day}.` });
    } catch (error) {
      console.error("Failed to reset workout area:", error);
      toast({ title: "Error Resetting", description: "Could not reset workout area.", variant: "destructive" });
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [toast, getDefaultExercise, setIsLoadingTemplate, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName]);


  useEffect(() => {
    // This effect handles resetting to a blank template when the day changes,
    // or when loading indicators are off and state wasn't just populated.
    if (isLoadingWeekDay || isPopulatingWorkout) {
      return; // Don't do anything if a load operation is active
    }
    if (justLoadedState) {
      setJustLoadedState(false); // Workout info was just populated, don't reset, just clear the flag.
      return;
    }
    resetToBlankWorkoutForDay(selectedDay);
  }, [selectedDay, resetToBlankWorkoutForDay, isLoadingWeekDay, isPopulatingWorkout, justLoadedState]);


  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const historyData = await getWorkoutHistory();
      setWorkoutHistory(historyData);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({ title: "Error Loading History", description: "Could not load workout history.", variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast, setIsLoadingHistory, setWorkoutHistory]); 

  useEffect(() => {
     fetchHistory();
  }, [fetchHistory]);
  
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
    setIsLoggingWorkout(true);
    try {
      await logWorkout(selectedWeek, selectedDay, currentWorkout);
      toast({ title: "Workout Logged!", description: `Workout for Week ${selectedWeek}, Day ${selectedDay} saved.` });
      fetchHistory(); 
    } catch (error) {
      console.error("Failed to log workout:", error);
      toast({ title: "Logging Failed", description: (error as Error).message || "Could not save your workout.", variant: "destructive" });
    } finally {
      setIsLoggingWorkout(false);
    }
  };

  const handleSaveCurrentState = useCallback(async () => {
    setIsSavingState(true);
    const currentWorkoutToSave = JSON.parse(JSON.stringify(currentWorkout.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        ...s,
        notes: s.notes || "",
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(String(s.loggedReps).trim()) : 
                    (String(s.loggedReps).trim() === '') ? "" : "",
      }))
    }))));

    const initialTemplateWorkoutToSave = JSON.parse(JSON.stringify(initialTemplateWorkout.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        ...s,
        notes: s.notes || "",
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(String(s.loggedReps).trim()) : 
                    (String(s.loggedReps).trim() === '') ? "" : "",
      }))
    }))));

    const appState: SerializableAppState = {
      selectedWeek,
      selectedDay,
      currentWorkout: currentWorkoutToSave,
      loadedTemplateName,
      initialTemplateWorkout: initialTemplateWorkoutToSave,
    };
    try {
      await saveCurrentAppState(appState);
      toast({ title: "State Saved", description: "Your current progress has been saved." });
    } catch (error) {
      console.error("Failed to save app state:", error);
      toast({ title: "Save State Failed", description: "Could not save your current state.", variant: "destructive" });
    } finally {
      setIsSavingState(false);
    }
  }, [currentWorkout, initialTemplateWorkout, loadedTemplateName, selectedDay, selectedWeek, toast]);

  const handleLoadWeekAndDay = useCallback(async () => {
    setIsLoadingWeekDay(true);
    setJustLoadedState(false); // Allow template reset for the new day
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); // This change will trigger the useEffect for resetToBlankWorkoutForDay
        toast({ title: "Week & Day Loaded", description: `Switched to Week ${loadedState.selectedWeek}, Day ${loadedState.selectedDay}. Workout area reset.` });
      } else {
        toast({ title: "No Saved State", description: "No saved state found to load week/day from.", variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load week/day from app state:", error);
      toast({ title: "Load Failed", description: "Could not load week/day.", variant: "destructive" });
    } finally {
      setIsLoadingWeekDay(false);
    }
  }, [toast, setSelectedWeek, setSelectedDay, setJustLoadedState]);

  const handlePopulateLoggedInfo = useCallback(async () => {
    setIsPopulatingWorkout(true);
    setJustLoadedState(true); // Prevent template reset immediately after this
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState && loadedState.currentWorkout) {
        const clonedCurrentWorkout = JSON.parse(JSON.stringify(loadedState.currentWorkout || []));
        const clonedInitialTemplateWorkout = JSON.parse(JSON.stringify(loadedState.initialTemplateWorkout || []));

        const processedCurrentWorkout = clonedCurrentWorkout.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: ex.sets.map((s: IndividualSet) => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
            targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
            loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
            loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));

        const processedInitialTemplateWorkout = clonedInitialTemplateWorkout.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: ex.sets.map((s: IndividualSet) => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
            targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
            loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
            loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));
        
        setCurrentWorkout(processedCurrentWorkout);
        setInitialTemplateWorkout(processedInitialTemplateWorkout);
        setLoadedTemplateName(loadedState.loadedTemplateName);
        
        toast({ title: "Workout Info Populated", description: "Logged data applied to the current day." });
      } else {
        toast({ title: "No Workout Data", description: "No saved workout data found to populate.", variant: "default" });
        setJustLoadedState(false); // If no data, allow template reset
      }
    } catch (error) {
      console.error("Failed to populate workout info from app state:", error);
      toast({ title: "Population Failed", description: "Could not populate workout data.", variant: "destructive" });
      setJustLoadedState(false); // On error, allow template reset
    } finally {
      setIsPopulatingWorkout(false);
    }
  }, [toast, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName, setJustLoadedState]);

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
              isLoadingTemplate={isLoadingTemplate || isLoadingWeekDay || isPopulatingWorkout}
            />
            <WorkoutLogger
              currentWorkout={currentWorkout}
              setCurrentWorkout={setCurrentWorkout}
              onLogWorkout={handleLogWorkout}
              onSaveCurrentState={handleSaveCurrentState} 
              onLoadWeekAndDay={handleLoadWeekAndDay}
              onPopulateLoggedInfo={handlePopulateLoggedInfo}
              onResetTemplate={handleResetToTemplate}
              isLoading={isLoadingTemplate}
              isLogging={isLoggingWorkout}
              isSavingState={isSavingState} 
              isLoadingWeekDay={isLoadingWeekDay}
              isPopulatingWorkout={isPopulatingWorkout}
              templateName={loadedTemplateName}
              selectedDay={selectedDay}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDisplay history={workoutHistory} isLoading={isLoadingHistory} />
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
