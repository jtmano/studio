
"use client";

import type { Dispatch, SetStateAction } from 'react';
import type { WorkoutExercise, IndividualSet } from "@/types/fitness";
import { ExerciseDetailCard } from "./ExerciseEditorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, RotateCcw, Send, DownloadCloud, CalendarClock, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


interface WorkoutLoggerProps {
  currentWorkout: WorkoutExercise[];
  setCurrentWorkout: Dispatch<SetStateAction<WorkoutExercise[]>>;
  onLogWorkout: () => Promise<void>;
  onSaveCurrentState: () => Promise<void>; 
  onLoadWeekAndDay: () => Promise<void>;      // New prop
  onPopulateLoggedInfo: () => Promise<void>; // New prop
  onResetTemplate: () => void;
  isLoading: boolean;
  isLogging: boolean;
  isSavingState: boolean; 
  isLoadingWeekDay: boolean;      // New prop
  isPopulatingWorkout: boolean; // New prop
  templateName?: string;
  selectedDay: number;
}

export function WorkoutLogger({
  currentWorkout,
  setCurrentWorkout,
  onLogWorkout,
  onSaveCurrentState, 
  onLoadWeekAndDay,         // New prop
  onPopulateLoggedInfo,    // New prop
  onResetTemplate,
  isLoading,
  isLogging,
  isSavingState, 
  isLoadingWeekDay,         // New prop
  isPopulatingWorkout,      // New prop
  templateName,
  selectedDay
}: WorkoutLoggerProps) {
  const { toast } = useToast();

  const handleExerciseDetailChange = (exerciseIndex: number, field: keyof WorkoutExercise, value: string | number) => {
    const updatedWorkout = [...currentWorkout];
    const exerciseToUpdate = { ...updatedWorkout[exerciseIndex] };
    (exerciseToUpdate[field] as any) = value; 
    updatedWorkout[exerciseIndex] = exerciseToUpdate;
    setCurrentWorkout(updatedWorkout);
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: keyof IndividualSet, value: string | number | boolean) => {
    const updatedWorkout = [...currentWorkout];
    const exerciseToUpdate = { ...updatedWorkout[exerciseIndex] };
    const sets = [...exerciseToUpdate.sets];
    const setToUpdate = { ...sets[setIndex] };
    (setToUpdate[field] as any) = value; 
    sets[setIndex] = setToUpdate;
    exerciseToUpdate.sets = sets;
    updatedWorkout[exerciseIndex] = exerciseToUpdate;
    setCurrentWorkout(updatedWorkout);
  };

  const handleAddExercise = () => {
    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      name: "New Exercise",
      tool: "",
      sets: [{
        id: crypto.randomUUID(),
        setNumber: 1,
        loggedWeight: "",
        loggedReps: "",
        notes: "",
        isCompleted: false,
      }],
    };
    setCurrentWorkout([...currentWorkout, newExercise]);
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (currentWorkout.length <= 1 && currentWorkout[exerciseIndex].sets.length <=1) {
        toast({ title: "Cannot Remove", description: "At least one exercise with one set must remain.", variant: "default" });
        return;
    }
    const updatedWorkout = currentWorkout.filter((_, i) => i !== exerciseIndex);
    setCurrentWorkout(updatedWorkout);
     if (updatedWorkout.length === 0) { 
        handleAddExercise();
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const exerciseToUpdate = { ...updatedWorkout[exerciseIndex] };
    const newSetNumber = exerciseToUpdate.sets.length + 1;
    exerciseToUpdate.sets = [
      ...exerciseToUpdate.sets,
      {
        id: crypto.randomUUID(),
        setNumber: newSetNumber,
        loggedWeight: "", 
        loggedReps: "",  
        notes: "",
        isCompleted: false,
      },
    ];
    updatedWorkout[exerciseIndex] = exerciseToUpdate;
    setCurrentWorkout(updatedWorkout);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = [...currentWorkout];
    const exerciseToUpdate = { ...updatedWorkout[exerciseIndex] };
    
    if (exerciseToUpdate.sets.length <= 1) {
      if (currentWorkout.length === 1) {
         toast({ title: "Cannot Remove", description: "At least one set must remain in the workout.", variant: "default" });
        return;
      }
      handleRemoveExercise(exerciseIndex);
      return;
    }

    exerciseToUpdate.sets = exerciseToUpdate.sets.filter((_, i) => i !== setIndex)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 })); 
    
    updatedWorkout[exerciseIndex] = exerciseToUpdate;
    setCurrentWorkout(updatedWorkout);
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
              <Skeleton className="h-6 w-3/4 mb-3" />
              {[1,2].map(s => <Skeleton key={s} className="h-10 w-full mb-2" />)}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  const anyLoading = isLoading || isLogging || isSavingState || isLoadingWeekDay || isPopulatingWorkout;

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold">
            {templateName ? `Current Workout: ${templateName}` : "Log Your Workout"}
          </CardTitle>
          <div className="flex gap-2">
             <Button onClick={onResetTemplate} variant="outline" size="sm" disabled={anyLoading}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset to Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {currentWorkout.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No exercises loaded. Add an exercise to get started or use load options.</p>
          </div>
        ) : (
          currentWorkout.map((exercise, index) => (
            <ExerciseDetailCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={index}
              onExerciseChange={handleExerciseDetailChange}
              onSetChange={handleSetChange}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onRemoveExercise={handleRemoveExercise}
              isOnlyExercise={currentWorkout.length === 1}
            />
          ))
        )}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button onClick={handleAddExercise} variant="outline" disabled={anyLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise Type
          </Button>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onLoadWeekAndDay} variant="outline" disabled={anyLoading}>
              {isLoadingWeekDay ? "Loading W/D..." : <><CalendarClock className="mr-2 h-4 w-4" /> Load Week/Day</>}
            </Button>
            <Button onClick={onPopulateLoggedInfo} variant="outline" disabled={anyLoading}>
              {isPopulatingWorkout ? "Populating..." : <><ListChecks className="mr-2 h-4 w-4" /> Populate Workout</>}
            </Button>
            <Button onClick={onSaveCurrentState} disabled={anyLoading || currentWorkout.length === 0}>
                {isSavingState ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save</>}
            </Button>
            <Button 
              onClick={onLogWorkout} 
              disabled={anyLoading || currentWorkout.length === 0 || currentWorkout.every(ex => ex.sets.every(s => !s.isCompleted))}
            >
              {isLogging ? "Logging..." : <><Send className="mr-2 h-4 w-4" /> Log Workout</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
