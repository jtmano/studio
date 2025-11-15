
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WorkoutExercise } from "@/types/fitness";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Processes a workout array to ensure all its values are in the correct format for UI display.
 * This is useful after loading data from a database or local storage.
 * @param workout - The workout data to process.
 * @returns A new workout array with sanitized values.
 */
export function processLoadedWorkout(workout: any[]): WorkoutExercise[] {
  if (!Array.isArray(workout)) return [];
  return workout.map(ex => ({
    ...ex,
    id: ex.id || crypto.randomUUID(),
    tool: ex.tool || "",
    targetMuscleGroup: ex.targetMuscleGroup || "",
    sets: Array.isArray(ex.sets) ? ex.sets.map((s: any) => ({
      ...s,
      id: s.id || crypto.randomUUID(),
      targetWeight: (s.targetWeight !== undefined && s.targetWeight !== null) ? String(s.targetWeight) : "",
      targetReps: (s.targetReps !== undefined && s.targetReps !== null) ? Number(s.targetReps) : undefined,
      loggedWeight: (s.loggedWeight !== undefined && s.loggedWeight !== null) ? String(s.loggedWeight) : "",
      loggedReps: (s.loggedReps === undefined || s.loggedReps === null || String(s.loggedReps).trim() === '') ? "" : Number(String(s.loggedReps).trim()),
      notes: s.notes || "",
      isCompleted: s.isCompleted || false,
    })) : [],
  }));
}

/**
 * Processes a workout array to ensure all its values are in the correct, serializable format for database persistence.
 * @param workout - The workout data to process.
 * @returns A new workout array with sanitized values ready for saving.
 */
export function processWorkoutForPersistence(workout: WorkoutExercise[]): WorkoutExercise[] {
   if (!Array.isArray(workout)) return [];
   return JSON.parse(JSON.stringify(workout.map(ex => ({
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
}

    