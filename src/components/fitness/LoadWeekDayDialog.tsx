
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

interface LoadWeekDayDialogProps {
  onConfirm: (week: number, day: number) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function LoadWeekDayDialog({ onConfirm, children, disabled }: LoadWeekDayDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);

  const handleConfirm = () => {
    onConfirm(week, day);
    setIsOpen(false);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setWeek(isNaN(value) || value < 1 ? 1 : value);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // Assuming a 5-day cycle, but can be adjusted
    if (!isNaN(value) && value >= 1 && value <= 5) {
      setDay(value);
    } else if (e.target.value === '') {
      setDay(1); // Default
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Load Specific Week/Day</DialogTitle>
          <DialogDescription>
            Enter the week and day you want to load. This will overwrite your current workout view.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="load-week" className="text-right">
              Week
            </Label>
            <Input
              id="load-week"
              type="number"
              value={week}
              onChange={handleWeekChange}
              min="1"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="load-day" className="text-right">
              Day (1-5)
            </Label>
            <Input
              id="load-day"
              type="number"
              value={day}
              onChange={handleDayChange}
              min="1"
              max="5"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleConfirm}>
            Load Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
