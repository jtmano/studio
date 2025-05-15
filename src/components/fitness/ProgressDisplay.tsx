"use client";

import type { WorkoutHistoryItem } from "@/types/fitness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, History } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressDisplayProps {
  history: WorkoutHistoryItem[];
  isLoading: boolean;
}

export function ProgressDisplay({ history, isLoading }: ProgressDisplayProps) {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Workout History</CardTitle>
          <History className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Workout History</CardTitle>
        <History className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LineChart className="mx-auto h-12 w-12 mb-2" />
            <p>No workout history yet. Log some workouts to see your progress!</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Exercises</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{item.week}</TableCell>
                    <TableCell>{item.day}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside">
                        {item.exercises.map((ex, idx) => (
                          <li key={idx} className="text-sm">
                            {ex.name}: {ex.sets} sets, {ex.reps} reps @ {ex.weight || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
