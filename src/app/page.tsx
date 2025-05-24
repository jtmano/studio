
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
import { Dumbbell, LineChart, Lightbulb } from 'lucide-react';

export default function FitnessFocusPage() {
  const { toast } = useToast();

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise[]>([]);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | undefined>(undefined);
  const [initialTemplateWorkout, setInitialTemplateWorkout] = useState<WorkoutExercise[]>([]);

  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true); // Start true for initial load
  const [isLoggingWorkout, setIsLoggingWorkout] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true); // Start true for initial load
  const [workoutHistory, setWorkoutHistory] = useState<LoggedSetDatabaseEntry[]>([]); // Now stores flat LoggedSetDatabaseEntry[]
  
  const [isSavingState, setIsSavingState] = useState<boolean>(false);
  const [isLoadingWeekDay, setIsLoadingWeekDay] = useState<boolean>(false);
  const [isPopulatingWorkout, setIsPopulatingWorkout] = useState<boolean>(false);
  
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

  const fetchTemplateForDay = useCallback(async (day: number) => {
    setIsLoadingTemplate(true);
    toast({ title: "Loading Template...", description: `Fetching structure for Day ${day}.` });
    try {
      const template = await loadWorkoutTemplate(day);
      let exercisesToSet: WorkoutExercise[];
      let templateNameToSet: string;

      if (template && template.exercises) {
        // Ensure template exercises have necessary fields
        exercisesToSet = template.exercises.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          tool: ex.tool || "",
          targetMuscleGroup: ex.targetMuscleGroup || "",
          sets: ex.sets.map((s: IndividualSet) => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
            targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
            loggedWeight: "", // Start blank, will be populated from history if available
            loggedReps: "",   // Start blank
            notes: s.notes || "",
            isCompleted: s.isCompleted || false,
          })),
        }));
        templateNameToSet = template.name;
        toast({ title: "Template Loaded", description: `${template.name}. Populating from history...` });
      } else {
        exercisesToSet = getDefaultExercise();
        templateNameToSet = `Day ${day} (Default Blank)`;
        toast({ title: "No Template Found", description: `Loaded blank structure for Day ${day}. Populating from history...`, variant: "default" });
      }

      // Populate from workoutHistory (flat list of LoggedSetDatabaseEntry)
      if (workoutHistory && workoutHistory.length > 0) {
        const populatedExercises = exercisesToSet.map(templateExercise => {
          const newSets = templateExercise.sets.map(templateSet => {
            // Find the most recent history entry for this specific exercise and set number
            // workoutHistory is sorted by id DESC (most recent first) in getWorkoutHistory
            const matchingHistoryEntry = workoutHistory.find(
              histEntry => 
                histEntry.Exercise === templateExercise.name &&
                (histEntry.Tool || "") === (templateExercise.tool || "") &&
                histEntry.SetNumber === templateSet.setNumber
            );

            if (matchingHistoryEntry) {
              return {
                ...templateSet,
                loggedWeight: (matchingHistoryEntry.Weight !== undefined && matchingHistoryEntry.Weight !== null) ? String(matchingHistoryEntry.Weight) : "",
                loggedReps: (matchingHistoryEntry.Reps !== undefined && matchingHistoryEntry.Reps !== null) ? Number(matchingHistoryEntry.Reps) : "",
              };
            }
            return templateSet; // No matching logged set, keep template set as is (blank loggedWeight/Reps)
          });
          return { ...templateExercise, sets: newSets };
        });
        exercisesToSet = populatedExercises;
      }

      setCurrentWorkout(exercisesToSet);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(exercisesToSet))); // Deep copy
      setLoadedTemplateName(templateNameToSet);

    } catch (error) {
      console.error("Failed to load template and populate from history:", error);
      const defaultWorkout = getDefaultExercise();
      setCurrentWorkout(defaultWorkout);
      setInitialTemplateWorkout(JSON.parse(JSON.stringify(defaultWorkout)));
      setLoadedTemplateName(`Day ${day} (Error Loading)`);
      toast({ title: "Error Loading Workout", description: (error as Error).message || "Could not load workout.", variant: "destructive" });
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [
    getDefaultExercise, 
    toast, 
    workoutHistory // workoutHistory is now a dependency
  ]);


  useEffect(() => {
    if (isLoadingWeekDay || isPopulatingWorkout) {
      return; 
    }
    if (justLoadedStateRef.current) {
      justLoadedStateRef.current = false; 
      // console.log("Just loaded state, skipping template fetch for now.");
      return;
    }
    // console.log(`Effect for selectedDay ${selectedDay} triggered. Calling fetchTemplateForDay.`);
    fetchTemplateForDay(selectedDay);
  }, [selectedDay, fetchTemplateForDay, isLoadingWeekDay, isPopulatingWorkout]);


  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const historyData = await getWorkoutHistory(); // Returns LoggedSetDatabaseEntry[]
      setWorkoutHistory(historyData);
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
      const result = await logWorkout(selectedWeek, selectedDay, currentWorkout);
      if (result.success) {
        toast({ title: "Workout Logged!", description: `${result.loggedSetsCount} sets for Week ${selectedWeek}, Day ${selectedDay} saved.` });
        fetchHistory(); // Refresh history
      } else {
        toast({ title: "Logging Partially Failed", description: result.error || "Could not save your workout completely.", variant: "destructive" });
      }
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
      targetMuscleGroup: ex.targetMuscleGroup || "",
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
      targetMuscleGroup: ex.targetMuscleGroup || "",
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
  }, [currentWorkout, initialTemplateWorkout, loadedTemplateName, selectedDay, selectedWeek, toast]);

  const handleLoadWeekAndDay = useCallback(async () => {
    setIsLoadingWeekDay(true);
    justLoadedStateRef.current = false; // Allow template to load for the new day
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState) {
        setSelectedWeek(loadedState.selectedWeek);
        setSelectedDay(loadedState.selectedDay); 
        // Template for the new day will be fetched by the useEffect watching selectedDay
        toast({ title: "Week & Day Loaded", description: `Switched to Week ${loadedState.selectedWeek}, Day ${loadedState.selectedDay}. Template loading...` });
      } else {
        toast({ title: "No Saved State", description: "No saved state found to load week/day from.", variant: "default" });
      }
    } catch (error) {
      console.error("Failed to load week/day from app state:", error);
      toast({ title: "Load Failed", description: "Could not load week/day.", variant: "destructive" });
    } finally {
      setIsLoadingWeekDay(false);
    }
  }, [toast]);

  const handlePopulateLoggedInfo = useCallback(async () => {
    setIsPopulatingWorkout(true);
    justLoadedStateRef.current = true; // Prevent template fetch from overwriting this
    try {
      const loadedState = await loadCurrentAppState();
      if (loadedState && loadedState.currentWorkout) {
        const clonedCurrentWorkout = JSON.parse(JSON.stringify(loadedState.currentWorkout || []));
        const clonedInitialTemplateWorkout = JSON.parse(JSON.stringify(loadedState.initialTemplateWorkout || []));

        const processedCurrentWorkout = clonedCurrentWorkout.map((ex: WorkoutExercise) => ({
          ...ex,
          id: ex.id || crypto.randomUUID(),
          tool: ex.tool || "",
          targetMuscleGroup: ex.targetMuscleGroup || "",
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
          targetMuscleGroup: ex.targetMuscleGroup || "",
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
        setLoadedTemplateName(loadedState.loadedTemplateName); // Use template name from saved state
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
      setIsPopulatingWorkout(false);
    }
  }, [toast]);

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
              isLoadingTemplate={isLoadingTemplate || isLoadingWeekDay || isPopulatingWorkout || isLoadingHistory}
            />
            <WorkoutLogger
              currentWorkout={currentWorkout}
              setCurrentWorkout={setCurrentWorkout}
              onLogWorkout={handleLogWorkout}
              onSaveCurrentState={handleSaveCurrentState} 
              onLoadWeekAndDay={handleLoadWeekAndDay}
              onPopulateLoggedInfo={handlePopulateLoggedInfo}
              onResetTemplate={handleResetToTemplate}
              isLoading={isLoadingTemplate || isLoadingHistory} // Combine template and history loading
              isLogging={isLoggingWorkout}
              isSavingState={isSavingState} 
              isLoadingWeekDay={isLoadingWeekDay}
              isPopulatingWorkout={isPopulatingWorkout}
              templateName={loadedTemplateName}
              selectedDay={selectedDay}
            />
          </TabsContent>

          <TabsContent value="progress">
            {/* ProgressDisplay might need adjustment if workoutHistory structure for display changes */}
            <ProgressDisplay historyFlat={workoutHistory} isLoading={isLoadingHistory} />
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
    
