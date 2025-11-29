
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutExercise, IndividualSet, LoggedSetInfo, SerializableAppState, LoggedSetDatabaseEntry } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";
import { processLoadedWorkout, processWorkoutForPersistence } from "./utils";

// NOTE: loadCurrentAppState and saveCurrentAppState have been moved to client-side
// local-storage.ts to support offline functionality.

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase "Templates" table`);

  const { data: templateRows, error } = await supabase
    .from('Templates')
    .select('Exercise, Tool')
    .eq('Day', dayIdentifier);

  if (error) {
    console.error("Error fetching template from Supabase:", error);
    return null;
  }

  if (!templateRows || templateRows.length === 0) {
    console.log(`No template found for day ${dayIdentifier} in Supabase "Templates" table.`);
    return null;
  }

  const exercisesMap = new Map<string, WorkoutExercise>();

  templateRows.forEach((row) => {
    const exerciseName = row.Exercise;
    const toolName = row.Tool;

    const exerciseKey = `${exerciseName}-${toolName || 'notool'}`;

    if (!exercisesMap.has(exerciseKey)) {
      exercisesMap.set(exerciseKey, {
        id: crypto.randomUUID(),
        name: exerciseName,
        tool: toolName || "", 
        targetMuscleGroup: "",
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

export async function logWorkout(week: number, day: number, currentWorkoutExercises: WorkoutExercise[]): Promise<{ success: boolean; loggedSetsCount: number; error?: string }> {
  console.log(`Logging workout for Week ${week}, Day ${day} to Supabase "Workout History" table`);
  let loggedSetsCount = 0;
  const setsToInsert = [];

  for (const exercise of currentWorkoutExercises) {
    for (const set of exercise.sets) {
      if (set.isCompleted) {
        const weightAsNumber = Number(String(set.loggedWeight).trim());
        const repsAsNumber = Number(String(set.loggedReps).trim());

        setsToInsert.push({
          Week: week,
          Day: day,
          "Target Group": exercise.targetMuscleGroup || null, 
          Exercise: exercise.name,
          Weight: isNaN(weightAsNumber) ? null : weightAsNumber,
          Reps: isNaN(repsAsNumber) ? null : repsAsNumber,
          Completed: true,
          Tool: exercise.tool || null,
        });
        loggedSetsCount++;
      }
    }
  }

  if (loggedSetsCount === 0) {
     return { success: true, loggedSetsCount: 0, error: "No completed sets to log." };
  }

  const { error } = await supabase
    .from('Workout History') 
    .insert(setsToInsert);

  if (error) {
    console.error("Failed to log workout sets to Supabase \"Workout History\":", error);
    return { success: false, loggedSetsCount: 0, error: `Supabase error: ${error.message}` };
  }

  console.log(`${loggedSetsCount} sets logged to Supabase "Workout History".`);
  return { success: true, loggedSetsCount };
}


export async function getWorkoutHistory(): Promise<LoggedSetDatabaseEntry[]> {
  console.log("Fetching workout history from Supabase \"Workout History\" table");

  const { data, error } = await supabase
    .from('Workout History')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error fetching workout history from Supabase:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data as LoggedSetDatabaseEntry[];
}

export async function saveCurrentState(appState: Partial<SerializableAppState>): Promise<{ success: boolean; error?: string }> {
  console.log("Saving current state to Supabase \"Current State\" table");

  const { error } = await supabase
    .from('Current State')
    .upsert(
      { id: 1, state_data: appState, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    console.error("Failed to save current state to Supabase:", error);
    return { success: false, error: `Supabase error: ${error.message}` };
  }

  console.log("Current state saved to Supabase.");
  return { success: true };
}

export async function loadCurrentState(): Promise<{ success: boolean; data?: SerializableAppState; error?: string }> {
  console.log("Loading current state from Supabase \"Current State\" table");

  const { data, error } = await supabase
    .from('Current State')
    .select('state_data')
    .eq('id', 1)
    .single();

  if (error) {
    console.error("Failed to load current state from Supabase:", error);
    return { success: false, error: `Supabase error: ${error.message}` };
  }

  if (!data || !data.state_data) {
    return { success: false, error: "No saved state found." };
  }

  console.log("Current state loaded from Supabase.");
  return { success: true, data: data.state_data as SerializableAppState };
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
