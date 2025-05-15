
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutExercise, IndividualSet, LoggedSetInfo, Exercise as AISuggestionExerciseType, SerializableAppState } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";

// Mock database for history
let mockWorkoutHistory: WorkoutHistoryItem[] = [];
let nextHistoryId = 1;

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
  console.log(`Logging workout for Week ${week}, Day ${day}`);
  await new Promise(resolve => setTimeout(resolve, 500)); 

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

  const newEntry: WorkoutHistoryItem = {
    id: `hist${nextHistoryId++}`,
    date: new Date().toISOString(),
    week,
    day,
    loggedSets,
  };
  mockWorkoutHistory.unshift(newEntry);
  console.log("Workout logged:", newEntry);
  return newEntry;
}


export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  console.log("Fetching workout history");
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(mockWorkoutHistory));
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
    return data.state_data as SerializableAppState; 
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
