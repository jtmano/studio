
// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutExercise, IndividualSet, LoggedSetInfo, Exercise as AISuggestionExerciseType } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient";

// Mock database for history (saving routine will need update if it uses mockTemplates)
let mockWorkoutHistory: WorkoutHistoryItem[] = [];
let nextHistoryId = 1;

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase`);
  await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network delay

  const { data: templateRows, error } = await supabase
    .from('Templates')
    .select('Exercise, Tool') // Assuming these are columns for exercise name and tool
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
        id: crypto.randomUUID(), // Unique ID for this exercise type in the workout
        name: exerciseName,
        tool: toolName,
        sets: [],
      });
    }

    const currentExercise = exercisesMap.get(exerciseKey)!;
    currentExercise.sets.push({
      id: crypto.randomUUID(), // Unique ID for this specific set
      setNumber: currentExercise.sets.length + 1,
      // Target weight/reps from template are not in DB schema, so user fills them
      // Or, if your DB has target_weight, target_reps, use row.target_weight, row.target_reps
      targetWeight: "", // Default or from row if available
      targetReps: undefined, // Default or from row if available
      loggedWeight: "", // Initially empty, user fills this
      loggedReps: "",   // Initially empty, user fills this
      isCompleted: false,
    });
  });

  return {
    id: `supabase-day-${dayIdentifier}-${crypto.randomUUID()}`,
    name: `Day ${dayIdentifier} Workout`, // You might want a 'TemplateName' column in Supabase
    dayIdentifier: dayIdentifier,
    exercises: Array.from(exercisesMap.values()),
  };
}

export async function logWorkout(week: number, day: number, currentWorkoutExercises: WorkoutExercise[]): Promise<WorkoutHistoryItem> {
  console.log(`Logging workout for Week ${week}, Day ${day}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const loggedSets: LoggedSetInfo[] = [];
  currentWorkoutExercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.isCompleted) {
        loggedSets.push({
          exerciseName: exercise.name,
          tool: exercise.tool,
          setNumber: set.setNumber,
          weight: set.loggedWeight, // Log the values entered by the user
          reps: set.loggedReps,     // Log the values entered by the user
          notes: set.notes,
        });
      }
    });
  });

  if (loggedSets.length === 0) {
    // Or handle as you see fit, maybe log an empty workout or prevent it
    console.log("No sets were completed. Not logging an empty workout history item.");
    // Depending on desired behavior, you might throw an error or return a specific status
    throw new Error("No sets were marked as completed. Workout not logged.");
  }

  const newEntry: WorkoutHistoryItem = {
    id: `hist${nextHistoryId++}`,
    date: new Date().toISOString(),
    week,
    day,
    // workoutName: "Dynamic Workout", // Consider how to get this if needed
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

export async function saveRoutine(name: string, dayIdentifier: number, exercisesToSave: WorkoutExercise[]): Promise<WorkoutTemplate> {
  console.log(`Saving routine: ${name} for day identifier ${dayIdentifier}`);
  // This function needs to be adapted if you want to save to Supabase.
  // The current implementation is mock and may not align perfectly with new types if it used old mockTemplates.
  // For now, it constructs a new template based on the WorkoutExercise[] structure.
  await new Promise(resolve => setTimeout(resolve, 500));

  // Ensure exercisesToSave are deep copied and IDs are fresh if necessary
  const processedExercises = exercisesToSave.map(ex => ({
    ...ex,
    id: crypto.randomUUID(), // New ID for the exercise in this template
    sets: ex.sets.map(s => ({
      ...s,
      id: crypto.randomUUID(), // New ID for the set in this template
      // When saving as a template, loggedWeight/loggedReps become targetWeight/targetReps
      targetWeight: s.loggedWeight,
      targetReps: s.loggedReps ? Number(s.loggedReps) : undefined,
      loggedWeight: "", // Clear logged values for template
      loggedReps: "",
      isCompleted: false, // Reset completion status for template
    })),
  }));

  const newTemplate: WorkoutTemplate = {
    id: `tpl-dynamic-${crypto.randomUUID()}`,
    name,
    dayIdentifier,
    exercises: processedExercises,
  };
  // mockTemplates.push(newTemplate); // This was for the old mock system.
  console.log("Routine saved (conceptually):", newTemplate);
  // Here you would implement Supabase insert logic for the template and its exercises/sets.
  // This might involve inserting into multiple tables if your Supabase schema is normalized.
  // For now, we return the created template object.
  return newTemplate;
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
