
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutExercise, IndividualSet, LoggedSetInfo, Exercise as AISuggestionExerciseType, SerializableAppState } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";

// Mock database for history is no longer used for primary storage.
// let mockWorkoutHistory: WorkoutHistoryItem[] = [];
// let nextHistoryId = 1; // No longer needed for mock data

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase`);
  await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network delay

  const { data: templateRows, error } = await supabase
    .from('Templates')
    .select('Exercise, Tool')
    .eq('Day', dayIdentifier);

  if (error) {
    console.error("Error fetching template from Supabase:", error);
    return null;
  }

  if (!templateRows || templateRows.length === 0) {
    console.log(`No template found for day ${dayIdentifier} in Supabase.`);
    return null;
  }

  const exercisesMap = new Map<string, WorkoutExercise>();

  templateRows.forEach((row, index) => {
    const exerciseName = row.Exercise;
    const toolName = row.Tool;
    const exerciseKey = `${exerciseName}-${toolName || 'notool'}`;

    if (!exercisesMap.has(exerciseKey)) {
      exercisesMap.set(exerciseKey, {
        id: crypto.randomUUID(),
        name: exerciseName,
        tool: toolName,
        sets: [],
      });
    }

    const currentExercise = exercisesMap.get(exerciseKey)!;
    currentExercise.sets.push({
      id: crypto.randomUUID(),
      setNumber: currentExercise.sets.length + 1,
      targetWeight: "",
      targetReps: undefined,
      loggedWeight: "",
      loggedReps: "",
      isCompleted: false,
      notes: "",
    });
  });

  return {
    id: `supabase-day-${dayIdentifier}-${crypto.randomUUID()}`,
    name: `Day ${dayIdentifier} Workout`,
    dayIdentifier: dayIdentifier,
    exercises: Array.from(exercisesMap.values()),
  };
}

export async function logWorkout(week: number, day: number, currentWorkoutExercises: WorkoutExercise[]): Promise<WorkoutHistoryItem> {
  console.log(`Logging workout for Week ${week}, Day ${day} to Supabase`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Shorter delay as DB is real

  const loggedSets: LoggedSetInfo[] = [];
  currentWorkoutExercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.isCompleted) {
        loggedSets.push({
          exerciseName: exercise.name,
          tool: exercise.tool,
          setNumber: set.setNumber,
          weight: set.loggedWeight,
          reps: set.loggedReps,
          notes: set.notes,
        });
      }
    });
  });

  if (loggedSets.length === 0) {
    throw new Error("No sets were marked as completed. Workout not logged.");
  }

  const newEntryId = crypto.randomUUID();
  const newWorkoutDate = new Date().toISOString();

  // Data to insert into Supabase "Workout History" table
  const historyEntryToSave = {
    id: newEntryId,
    date: newWorkoutDate,
    week: week,
    day: day,
    // workout_name: `Workout Week ${week}, Day ${day}`, // Optional: if you want to save a name
    logged_sets: loggedSets, // This will be stored in a JSONB column
  };

  const { data, error } = await supabase
    .from('Workout History')
    .insert([historyEntryToSave])
    .select()
    .single(); // Assuming insert returns the inserted row

  if (error) {
    console.error("Failed to log workout to Supabase:", error);
    throw new Error(`Could not save your workout to Supabase: ${error.message}`);
  }

  console.log("Workout logged to Supabase:", data);
  
  // Construct the WorkoutHistoryItem to return, mapping Supabase columns to type keys
  const loggedItem: WorkoutHistoryItem = {
    id: data.id,
    date: data.date,
    week: data.week,
    day: data.day,
    workoutName: data.workout_name, // if you have workout_name column
    loggedSets: data.logged_sets as LoggedSetInfo[],
  };

  return loggedItem;
}


export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  console.log("Fetching workout history from Supabase");
  await new Promise(resolve => setTimeout(resolve, 100)); // Shorter delay

  const { data, error } = await supabase
    .from('Workout History')
    .select('*') // Select all columns
    .order('date', { ascending: false }); // Get most recent first

  if (error) {
    console.error("Error fetching workout history from Supabase:", error);
    return []; // Return empty array on error or throw
  }

  if (!data) {
    return [];
  }

  // Map Supabase rows to WorkoutHistoryItem type
  const historyItems: WorkoutHistoryItem[] = data.map((item: any) => ({
    id: item.id,
    date: item.date, // Supabase typically returns ISO string for timestamptz
    week: item.week,
    day: item.day,
    workoutName: item.workout_name, // Map workout_name from DB to workoutName
    loggedSets: item.logged_sets as LoggedSetInfo[], // Cast JSONB data
  }));

  return historyItems;
}

// Function to save the current app state to Supabase
export async function saveCurrentAppState(appState: SerializableAppState): Promise<void> {
  console.log("Saving current app state to Supabase with ID 1:", appState);
  await new Promise(resolve => setTimeout(resolve, 300));

  const { data, error } = await supabase
    .from('Current State')
    .upsert({ id: 1, state_data: appState, updated_at: new Date().toISOString() })
    .select();

  if (error) {
    console.error("Error saving app state to Supabase:", error);
    throw new Error(`Failed to save app state: ${error.message}`);
  }
  console.log("App state saved successfully to Supabase:", data);
}

// Function to load the current app state from Supabase
export async function loadCurrentAppState(): Promise<SerializableAppState | null> {
  console.log("Loading current app state from Supabase with ID 1");
  await new Promise(resolve => setTimeout(resolve, 300));

  const { data, error } = await supabase
    .from('Current State')
    .select('state_data')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error("Error loading app state from Supabase:", error);
    return null;
  }

  if (data && data.state_data) {
    console.log("App state loaded successfully from Supabase:", data.state_data);
    // Ensure the loaded state structure matches SerializableAppState
    const loadedState = data.state_data as any; // Cast to any for flexible checking
    const validatedState: SerializableAppState = {
        selectedWeek: loadedState.selectedWeek || 1,
        selectedDay: loadedState.selectedDay || 1,
        currentWorkout: (loadedState.currentWorkout || []).map((ex: any) => ({
            ...ex,
            id: ex.id || crypto.randomUUID(),
            tool: ex.tool || "",
            sets: (ex.sets || []).map((s: any) => ({
                ...s,
                id: s.id || crypto.randomUUID(),
                notes: s.notes || "",
                targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
                targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
                loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
                loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
                isCompleted: s.isCompleted || false,
            }))
        })),
        loadedTemplateName: loadedState.loadedTemplateName || undefined,
        initialTemplateWorkout: (loadedState.initialTemplateWorkout || []).map((ex: any) => ({
             ...ex,
            id: ex.id || crypto.randomUUID(),
            tool: ex.tool || "",
            sets: (ex.sets || []).map((s: any) => ({
                ...s,
                id: s.id || crypto.randomUUID(),
                notes: s.notes || "",
                targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
                targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
                loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
                loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
                isCompleted: s.isCompleted || false,
            }))
        })),
    };
    return validatedState;
  } else {
    console.log("No saved app state found in Supabase.");
    return null;
  }
}

export async function suggestExercise(input: SuggestExerciseInput): Promise<SuggestExerciseOutput> {
  console.log("Requesting AI exercise suggestion with input:", input);
  try {
    const suggestion = await performAiExerciseSuggestion(input);
    console.log("AI suggestion received:", suggestion);
    return suggestion;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    throw new Error("Failed to get exercise suggestion from AI.");
  }
}
    