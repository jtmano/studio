
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const [isSavingState, setIsSavingState] = useState<boolean>(false);
  const [isLoadingWeekDay, setIsLoadingWeekDay] = useState<boolean>(false);
  const [isPopulatingWorkout, setIsPopulatingWorkout] = useState<boolean>(false);
  
  // Use a ref for one-shot flag to prevent re-triggering effects
  const justLoadedStateRef = useRef<boolean>(false); 
  
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

  const fetchTemplateForDay = useCallback(async (day: number) => {
    setIsLoadingTemplate(true);
    try {
      const template = await loadWorkoutTemplate(day);
      if (template && template.exercises) {
        const processedExercises = template.exercises.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          tool: ex.tool || "",
          sets: ex.sets.map((s: IndividualSet) => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
            targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
            loggedWeight: "", 
            loggedReps: "",   
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));
        setCurrentWorkout(processedExercises);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(processedExercises)));
        setLoadedTemplateName(template.name);
        toast({ title: "Template Loaded", description: `${template.name} loaded for Day ${day}.` });
      } else {
        const defaultWorkout = getDefaultExercise();
        setCurrentWorkout(defaultWorkout);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
        setLoadedTemplateName(`Day ${day} (No Template Found)`);
        toast({ title: "No Template", description: `No template found for Day ${day}. Loaded blank workout.`, variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      const defaultWorkout = getDefaultExercise();
      setCurrentWorkout(defaultWorkout);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
      setLoadedTemplateName(`Day ${day} (Error Loading)`);
      toast({ title: "Error Loading Template", description: (error as Error).message || "Could not load template.", variant: "destructive" });
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [toast, getDefaultExercise, setIsLoadingTemplate, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName]);


  useEffect(() => {
    if (isLoadingWeekDay || isPopulatingWorkout) {
      return; 
    }
    // If justLoadedStateRef is true, it means "Populate Workout" just ran and set the workout.
    // We consume the flag and skip fetching the template for this render cycle.
    if (justLoadedStateRef.current) {
      justLoadedStateRef.current = false; 
      return;
    }
    fetchTemplateForDay(selectedDay);
  }, [selectedDay, fetchTemplateForDay, isLoadingWeekDay, isPopulatingWorkout]);


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
      id: ex.id || crypto.randomUUID(),
      tool: ex.tool || "",
      sets: ex.sets.map(s => ({
        ...s,
        id: s.id || crypto.randomUUID(),
        notes: s.notes || "",
        targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
        targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
        isCompleted: s.isCompleted || false,
      }))
    }))));

    const initialTemplateWorkoutToSave = JSON.parse(JSON.stringify(initialTemplateWorkout.map(ex => ({
      ...ex,
      id: ex.id || crypto.randomUUID(),
      tool: ex.tool || "",
      sets: ex.sets.map(s => ({
        ...s,
        id: s.id || crypto.randomUUID(),
        notes: s.notes || "",
        targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
        targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
        isCompleted: s.isCompleted || false,
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
  }, [currentWorkout, initialTemplateWorkout, loadedTemplateName, selectedDay, selectedWeek, toast, setIsSavingState]);

  const handleLoadWeekAndDay = useCallback(async () => {
    setIsLoadingWeekDay(true);
    justLoadedStateRef.current = false; // Allow template fetch for the new day
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); // This change will trigger the useEffect for fetchTemplateForDay
        toast({ title: "Week & Day Loaded", description: `Switched to Week ${loadedState.selectedWeek}, Day ${loadedState.selectedDay}. Template for new day will load.` });
      } else {
        toast({ title: "No Saved State", description: "No saved state found to load week/day from.", variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load week/day from app state:", error);
      toast({ title: "Load Failed", description: "Could not load week/day.", variant: "destructive" });
    } finally {
      setIsLoadingWeekDay(false);
    }
  }, [toast, setSelectedWeek, setSelectedDay, setIsLoadingWeekDay]);

  const handlePopulateLoggedInfo = useCallback(async () => {
    setIsPopulatingWorkout(true);
    justLoadedStateRef.current = true; // Signal to prevent template fetch from overwriting this
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState && loadedState.currentWorkout) {
        const clonedCurrentWorkout = JSON.parse(JSON.stringify(loadedState.currentWorkout || []));
        const clonedInitialTemplateWorkout = JSON.parse(JSON.stringify(loadedState.initialTemplateWorkout || []));

        const processedCurrentWorkout = clonedCurrentWorkout.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          tool: ex.tool || "",
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
          tool: ex.tool || "",
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
        // We expect the useEffect for selectedDay to see justLoadedStateRef.current = true
        // and skip template loading.
        toast({ title: "Workout Info Populated", description: "Logged data applied to the current day." });
      } else {
        toast({ title: "No Workout Data", description: "No saved workout data found to populate.", variant: "default" });
        justLoadedStateRef.current = false; // If no data, allow template fetch for current day
      }
    } catch (error) {
      console.error("Failed to populate workout info from app state:", error);
      toast({ title: "Population Failed", description: "Could not populate workout data.", variant: "destructive" });
      justLoadedStateRef.current = false; // On error, allow template fetch
    } finally {
      setIsPopulatingWorkout(false);
    }
  }, [toast, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName, setIsPopulatingWorkout]);

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
    
