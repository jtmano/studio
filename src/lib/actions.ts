"use server";
import type { WorkoutTemplate, WorkoutHistoryItem, WorkoutLogEntry, Exercise } from "@/types/fitness";
import { suggestExercise as performAiExerciseSuggestion } from "@/ai/flows/suggest-exercise";
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";

// Mock database
let mockTemplates: WorkoutTemplate[] = [
  { id: "tpl1", name: "Day 1: Push Power", dayIdentifier: 1, exercises: [
    { id: "ex1", name: "Bench Press", sets: 3, reps: 8, weight: "50kg" },
    { id: "ex2", name: "Overhead Press", sets: 3, reps: 10, weight: "30kg" },
    { id: "ex3", name: "Tricep Dips", sets: 3, reps: 12, weight: "Bodyweight" },
  ]},
  { id: "tpl2", name: "Day 2: Pull Strength", dayIdentifier: 2, exercises: [
    { id: "ex4", name: "Deadlifts", sets: 1, reps: 5, weight: "100kg" },
    { id: "ex5", name: "Pull Ups", sets: 3, reps: 8, weight: "Bodyweight" },
    { id: "ex6", name: "Barbell Rows", sets: 3, reps: 10, weight: "60kg" },
  ]},
  { id: "tpl3", name: "Day 3: Leg Day", dayIdentifier: 3, exercises: [
    { id: "ex7", name: "Squats", sets: 3, reps: 8, weight: "80kg" },
    { id: "ex8", name: "Leg Press", sets: 3, reps: 12, weight: "120kg" },
    { id: "ex9", name: "Hamstring Curls", sets: 3, reps: 15, weight: "40kg" },
  ]},
  { id: "tpl4", name: "Day 4: Upper Body Hypertrophy", dayIdentifier: 4, exercises: [
    { id: "ex10", name: "Incline Dumbbell Press", sets: 4, reps: 12, weight: "20kg" },
    { id: "ex11", name: "Lat Pulldowns", sets: 4, reps: 12, weight: "50kg" },
    { id: "ex12", name: "Dumbbell Shoulder Press", sets: 4, reps: 15, weight: "15kg" },
  ]},
  { id: "tpl5", name: "Day 5: Full Body Conditioning", dayIdentifier: 5, exercises: [
    { id: "ex13", name: "Kettlebell Swings", sets: 3, reps: 20, weight: "16kg" },
    { id: "ex14", name: "Box Jumps", sets: 3, reps: 10, weight: "Bodyweight" },
    { id: "ex15", name: "Plank", sets: 3, reps: 60, weight: "Bodyweight" }, // reps as seconds
  ]},
];

let mockWorkoutHistory: WorkoutHistoryItem[] = [];
let nextHistoryId = 1;
let nextTemplateId = mockTemplates.length + 1;

export async function loadWorkoutTemplate(dayIdentifier: number): Promise<WorkoutTemplate | null> {
  console.log(`Loading template for day: ${dayIdentifier}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const template = mockTemplates.find(t => t.dayIdentifier === dayIdentifier) || null;
  if (template) {
    // Return a deep copy to prevent direct modification of the mock DB
    return JSON.parse(JSON.stringify(template));
  }
  return null;
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
  console.log(`Saving routine: ${name} for day identifier ${dayIdentifier}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTemplate: WorkoutTemplate = {
    id: `tpl${nextTemplateId++}`,
    name,
    dayIdentifier,
    exercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
  };
  mockTemplates.push(newTemplate);
  console.log("Routine saved:", newTemplate);
  return newTemplate;
}

export async function suggestExercise(input: SuggestExerciseInput): Promise<SuggestExerciseOutput> {
  console.log("Requesting AI exercise suggestion with input:", input);
  try {
    // The actual AI call is already a server function, so we just call it.
    const suggestion = await performAiExerciseSuggestion(input);
    console.log("AI suggestion received:", suggestion);
    return suggestion;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    throw new Error("Failed to get exercise suggestion from AI.");
  }
}
