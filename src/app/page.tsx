
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/fitness/DateSelector';
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger';
import { ProgressDisplay } from '@/components/fitness/ProgressDisplay';
import { AiExerciseSuggester } from '@/components/fitness/AiExerciseSuggester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutExercise, WorkoutHistoryItem, WorkoutTemplate, SerializableAppState } from '@/types/fitness';
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
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const [isSavingState, setIsSavingState] = useState<boolean>(false);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [justLoadedState, setJustLoadedState] = useState<boolean>(false);
  
  const getDefaultExercise = (): WorkoutExercise[] => [{
    id: crypto.randomUUID(),
    name: "New Exercise",
    tool: "",
    sets: [{ id: crypto.randomUUID(), setNumber: 1, loggedWeight: "", loggedReps: "", notes: "", isCompleted: false }],
  }];

  const fetchTemplate = useCallback(async (day: number) => {
    if (justLoadedState) {
      setJustLoadedState(false); 
      return;
    }
    setIsLoadingTemplate(true);
    try {
      const template = await loadWorkoutTemplate(day);
      const defaultWorkout = getDefaultExercise();
      if (template && template.exercises.length > 0) {
        const processedExercises = template.exercises.map(ex => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: ex.sets.map(s => ({ ...s, id: s.id || crypto.randomUUID(), notes: s.notes || "" })),
        }));
        setCurrentWorkout(processedExercises);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(processedExercises)));
        setLoadedTemplateName(template.name);
        toast({ title: "Template Loaded", description: `${template.name} for Day ${day} loaded.` });
      } else {
        setCurrentWorkout(defaultWorkout);
        setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
        setLoadedTemplateName(undefined);
        // toast({ title: "No Template Found", description: `No template for Day ${day}. Started with a blank slate.`, variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      const defaultWorkout = getDefaultExercise();
      toast({ title: "Error Loading Template", description: "Could not load workout template.", variant: "destructive" });
      setCurrentWorkout(defaultWorkout);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
      setLoadedTemplateName(undefined);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [toast, justLoadedState, setJustLoadedState, setIsLoadingTemplate, setCurrentWorkout, setInitialTemplateWorkout, setLoadedTemplateName]);

  useEffect(() => {
    // If we are in the process of loading state, don't fetch a template.
    // The loaded state will provide the currentWorkout.
    // The justLoadedState flag (handled within fetchTemplate) will prevent
    // an immediate template fetch after state loading completes.
    if (isLoadingState) {
      return;
    }
    fetchTemplate(selectedDay);
  }, [selectedDay, fetchTemplate, isLoadingState]); // Added isLoadingState


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
      setCurrentWorkout(JSON.parse(JSON.stringify(initialTemplateWorkout)));
      toast({ title: "Workout Reset", description: "Exercises reset to the loaded template." });
    } else {
       const defaultWorkout = getDefaultExercise();
       setCurrentWorkout(defaultWorkout);
       setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
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
    const appState: SerializableAppState = {
      selectedWeek,
      selectedDay,
      currentWorkout: currentWorkout.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({...s, notes: s.notes || ""}))
      })),
      loadedTemplateName,
      initialTemplateWorkout: initialTemplateWorkout.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({...s, notes: s.notes || ""}))
      })),
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
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); // This will trigger fetchTemplate's useEffect
                                                 // but it will be guarded by isLoadingState.
        setCurrentWorkout(loadedState.currentWorkout.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({...s, notes: s.notes || ""}))
        })));
        setLoadedTemplateName(loadedState.loadedTemplateName);
        setInitialTemplateWorkout(loadedState.initialTemplateWorkout.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({...s, notes: s.notes || ""}))
        })));
        setJustLoadedState(true); // Set this so the *next* fetchTemplate call (after isLoadingState is false) is skipped.
        toast({ title: "State Loaded", description: "Your previous state has been restored." });
      } else {
        toast({ title: "No Saved State", description: "No previously saved state found.", variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load app state:", error);
      toast({ title: "Load State Failed", description: "Could not load your saved state.", variant: "destructive" });
    } finally {
      setIsLoadingState(false);
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

