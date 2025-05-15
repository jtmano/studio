
"use client";

import type { IndividualSet } from "@/types/fitness";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

interface SetRowProps {
  set: IndividualSet;
  setIndex: number;
  exerciseIndex: number;
  onSetChange: (exerciseIndex: number, setIndex: number, field: keyof IndividualSet, value: string | number | boolean) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  isOnlySet: boolean;
}

export function SetRow({
  set,
  setIndex,
  exerciseIndex,
  onSetChange,
  onRemoveSet,
  isOnlySet,
}: SetRowProps) {
  const handleInputChange = (field: 'loggedWeight' | 'loggedReps' | 'notes', value: string) => {
    if ((field === 'loggedReps') && value !== "" && !isNaN(Number(value))) {
      onSetChange(exerciseIndex, setIndex, field, Number(value));
    } else {
      onSetChange(exerciseIndex, setIndex, field, value);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border-b border-border/30 bg-secondary/20 rounded-md mb-2 shadow-sm">
      <div className="flex-none w-12 text-sm text-muted-foreground">Set {set.setNumber}</div>
      <div className="flex-grow space-y-1">
        <Label htmlFor={`weight-${exerciseIndex}-${setIndex}`} className="sr-only">Weight</Label>
        <Input
          id={`weight-${exerciseIndex}-${setIndex}`}
          value={set.loggedWeight}
          onChange={(e) => handleInputChange('loggedWeight', e.target.value)}
          placeholder="Weight (e.g., 50kg)"
          className="h-9 text-sm"
          aria-label={`Weight for set ${set.setNumber}`}
        />
      </div>
      <div className="flex-grow space-y-1">
        <Label htmlFor={`reps-${exerciseIndex}-${setIndex}`} className="sr-only">Reps</Label>
        <Input
          id={`reps-${exerciseIndex}-${setIndex}`}
          type="number"
          value={set.loggedReps}
          onChange={(e) => handleInputChange('loggedReps', e.target.value)}
          placeholder="Reps"
          min="0"
          className="h-9 text-sm"
          aria-label={`Reps for set ${set.setNumber}`}
        />
      </div>
       <div className="flex-grow space-y-1">
        <Label htmlFor={`notes-${exerciseIndex}-${setIndex}`} className="sr-only">Notes</Label>
        <Input
          id={`notes-${exerciseIndex}-${setIndex}`}
          value={set.notes || ""}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Notes (optional)"
          className="h-9 text-sm"
          aria-label={`Notes for set ${set.setNumber}`}
        />
      </div>
      <div className="flex items-center gap-2 flex-none">
         <Checkbox
          id={`completed-${exerciseIndex}-${setIndex}`}
          checked={set.isCompleted}
          onCheckedChange={(checked) => onSetChange(exerciseIndex, setIndex, 'isCompleted', !!checked)}
          aria-label={`Mark set ${set.setNumber} as completed`}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveSet(exerciseIndex, setIndex)}
          aria-label={`Remove set ${set.setNumber}`}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          disabled={isOnlySet}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
