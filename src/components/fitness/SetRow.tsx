
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
  const handleInputChange = (field: 'loggedWeight' | 'loggedReps', value: string) => {
    // Notes field handling is removed
    if ((field === 'loggedReps') && value !== "" && !isNaN(Number(value))) {
      onSetChange(exerciseIndex, setIndex, field, Number(value));
    } else {
      onSetChange(exerciseIndex, setIndex, field, value);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 border-b border-border/30 bg-secondary/20 rounded-md shadow-sm last:border-b-0">
      {/* Set number display removed */}
      {/* Optional: Add a drag handle or ellipsis here later if needed */}
      {/* <div className="flex-none w-8 text-sm text-muted-foreground">...</div> */}

      <div className="flex-1 min-w-0"> {/* Changed from flex-grow to flex-1 for better sizing control */}
        <Label htmlFor={`weight-${exerciseIndex}-${setIndex}`} className="sr-only">Weight</Label>
        <Input
          id={`weight-${exerciseIndex}-${setIndex}`}
          value={set.loggedWeight}
          onChange={(e) => handleInputChange('loggedWeight', e.target.value)}
          placeholder="Weight"
          className="h-9 text-sm w-full" // Added w-full
          aria-label={`Weight for set ${setIndex + 1}`}
        />
      </div>
      <div className="flex-1 min-w-0"> {/* Changed from flex-grow to flex-1 */}
        <Label htmlFor={`reps-${exerciseIndex}-${setIndex}`} className="sr-only">Reps</Label>
        <Input
          id={`reps-${exerciseIndex}-${setIndex}`}
          type="number"
          value={set.loggedReps}
          onChange={(e) => handleInputChange('loggedReps', e.target.value)}
          placeholder="Reps"
          min="0"
          className="h-9 text-sm w-full" // Added w-full
          aria-label={`Reps for set ${setIndex + 1}`}
        />
      </div>
      {/* Notes input removed */}
      <div className="flex items-center gap-2 flex-none">
         <Checkbox
          id={`completed-${exerciseIndex}-${setIndex}`}
          checked={set.isCompleted}
          onCheckedChange={(checked) => onSetChange(exerciseIndex, setIndex, 'isCompleted', !!checked)}
          aria-label={`Mark set ${setIndex + 1} as completed`}
          className="h-5 w-5" // Slightly larger checkbox
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveSet(exerciseIndex, setIndex)}
          aria-label={`Remove set ${setIndex + 1}`}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          disabled={isOnlySet}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
