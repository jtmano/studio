
"use client";

import type { WorkoutHistoryItem } from "@/types/fitness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, History } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


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
                  <TableHead className="min-w-[300px]">Logged Sets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{item.week}</TableCell>
                    <TableCell>{item.day}</TableCell>
                    <TableCell>
                      {item.loggedSets && item.loggedSets.length > 0 ? (
                        <div className="space-y-2">
                          {item.loggedSets.reduce<JSX.Element[][]>((acc, set, idx, arr) => {
                            // Group sets by exercise name for display
                            if (idx === 0 || set.exerciseName !== arr[idx - 1].exerciseName) {
                              acc.push([]);
                            }
                            acc[acc.length - 1].push(
                              <div key={`${item.id}-set-${idx}`} className="p-2 rounded-md bg-secondary/30">
                                {idx === 0 || set.exerciseName !== arr[idx -1].exerciseName ? (
                                   <p className="font-semibold text-sm mb-1">{set.exerciseName} {set.tool ? <Badge variant="outline" className="ml-1 text-xs">{set.tool}</Badge> : ''}</p>
                                ) : null}
                                <p className="text-xs">
                                  Set {set.setNumber}: {set.weight} x {set.reps} reps
                                  {set.notes && <span className="text-muted-foreground italic ml-1">({set.notes})</span>}
                                </p>
                              </div>
                            );
                            return acc;
                          }, []).map((exerciseGroup, groupIdx) => (
                            <div key={`ex-group-${groupIdx}`} className="mb-1 last:mb-0">
                              {exerciseGroup}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No sets logged for this entry.</span>
                      )}
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
