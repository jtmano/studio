// @ts-nocheck
"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutLogEntry, Exercise } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { supabase } from "./supabaseClient"; // Import Supabase client

// Mock database for other functions (history, saving routine)
let mockTemplates: WorkoutTemplate[] = [
  // This array will no longer be used by loadWorkoutTemplate but kept for other functions or future use.
  { id: "tpl1", name: "Day 1: Push Power (Mock)", dayIdentifier: 1, exercises: [
    { id: "ex1", name: "Bench Press", sets: 3, reps: 8, weight: "50kg", tool: "Barbell" },
    { id: "ex2", name: "Overhead Press", sets: 3, reps: 10, weight: "30kg", tool: "Barbell" },
    { id: "ex3", name: "Tricep Dips", sets: 3, reps: 12, weight: "Bodyweight", tool: "Bodyweight" },
  ]},
   { id: "tpl2", name: "Day 2: Pull Strength (Mock)", dayIdentifier: 2, exercises: [
    { id: "ex4", name: "Deadlifts", sets: 1, reps: 5, weight: "100kg", tool: "Barbell" },
    { id: "ex5", name: "Pull Ups", sets: 3, reps: 8, weight: "Bodyweight", tool: "Bodyweight" },
    { id: "ex6", name: "Barbell Rows", sets: 3, reps: 10, weight: "60kg", tool: "Barbell" },
  ]},
  { id: "tpl3", name: "Day 3: Leg Day (Mock)", dayIdentifier: 3, exercises: [
    { id: "ex7", name: "Squats", sets: 3, reps: 8, weight: "80kg", tool: "Barbell" },
    { id: "ex8", name: "Leg Press", sets: 3, reps: 12, weight: "120kg", tool: "Machine" },
    { id: "ex9", name: "Hamstring Curls", sets: 3, reps: 15, weight: "40kg", tool: "Machine" },
  ]},
  { id: "tpl4", name: "Day 4: Upper Body Hypertrophy (Mock)", dayIdentifier: 4, exercises: [
    { id: "ex10", name: "Incline Dumbbell Press", sets: 4, reps: 12, weight: "20kg", tool: "Dumbbell" },
    { id: "ex11", name: "Lat Pulldowns", sets: 4, reps: 12, weight: "50kg", tool: "Machine" },
    { id: "ex12", name: "Dumbbell Shoulder Press", sets: 4, reps: 15, weight: "15kg", tool: "Dumbbell" },
  ]},
  { id: "tpl5", name: "Day 5: Full Body Conditioning (Mock)", dayIdentifier: 5, exercises: [
    { id: "ex13", name: "Kettlebell Swings", sets: 3, reps: 20, weight: "16kg", tool: "Kettlebell" },
    { id: "ex14", name: "Box Jumps", sets: 3, reps: 10, weight: "Bodyweight", tool: "Plyo Box" },
    { id: "ex15", name: "Plank", sets: 3, reps: 60, weight: "Bodyweight", tool: "Bodyweight" }, // reps as seconds
  ]},
];

let mockWorkoutHistory: WorkoutHistoryItem[] = [];
let nextHistoryId = 1;
let nextTemplateIdCounter = mockTemplates.length + 1; // For mock saveRoutine if used

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier} from Supabase`);
  await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network delay

  const { data: templateRows, error } = await supabase
    .from('Templates') // Ensure this table name matches your Supabase table
    .select('Exercise, Tool') // Column names from your screenshot
    .eq('Day', dayIdentifier); // 'Day' column from your screenshot

  if (error) {
    console.error("Error fetching template from Supabase:", error);
    return null;
  }

  if (!templateRows || templateRows.length === 0) {
    console.log(`No template found for day ${dayIdentifier} in Supabase.`);
    return null;
  }

  const groupedExercises = new Map<string, Exercise>();

  templateRows.forEach(row => {
    // Ensure correct casing for 'Exercise' and 'Tool' if necessary
    const exerciseName = row.Exercise;
    const toolName = row.Tool;
    const key = `${exerciseName}-${toolName}`;

    if (groupedExercises.has(key)) {
      const existingExercise = groupedExercises.get(key)!;
      existingExercise.sets = (existingExercise.sets || 0) + 1;
    } else {
      groupedExercises.set(key, {
        id: crypto.randomUUID(),
        name: exerciseName,
        tool: toolName,
        sets: 1,
        reps: 10, // Default reps
        weight: "", // Default weight
      });
    }
  });

  const exercisesArray = Array.from(groupedExercises.values());

  return {
    id: `supabase-day-${dayIdentifier}-${crypto.randomUUID()}`,
    name: `Day ${dayIdentifier} Workout`,
    dayIdentifier: dayIdentifier,
    exercises: exercisesArray,
  };
}

export async function logWorkout(week: number, day: number, exercises: WorkoutLogEntry[]): Promise<WorkoutHistoryItem> {
  console.log(`Logging workout for Week ${week}, Day ${day}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  const newEntry: WorkoutHistoryItem = {
    id: `hist${nextHistoryId++}`,
    date: new Date().toISOString(),
    week,
    day,
    exercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
  };
  mockWorkoutHistory.unshift(newEntry); // Add to beginning for recent first
  console.log("Workout logged:", newEntry);
  return newEntry;
}

export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  console.log("Fetching workout history");
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(mockWorkoutHistory)); // Deep copy
}

export async function saveRoutine(name: string, dayIdentifier: number, exercises: Exercise[]): Promise<WorkoutTemplate> {
  console.log(`Saving routine (mock): ${name} for day identifier ${dayIdentifier}`);
  // This function still uses the mockTemplates array. 
  // To save to Supabase, this would need to be rewritten.
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTemplate: WorkoutTemplate = {
    id: `tpl-mock-${nextTemplateIdCounter++}`,
    name,
    dayIdentifier,
    exercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
  };
  // mockTemplates.push(newTemplate); // Decide if you want to add to the mock list
  console.log("Routine saved (mock):", newTemplate);
  // For now, let's not interact with mockTemplates here to avoid confusion with Supabase loading
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
