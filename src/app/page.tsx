"use client";

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/fitness/DateSelector';
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger';
import { ProgressDisplay } from '@/components/fitness/ProgressDisplay';
import { AiExerciseSuggester } from '@/components/fitness/AiExerciseSuggester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import type { Exercise, WorkoutHistoryItem, WorkoutTemplate } from '@/types/fitness';
import { loadWorkoutTemplate, logWorkout, getWorkoutHistory, saveRoutine as saveRoutineAction } from '@/lib/actions'; // Server actions
import { Dumbbell, LineChart, Lightbulb } from 'lucide-react';

export default function FitnessFocusPage() {
  const { toast } = useToast();

  // Date State
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Workout State
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | undefined>(undefined);
  const [initialTemplateExercises, setInitialTemplateExercises] = useState<Exercise[]>([]);


  // Loading/Action States
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  const [isSavingRoutine, setIsSavingRoutine] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  // Data State
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const fetchTemplate = useCallback(async (day: number) => {
    setIsLoadingTemplate(true);
    try {
      const template = await loadWorkoutTemplate(day);
      if (template) {
        const exercisesWithClientIds = template.exercises.map(ex => ({ ...ex, id: ex.id || crypto.randomUUID() }));
        setCurrentExercises(exercisesWithClientIds);
        setInitialTemplateExercises(JSON.parse(JSON.stringify(exercisesWithClientIds))); // Deep copy for reset
        setLoadedTemplateName(template.name);
        toast({ title: "Template Loaded", description: `${template.name} for Day ${day} loaded.` });
      } else {
        const defaultExercise = { id: crypto.randomUUID(), name: "New Exercise", sets: 3, reps: 10, weight: "" };
        setCurrentExercises([defaultExercise]);
        setInitialTemplateExercises([JSON.parse(JSON.stringify(defaultExercise))]);
        setLoadedTemplateName(undefined);
        toast({ title: "No Template Found", description: `No template for Day ${day}. Started with a blank slate.`, variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      toast({ title: "Error Loading Template", description: "Could not load workout template.", variant: "destructive" });
      const defaultExercise = { id: crypto.randomUUID(), name: "New Exercise", sets: 3, reps: 10, weight: "" };
      setCurrentExercises([defaultExercise]);
      setInitialTemplateExercises([JSON.parse(JSON.stringify(defaultExercise))]);
      setLoadedTemplateName(undefined);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplate(selectedDay);
  }, [selectedDay, fetchTemplate]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({ title: "Error Loading History", description: "Could not load workout history.", variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  
  const handleResetToTemplate = () => {
    setCurrentExercises(JSON.parse(JSON.stringify(initialTemplateExercises))); // Reset to the initially loaded template
    toast({ title: "Workout Reset", description: "Exercises reset to the loaded template." });
  };

  const handleLogWorkout = async () => {
    if (currentExercises.length === 0) {
      toast({ title: "Cannot Log Empty Workout", description: "Add some exercises first.", variant: "destructive" });
      return;
    }
    setIsLoggingWorkout(true);
    try {
      // Ensure all exercises have a valid ID; this might be redundant if templates provide IDs.
      const exercisesToLog = currentExercises.map(ex => ({...ex, id: ex.id || crypto.randomUUID()}));
      await logWorkout(selectedWeek, selectedDay, exercisesToLog);
      toast({ title: "Workout Logged!", description: `Workout for Week ${selectedWeek}, Day ${selectedDay} saved.` });
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error("Failed to log workout:", error);
      toast({ title: "Logging Failed", description: "Could not save your workout.", variant: "destructive" });
    } finally {
      setIsLoggingWorkout(false);
    }
  };

  const handleSaveRoutine = async (routineName: string) => {
     if (currentExercises.length === 0) {
      toast({ title: "Cannot Save Empty Routine", description: "Add some exercises first.", variant: "destructive" });
      return;
    }
    setIsSavingRoutine(true);
    try {
      await saveRoutineAction(routineName, selectedDay, currentExercises);
      toast({ title: "Routine Saved!", description: `Routine "${routineName}" has been saved.` });
      // Potentially refresh template list if displayed, or just notify user.
    } catch (error) {
      console.error("Failed to save routine:", error);
      toast({ title: "Save Routine Failed", description: "Could not save the routine.", variant: "destructive" });
    } finally {
      setIsSavingRoutine(false);
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
              isLoadingTemplate={isLoadingTemplate}
            />
            <WorkoutLogger
              currentExercises={currentExercises}
              setCurrentExercises={setCurrentExercises}
              onLogWorkout={handleLogWorkout}
              onSaveRoutine={(name) => handleSaveRoutine(name)}
              onResetTemplate={handleResetToTemplate}
              isLoading={isLoadingTemplate}
              isLogging={isLoggingWorkout}
              isSavingRoutine={isSavingRoutine}
              templateName={loadedTemplateName}
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
      <Toaster />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        Fitness Focus &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
