"use client";

import type { Dispatch, SetStateAction } from 'react';
import type { Exercise, WorkoutLogEntry } from "@/types/fitness";
import { ExerciseEditorCard } from "./ExerciseEditorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, RotateCcw, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkoutLoggerProps {
  currentExercises: Exercise[];
  setCurrentExercises: Dispatch<SetStateAction<Exercise[]>>;
  onLogWorkout: () => Promise<void>;
  onSaveRoutine: () => Promise<void>;
  onResetTemplate: () => void;
  isLoading: boolean;
  isLogging: boolean;
  isSavingRoutine: boolean;
  templateName?: string;
}

export function WorkoutLogger({
  currentExercises,
  setCurrentExercises,
  onLogWorkout,
  onSaveRoutine,
  onResetTemplate,
  isLoading,
  isLogging,
  isSavingRoutine,
  templateName,
}: WorkoutLoggerProps) {

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const updatedExercises = [...currentExercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setCurrentExercises(updatedExercises);
  };

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(), // Client-side temporary ID
      name: "New Exercise",
      sets: 3,
      reps: 10,
      weight: "",
    };
    setCurrentExercises([...currentExercises, newExercise]);
  };

  const handleRemoveExercise = (index: number) => {
    if (currentExercises.length <= 1) return; // Keep at least one exercise
    const updatedExercises = currentExercises.filter((_, i) => i !== index);
    setCurrentExercises(updatedExercises);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Loading Workout...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2 p-4 border rounded-md">
              <Skeleton className="h-6 w-3/4" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold">
            {templateName ? `Current Workout: ${templateName}` : "Log Your Workout"}
          </CardTitle>
          <div className="flex gap-2">
             <Button onClick={onResetTemplate} variant="outline" size="sm" disabled={isLoading || isLogging || isSavingRoutine}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset to Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {currentExercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No exercises loaded. Add an exercise to get started or select a day with a template.</p>
          </div>
        ) : (
          currentExercises.map((exercise, index) => (
            <ExerciseEditorCard
              key={exercise.id || index} // Use exercise.id if available (from template), else index
              exercise={exercise}
              index={index}
              onExerciseChange={handleExerciseChange}
              onRemoveExercise={handleRemoveExercise}
              isOnlyExercise={currentExercises.length === 1}
            />
          ))
        )}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <Button onClick={handleAddExercise} variant="outline" disabled={isLogging || isSavingRoutine}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
          </Button>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onSaveRoutine} disabled={isLogging || isSavingRoutine || currentExercises.length === 0}>
              {isSavingRoutine ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save as Routine</>}
            </Button>
            <Button onClick={onLogWorkout} disabled={isLogging || isSavingRoutine || currentExercises.length === 0}>
              {isLogging ? "Logging..." : <><Send className="mr-2 h-4 w-4" /> Log Workout</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
