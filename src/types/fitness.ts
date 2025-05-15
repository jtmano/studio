
export interface IndividualSet {
  id: string; // Unique ID for the set (client-generated)
  setNumber: number;
  // targetWeight and targetReps are what might be pre-filled from a template or previous log
  targetWeight?: number | string;
  targetReps?: number;
  // loggedWeight and loggedReps are the actual values entered by the user for this specific instance
  loggedWeight: number | string; // User input, can be empty initially
  loggedReps: number | string;   // User input, can be empty initially
  isCompleted: boolean;
  notes?: string;
}

export interface WorkoutExercise { // Renamed from Exercise to avoid confusion
  id: string; // Unique ID for the exercise type (client-generated or DB)
  name: string;
  tool?: string;
  targetMuscleGroup?: string;
  sets: IndividualSet[]; // Array of sets for this exercise
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  dayIdentifier: number;
  exercises: WorkoutExercise[]; // Each exercise contains its sets
}

export interface LoggedSetInfo { // Used for storing in history
  exerciseName: string;
  tool?: string;
  setNumber: number;
  weight: number | string;
  reps: number | string;
  notes?: string;
}

export interface WorkoutHistoryItem {
  id: string;
  date: string; // ISO string format for date
  week: number;
  day: number;
  workoutName?: string; // Optional: name of the workout or template used
  // exercises: WorkoutLogEntry[]; // Old structure
  loggedSets: LoggedSetInfo[]; // New structure: flat list of completed sets
}

// This type might be redundant if logWorkout directly processes WorkoutExercise[]
// For now, let's assume WorkoutLogEntry might be a simplified version for logging if needed,
// but the primary data structure for current workout will be WorkoutExercise[].
export type WorkoutLogEntry = WorkoutExercise;
// Keep Exercise type for AI Suggester input if it expects a simpler structure
export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number | string;
  targetMuscleGroup?: string;
  tool?: string;
}
