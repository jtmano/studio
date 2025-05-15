
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

  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false); // Initialize to false
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const [isSavingState, setIsSavingState] = useState<boolean>(false);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false); 
  const [justLoadedState, setJustLoadedState] = useState<boolean>(false); 
  
  const getDefaultExercise = (): WorkoutExercise[] => [{
    id: crypto.randomUUID(),
    name: "New Exercise",
    tool: "",
    sets: [{
        id: crypto.randomUUID(),
        setNumber: 1,
        targetWeight: "", // Ensure all fields from IndividualSet are present
        targetReps: undefined,
        loggedWeight: "",
        loggedReps: "",
        notes: "",       // Initialize notes
        isCompleted: false
    }],
  }];

  const fetchTemplate = useCallback(async (day: number) => {
    // The check `if (justLoadedState)` is now primarily handled by the useEffect that calls fetchTemplate.
    // This function will only be called if justLoadedState is false.
    setIsLoadingTemplate(true);
    try {
      const template = await loadWorkoutTemplate(day);
      const defaultWorkout = getDefaultExercise();
      if (template && template.exercises.length > 0) {
        const processedExercises = template.exercises.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: ex.sets.map((s: IndividualSet) => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
            targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
            loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
            loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(s.loggedReps) : 
                        (s.loggedReps === '') ? "" : "",
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));
        setCurrentWorkout(processedExercises);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(processedExercises))); // Deep clone for reset
        setLoadedTemplateName(template.name);
        toast({ title: "Template Loaded", description: `${template.name} for Day ${day} loaded.` });
      } else {
        setCurrentWorkout(defaultWorkout);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout))); // Deep clone
        setLoadedTemplateName(undefined);
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      const defaultWorkout = getDefaultExercise();
      toast({ title: "Error Loading Template", description: "Could not load workout template.", variant: "destructive" });
      setCurrentWorkout(defaultWorkout);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout))); // Deep clone
      setLoadedTemplateName(undefined);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [toast, setIsLoadingTemplate, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName]);


  useEffect(() => {
    if (isLoadingState || justLoadedState) { // If loading state OR if state was just loaded, don't fetch template.
      return;
    }
    fetchTemplate(selectedDay);
  }, [selectedDay, fetchTemplate, isLoadingState, justLoadedState]); // Added isLoadingState and justLoadedState


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
  
  const handleResetToTemplate = () => {
    if (initialTemplateWorkout.length > 0) {
      setCurrentWorkout(JSON.parse(JSON.stringify(initialTemplateWorkout))); // Deep clone for reset
      toast({ title: "Workout Reset", description: "Exercises reset to the loaded template." });
    } else {
       const defaultWorkout = getDefaultExercise();
       setCurrentWorkout(defaultWorkout);
       setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout))); // Deep clone
       toast({ title: "Workout Reset", description: "Reset to a blank slate." });
    }
  };

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

  const handleSaveCurrentState = async () => {
    setIsSavingState(true);
    // Deep clone and ensure notes are empty strings if null/undefined
    const currentWorkoutToSave = JSON.parse(JSON.stringify(currentWorkout.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        ...s,
        notes: s.notes || "",
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(s.loggedReps) : 
                    (s.loggedReps === '') ? "" : "",
      }))
    }))));

    const initialTemplateWorkoutToSave = JSON.parse(JSON.stringify(initialTemplateWorkout.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        ...s,
        notes: s.notes || "",
        loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
        loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(s.loggedReps) : 
                    (s.loggedReps === '') ? "" : "",
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
  };

  const handleLoadCurrentState = async () => {
    setIsLoadingState(true);
    setJustLoadedState(true); // Set flag before async operation and state changes
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); // This will trigger useEffect for fetchTemplate, which should now bail out

        // Deep clone and process the loaded workouts
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
            loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(s.loggedReps) : 
                        (s.loggedReps === '') ? "" : "",
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
            loggedReps: (s.loggedReps !== undefined && s.loggedReps !== null && String(s.loggedReps).trim() !== '') ? Number(s.loggedReps) : 
                        (s.loggedReps === '') ? "" : "",
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));
        
        setCurrentWorkout(processedCurrentWorkout);
        setLoadedTemplateName(loadedState.loadedTemplateName);
        setInitialTemplateWorkout(processedInitialTemplateWorkout);
        
        toast({ title: "State Loaded", description: "Your previous state has been restored." });
      } else {
        toast({ title: "No Saved State", description: "No previously saved state found.", variant: "default" });
        setJustLoadedState(false); // Reset if no state was loaded
      }
    } catch (error) {
      console.error("Failed to load app state:", error);
      toast({ title: "Load State Failed", description: "Could not load your saved state.", variant: "destructive" });
      setJustLoadedState(false); // Reset on error
    } finally {
      setIsLoadingState(false);
      // Reset justLoadedState after a short delay to allow UI to settle and prevent immediate template fetch
      // if selectedDay hasn't changed from what was loaded.
      // Or, more robustly, let the useEffect for fetchTemplate handle it on the next actual day change.
      // For now, we'll set it to false, allowing the next interaction or day change to fetch templates.
      setTimeout(() => setJustLoadedState(false), 0);
    }
  };


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
              isLoadingTemplate={isLoadingTemplate || isLoadingState}
            />
            <WorkoutLogger
              currentWorkout={currentWorkout}
              setCurrentWorkout={setCurrentWorkout}
              onLogWorkout={handleLogWorkout}
              onSaveCurrentState={handleSaveCurrentState} 
              onLoadCurrentState={handleLoadCurrentState}
              onResetTemplate={handleResetToTemplate}
              isLoading={isLoadingTemplate}
              isLogging={isLoggingWorkout}
              isSavingState={isSavingState} 
              isLoadingState={isLoadingState}
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

