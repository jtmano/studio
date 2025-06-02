
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { CalendarDays } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // Added Input
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DateSelectorProps {
  selectedWeek: number;
  setSelectedWeek: Dispatch<SetStateAction<number>>;
  selectedDay: number;
  setSelectedDay: Dispatch<SetStateAction<number>>;
  isLoadingTemplate: boolean;
}

// const MAX_WEEKS = 52; // No longer needed for dropdown
const DAYS_IN_CYCLE = 5; // As per "Day (1-5)" for templates

export function DateSelector({
  selectedWeek,
  setSelectedWeek,
  selectedDay,
  setSelectedDay,
  isLoadingTemplate,
}: DateSelectorProps) {
  // const weeks = Array.from({ length: MAX_WEEKS }, (_, i) => i + 1); // No longer needed
  const days = Array.from({ length: DAYS_IN_CYCLE }, (_, i) => i + 1);

  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty input for user to clear, but default to 1 if blurred empty
    // Convert to number if not empty, otherwise keep as string for controlled input behavior
    const numericValue = parseInt(value, 10);
    if (value === "") {
        setSelectedWeek(1); // Or handle empty string specifically if needed
    } else if (!isNaN(numericValue) && numericValue >= 1) {
        setSelectedWeek(numericValue);
    } else if (isNaN(numericValue) || numericValue < 1) {
        setSelectedWeek(1); // Default to 1 if invalid
    }
  };

  const handleWeekBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value === "" || parseInt(event.target.value, 10) < 1) {
      setSelectedWeek(1); // Default to week 1 if input is empty or invalid on blur
    }
  };


  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Select Date</CardTitle>
        <CalendarDays className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="week-input" className="text-sm font-medium">Week</Label>
            <Input
              type="number"
              id="week-input"
              value={selectedWeek}
              onChange={handleWeekChange}
              onBlur={handleWeekBlur}
              min="1"
              disabled={isLoadingTemplate}
              className="w-full"
              placeholder="Enter week"
              aria-label="Select week"
            />
          </div>
          <div>
            <Label htmlFor="day-select" className="text-sm font-medium">Day</Label>
            <Select
              value={selectedDay.toString()}
              onValueChange={(value) => setSelectedDay(Number(value))}
              disabled={isLoadingTemplate}
            >
              <SelectTrigger id="day-select" aria-label="Select day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
