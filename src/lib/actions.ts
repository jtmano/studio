
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutExercise, IndividualSet, LoggedSetInfo, SerializableAppState, LoggedSetDatabaseEntry } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";
import { processLoadedWorkout, processWorkoutForPersistence } from "./utils";

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase "Templates" table`);

  const { data: templateRows, error } = await supabase
    .from('Templates')
    .select('Exercise, Tool')
    .eq('Day', dayIdentifier);

  if (error) {
    console.error("Error fetching template from Supabase:", error);
    // A 400 error from Supabase will be caught here.
    // Details of the error object are crucial for debugging (e.g., error.message, error.details, error.hint)
    return null;
  }

  if (!templateRows || templateRows.length === 0) {
    console.log(`No template found for day ${dayIdentifier} in Supabase "Templates" table.`);
    return null;
  }

  const exercisesMap = new Map<string, WorkoutExercise>();

  templateRows.forEach((row) => {
    const exerciseName = row.Exercise;
    const toolName = row.Tool; // Might be null

    // Use a consistent key for the map, handling null tools
    const exerciseKey = `${exerciseName}-${toolName || 'notool'}`;

    if (!exercisesMap.has(exerciseKey)) {
      exercisesMap.set(exerciseKey, {
        id: crypto.randomUUID(),
        name: exerciseName,
        tool: toolName || "", 
        targetMuscleGroup: "", // Default to empty string as "Target Group" is not in the Templates table
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
          // SetNumber is not included as it's not in the confirmed schema
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
  
  // The data from supabase already matches the LoggedSetDatabaseEntry type, so a direct cast is fine
  return data as LoggedSetDatabaseEntry[];
}

export async function saveCurrentAppState(appState: SerializableAppState): Promise<void> {
  console.log("Saving current app state to Supabase with ID 1");

  // Use the utility function to ensure data is clean before saving
  const cleanAppState = {
    ...appState,
    currentWorkout: processWorkoutForPersistence(appState.currentWorkout),
    initialTemplateWorkout: processWorkoutForPersistence(appState.initialTemplateWorkout),
  };

  const { data, error } = await supabase
    .from('Current State')
    .upsert({ id: 1, state_data: cleanAppState, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select();

  if (error) {
    console.error("Error saving app state to Supabase:", error);
    throw new Error(`Failed to save app state: ${error.message}`);
  }
  console.log("App state saved successfully to Supabase:", data);
}

export async function loadCurrentAppState(): Promise<SerializableAppState | null> {
  console.log("Loading current app state from Supabase with ID 1");

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
    console.log("App state loaded successfully from Supabase.");
    const loadedState = data.state_data as any;
    
    // Use the utility function to process loaded data
    const validatedState: SerializableAppState = {
        selectedWeek: loadedState.selectedWeek || 1,
        selectedDay: loadedState.selectedDay || 1,
        currentWorkout: processLoadedWorkout(loadedState.currentWorkout),
        loadedTemplateName: loadedState.loadedTemplateName || undefined,
        initialTemplateWorkout: processLoadedWorkout(loadedState.initialTemplateWorkout),
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

    