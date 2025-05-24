
export interface IndividualSet {
  id: string; 
  setNumber: number;
  targetWeight?: number | string;
  targetReps?: number;
  loggedWeight: number | string; 
  loggedReps: number | string;   
  isCompleted: boolean;
  notes?: string;
}

export interface WorkoutExercise { 
  id: string; 
  name: string;
  tool?: string;
  targetMuscleGroup?: string;
  sets: IndividualSet[]; 
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  dayIdentifier: number;
  exercises: WorkoutExercise[]; 
}

// This represents a single row from the "Workout History" Supabase table
export interface LoggedSetDatabaseEntry {
  id: number; // Assuming int8 from Supabase maps to number
  Week: number;
  Day: number;
  TargetGroup?: string | null; // "Target Group" in DB
  Exercise: string;
  Weight?: number | null;
  Reps?: number | null;
  Completed?: boolean | null;
  Tool?: string | null;
  SetNumber?: number | null; // "Set Number" in DB (int2)
}


// This is still useful for processing/display within the page if needed,
// but getWorkoutHistory will return LoggedSetDatabaseEntry[]
export interface LoggedSetInfo { 
  exerciseName: string;
  tool?: string;
  setNumber: number;
  weight: number | string;
  reps: number | string;
  notes?: string;
  targetMuscleGroup?: string;
}

// This type represents a "session" or a "day's log" for display in ProgressDisplay
// It will be constructed on the client-side from LoggedSetDatabaseEntry[]
export interface WorkoutHistoryItem {
  id: string; // Synthesized ID, e.g., "week-X-day-Y"
  date: string; // May not be available directly from "Workout History" table, might need to be inferred or omitted
  week: number;
  day: number;
  workoutName?: string; 
  loggedSets: LoggedSetInfo[]; // Aggregated sets for that day/week
}


export interface SerializableAppState {
  selectedWeek: number;
  selectedDay: number;
  currentWorkout: WorkoutExercise[];
  loadedTemplateName?: string;
  initialTemplateWorkout: WorkoutExercise[];
}

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
