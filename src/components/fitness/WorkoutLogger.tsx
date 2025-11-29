
"use client";

import type { Dispatch, SetStateAction } from 'react';
import type { WorkoutExercise, IndividualSet } from "@/types/fitness";
import { ExerciseDetailCard } from "./ExerciseEditorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, RotateCcw, Send, Wifi, WifiOff, MoreVertical, History, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type LoadingState = 'idle' | 'loading-template' | 'logging' | 'saving-state' | 'loading-history' | 'syncing' | 'loading-specific-day' | 'populating-history';

interface WorkoutLoggerProps {
  currentWorkout: WorkoutExercise[];
  setCurrentWorkout: Dispatch<SetStateAction<WorkoutExercise[]>>;
  onLogWorkout: () => Promise<void>;
  onSaveCurrentState: () => Promise<void>; 
  onResetTemplate: () => void;
  loadingState: LoadingState;
  templateName?: string;
  selectedDay: number;
  isOnline: boolean;
  onLoadCurrentState: () => Promise<void>;
  onPopulateFromHistory: () => void;
}

export function WorkoutLogger({
  currentWorkout,
  setCurrentWorkout,
  onLogWorkout,
  onSaveCurrentState, 
  onResetTemplate,
  loadingState,
  templateName,
  selectedDay,
  isOnline,
  onLoadCurrentState,
  onPopulateFromHistory,
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


  const isLoading = loadingState !== 'idle';
  const noWorkoutLoaded = currentWorkout.length === 0 || (currentWorkout.length === 1 && currentWorkout[0].name === "New Exercise");


  if (loadingState === 'loading-template' || loadingState === 'loading-history' || loadingState === 'loading-specific-day') {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Loading Workout...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold">
            {templateName ? `Current Workout: ${templateName}` : "Log Your Workout"}
          </CardTitle>
          <div className="flex items-center gap-2">
             <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? 'Online' : 'Offline'}
             </Badge>
             <Button onClick={onResetTemplate} variant="outline" size="sm" disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {currentWorkout.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No exercises loaded.</p>
            <p className='text-sm'>Add an exercise to get started, or load a template from the actions menu.</p>
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
          <Button onClick={handleAddExercise} variant="outline" disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
          </Button>
          <div className="flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLoadCurrentState} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Load Current State</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPopulateFromHistory} disabled={isLoading || noWorkoutLoaded}>
                  <History className="mr-2 h-4 w-4" />
                  <span>Populate from History</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={onSaveCurrentState} disabled={isLoading || noWorkoutLoaded}>
                {loadingState === 'saving-state' ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save</>}
            </Button>
            <Button 
              onClick={onLogWorkout} 
              disabled={isLoading || noWorkoutLoaded || currentWorkout.every(ex => ex.sets.every(s => !s.isCompleted))}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
            >
              {loadingState === 'logging' ? "Logging..." : (loadingState === 'syncing' ? "Syncing..." : <><Send className="mr-2 h-4 w-4" /> Log Workout</>)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

