"use client";

import type { Dispatch, SetStateAction } from 'react';
import { CalendarDays } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DateSelectorProps {
  selectedWeek: number;
  setSelectedWeek: Dispatch<SetStateAction<number>>;
  selectedDay: number;
  setSelectedDay: Dispatch<SetStateAction<number>>;
  isLoadingTemplate: boolean;
}

const MAX_WEEKS = 52;
const DAYS_IN_CYCLE = 5; // As per "Day (1-5)" for templates

export function DateSelector({
  selectedWeek,
  setSelectedWeek,
  selectedDay,
  setSelectedDay,
  isLoadingTemplate,
}: DateSelectorProps) {
  const weeks = Array.from({ length: MAX_WEEKS }, (_, i) => i + 1);
  const days = Array.from({ length: DAYS_IN_CYCLE }, (_, i) => i + 1);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Select Date</CardTitle>
        <CalendarDays className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="week-select" className="text-sm font-medium">Week</Label>
            <Select
              value={selectedWeek.toString()}
              onValueChange={(value) => setSelectedWeek(Number(value))}
              disabled={isLoadingTemplate}
            >
              <SelectTrigger id="week-select" aria-label="Select week">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
