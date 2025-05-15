
"use client";

import type { WorkoutExercise, IndividualSet } from "@/types/fitness";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, GripVertical } from "lucide-react";
import { SetRow } from "./SetRow"; // Import the new SetRow component

interface ExerciseDetailCardProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  onExerciseChange: (exerciseIndex: number, field: keyof WorkoutExercise, value: string | number) => void; // For name, tool
  onSetChange: (exerciseIndex: number, setIndex: number, field: keyof IndividualSet, value: string | number | boolean) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  isOnlyExercise?: boolean;
}

export function ExerciseDetailCard({
  exercise,
  exerciseIndex,
  onExerciseChange,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  isOnlyExercise = false,
}: ExerciseDetailCardProps) {
  
  const handleExerciseDetailChange = (field: 'name' | 'tool', value: string) => {
    onExerciseChange(exerciseIndex, field, value);
  };

  return (
    <Card className="mb-6 bg-card shadow-md border border-border/50">
      <CardHeader className="py-4 px-5 border-b border-border/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-grow">
            {/* <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-none" aria-hidden="true" /> */}
            <Input
              id={`exercise-name-${exerciseIndex}`}
              value={exercise.name}
              onChange={(e) => handleExerciseDetailChange('name', e.target.value)}
              placeholder="Exercise Name"
              className="text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent flex-grow"
              aria-label="Exercise name"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveExercise(exerciseIndex)}
            aria-label={`Remove ${exercise.name} exercise`}
            className="text-muted-foreground hover:text-destructive flex-none"
            disabled={isOnlyExercise}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Input
            id={`exercise-tool-${exerciseIndex}`}
            value={exercise.tool || ''}
            onChange={(e) => handleExerciseDetailChange('tool', e.target.value)}
            placeholder="Tool/Equipment (e.g., Barbell)"
            className="text-sm text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent mt-1"
            aria-label="Tool or equipment"
        />
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {exercise.sets.length > 0 && (
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-3 px-3 mb-1 text-xs text-muted-foreground font-medium">
            <div className="w-12">Set</div>
            <div>Weight</div>
            <div>Reps</div>
            <div>Notes</div>
            <div className="text-right">Log</div>
          </div>
        )}
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.id}
            set={set}
            setIndex={setIndex}
            exerciseIndex={exerciseIndex}
            onSetChange={onSetChange}
            onRemoveSet={onRemoveSet}
            isOnlySet={exercise.sets.length === 1}
          />
        ))}
        <Button onClick={() => onAddSet(exerciseIndex)} variant="outline" size="sm" className="mt-3">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Set
        </Button>
      </CardContent>
    </Card>
  );
}
