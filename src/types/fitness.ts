export interface Exercise {
  id: string; // Can be DB id or client-generated UUID for new exercises
  name: string;
  sets?: number;
  reps?: number;
  weight?: number | string; // string to allow "bodyweight" or ranges like "5-10kg"
  targetMuscleGroup?: string; // For AI suggestion context
}

export interface WorkoutLogEntry extends Exercise {
  // Inherits fields from Exercise
  // Specific logged values for sets, reps, weight are stored here
}

export interface WorkoutDay {
  day: number; // Typically 1-5 or 1-7
  exercises: WorkoutLogEntry[];
}

export interface WorkoutTemplate {
  id: string;
  name: string; // e.g., "Day 1 - Push"
  dayIdentifier: number; // e.g., 1 for Day 1, to match user selection
  exercises: Exercise[]; // Default structure for the template
}

export interface WorkoutHistoryItem {
  id: string;
  date: string; // ISO string format for date
  week: number;
  day: number; // The specific day of the week/cycle it was logged for
  workoutName?: string; // Optional: name of the workout or template used
  exercises: WorkoutLogEntry[];
}
