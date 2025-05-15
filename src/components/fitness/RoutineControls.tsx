
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
  onSaveRoutine: (name: string) => Promise<void>; // Removed dayIdentifier from here
  currentDay: number;
  isSaving: boolean;
  disabled?: boolean;
  defaultRoutineName?: string;
}

export function RoutineControls({ onSaveRoutine, currentDay, isSaving, disabled, defaultRoutineName }: RoutineControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Use defaultRoutineName if provided, otherwise fallback to a generic name
  const [routineName, setRoutineName] = useState(defaultRoutineName || `My Routine - Day ${currentDay}`);

  // Update routineName if defaultRoutineName changes (e.g. template loads)
  React.useEffect(() => {
    setRoutineName(defaultRoutineName || `My Routine - Day ${currentDay}`);
  }, [defaultRoutineName, currentDay]);


  const handleSave = async () => {
    if (!routineName.trim()) {
      alert("Please enter a name for the routine."); // Consider using toast for consistency
      return;
    }
    // Day identifier is now handled by the parent component (page.tsx)
    await onSaveRoutine(routineName.trim());
    setIsOpen(false); 
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) { // When dialog opens, ensure routine name is up-to-date
        setRoutineName(defaultRoutineName || `My Routine - Day ${currentDay}`);
      }
    }}>
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
            Save the current set of exercises as a new routine template for Day {currentDay}.
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
              placeholder={`e.g., Morning Power - Day ${currentDay}`}
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

