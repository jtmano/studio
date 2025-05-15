"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';

interface RoutineControlsProps {
  onSaveRoutine: (name: string, dayIdentifier: number) => Promise<void>;
  currentDay: number; // To prefill or associate the routine with a day
  isSaving: boolean;
  disabled?: boolean;
}

export function RoutineControls({ onSaveRoutine, currentDay, isSaving, disabled }: RoutineControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState(`My Routine - Day ${currentDay}`);

  const handleSave = async () => {
    if (!routineName.trim()) {
      // Basic validation, can add more robust error handling
      alert("Please enter a name for the routine.");
      return;
    }
    await onSaveRoutine(routineName.trim(), currentDay);
    setIsOpen(false); // Close dialog on successful save
  };
  
  // Update routineName if currentDay changes and dialog is not open (or on initial mount)
  // This is tricky with dialogs, better to set it when dialog opens or rely on user input.
  // For simplicity, we'll just prefill it. User can change it.

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving Routine...' : 'Save Current as Routine'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Routine</DialogTitle>
          <DialogDescription>
            Save the current set of exercises as a new routine template.
            It will be associated with Day {currentDay}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="routine-name" className="text-right">
              Routine Name
            </Label>
            <Input
              id="routine-name"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="col-span-3"
              placeholder={`e.g., Morning Power Sesh - Day ${currentDay}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving || !routineName.trim()}>
            {isSaving ? 'Saving...' : 'Save Routine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
