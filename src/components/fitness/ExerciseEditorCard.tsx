"use client";

import type { Exercise } from "@/types/fitness";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, GripVertical } from "lucide-react";

interface ExerciseEditorCardProps {
  exercise: Exercise;
  index: number;
  onExerciseChange: (index: number, field: keyof Exercise, value: string | number) => void;
  onRemoveExercise: (index: number) => void;
  isOnlyExercise?: boolean;
}

export function ExerciseEditorCard({
  exercise,
  index,
  onExerciseChange,
  onRemoveExercise,
  isOnlyExercise = false,
}: ExerciseEditorCardProps) {
  const handleInputChange = (field: keyof Exercise, value: string) => {
    if ((field === 'sets' || field === 'reps' || field === 'weight') && value !== "" && !isNaN(Number(value))) {
      onExerciseChange(index, field, Number(value));
    } else {
      onExerciseChange(index, field, value);
    }
  };

  return (
    <Card className="mb-4 bg-secondary/30 shadow-sm border border-border/50">
      <CardHeader className="py-3 px-4 border-b border-border/50">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" aria-hidden="true" />
                <Input
                    id={`exercise-name-${index}`}
                    value={exercise.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Exercise Name"
                    className="text-md font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
                    aria-label="Exercise name"
                />
            </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveExercise(index)}
            aria-label={`Remove ${exercise.name}`}
            className="text-muted-foreground hover:text-destructive"
            disabled={isOnlyExercise}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor={`sets-${index}`} className="text-xs text-muted-foreground">Sets</Label>
          <Input
            id={`sets-${index}`}
            type="number"
            value={exercise.sets ?? ''}
            onChange={(e) => handleInputChange('sets', e.target.value)}
            placeholder="Sets"
            min="0"
            className="h-9"
            aria-label="Sets"
          />
        </div>
        <div>
          <Label htmlFor={`reps-${index}`} className="text-xs text-muted-foreground">Reps</Label>
          <Input
            id={`reps-${index}`}
            type="number"
            value={exercise.reps ?? ''}
            onChange={(e) => handleInputChange('reps', e.target.value)}
            placeholder="Reps"
            min="0"
            className="h-9"
            aria-label="Reps"
          />
        </div>
        <div>
          <Label htmlFor={`weight-${index}`} className="text-xs text-muted-foreground">Weight (kg/lbs/bw)</Label>
          <Input
            id={`weight-${index}`}
            value={exercise.weight ?? ''}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="Weight"
            className="h-9"
            aria-label="Weight"
          />
        </div>
      </CardContent>
    </Card>
  );
}
