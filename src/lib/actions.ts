
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutExercise, IndividualSet, LoggedSetInfo, Exercise as AISuggestionExerciseType, SerializableAppState, LoggedSetDatabaseEntry } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase "Templates" table`);
  await new Promise(resolve => setTimeout(resolve, 250)); 

  const { data: templateRows, error } = await supabase
    .from('Templates')
    .select('Exercise, Tool, "Target Group"') // Assuming "Target Group" is the column name
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

  templateRows.forEach((row) => {
    const exerciseName = row.Exercise;
    const toolName = row.Tool;
    const targetGroup = row["Target Group"];
    const exerciseKey = `${exerciseName}-${toolName || 'notool'}`;

    if (!exercisesMap.has(exerciseKey)) {
      exercisesMap.set(exerciseKey, {
        id: crypto.randomUUID(),
        name: exerciseName,
        tool: toolName,
        targetMuscleGroup: targetGroup,
        sets: [],
      });
    }

    const currentExercise = exercisesMap.get(exerciseKey)!;
    currentExercise.sets.push({
      id: crypto.randomUUID(),
      setNumber: currentExercise.sets.length + 1,
      targetWeight: "", // Template doesn't store target weight/reps per set
      targetReps: undefined,
      loggedWeight: "",   // Will be populated from history if available
      loggedReps: "",     // Will be populated from history if available
      isCompleted: false,
      notes: "",
    });
  });

  return {
    id: `supabase-day-${dayIdentifier}-${crypto.randomUUID()}`,
    name: `Day ${dayIdentifier} Workout`, // You can customize this name
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
          "Set Number": set.setNumber,
        });
        loggedSetsCount++;
      }
    }
  }

  if (loggedSetsCount === 0) {
    // console.warn("No sets were marked as completed. Workout not logged.");
    // throw new Error("No sets were marked as completed. Workout not logged.");
    // Instead of throwing, let's return a status. The UI can decide how to handle this.
     return { success: false, loggedSetsCount: 0, error: "No sets were marked as completed." };
  }

  const { error } = await supabase
    .from('Workout History')
    .insert(setsToInsert);

  if (error) {
    console.error("Failed to log workout sets to Supabase:", error);
    // throw new Error(`Could not save your workout to Supabase "Workout History": ${error.message}`);
    return { success: false, loggedSetsCount: 0, error: `Supabase error: ${error.message}` };
  }

  console.log(`${loggedSetsCount} sets logged to Supabase "Workout History".`);
  return { success: true, loggedSetsCount };
}


export async function getWorkoutHistory(): Promise<LoggedSetDatabaseEntry[]> {
  console.log("Fetching workout history from Supabase \"Workout History\" table");
  await new Promise(resolve => setTimeout(resolve, 100));

  const { data, error } = await supabase
    .from('Workout History')
    .select('*')
    .order('id', { ascending: false }); // Get most recent entries first (assuming id is auto-incrementing PK)

  if (error) {
    console.error("Error fetching workout history from Supabase:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map Supabase rows to LoggedSetDatabaseEntry type
  // The column names in Supabase use spaces, so access them with bracket notation.
  const historyEntries: LoggedSetDatabaseEntry[] = data.map((item: any) => ({
    id: item.id,
    Week: item.Week,
    Day: item.Day,
    TargetGroup: item["Target Group"],
    Exercise: item.Exercise,
    Weight: item.Weight,
    Reps: item.Reps,
    Completed: item.Completed,
    Tool: item.Tool,
    SetNumber: item["Set Number"],
  }));

  return historyEntries;
}

// Function to save the current app state to Supabase
export async function saveCurrentAppState(appState: SerializableAppState): Promise<void> {
  console.log("Saving current app state to Supabase with ID 1:", appState);
  await new Promise(resolve => setTimeout(resolve, 300));

  const { data, error } = await supabase
    .from('Current State')
    .upsert({ id: 1, state_data: appState, updated_at: new Date().toISOString() }, { onConflict: 'id' })
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
    const loadedState = data.state_data as any; 
    const validatedState: SerializableAppState = {
        selectedWeek: loadedState.selectedWeek || 1,
        selectedDay: loadedState.selectedDay || 1,
        currentWorkout: (loadedState.currentWorkout || []).map((ex: any) => ({
            ...ex,
            id: ex.id || crypto.randomUUID(),
            tool: ex.tool || "",
            targetMuscleGroup: ex.targetMuscleGroup || "",
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
            targetMuscleGroup: ex.targetMuscleGroup || "",
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
    
