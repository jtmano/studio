
"use client";

import type { LoggedSetDatabaseEntry, WorkoutHistoryItem, LoggedSetInfo } from "@/types/fitness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart as ProgressChartIcon, History } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ProgressDisplayProps {
  historyFlat: LoggedSetDatabaseEntry[]; 
  isLoading: boolean;
}


function groupHistoryBySession(flatHistory: LoggedSetDatabaseEntry[]): WorkoutHistoryItem[] {
  if (!flatHistory || flatHistory.length === 0) return [];

  const sessionsMap = new Map<string, WorkoutHistoryItem>();

  flatHistory.forEach(entry => {
    const sessionId = `W${entry.Week}-D${entry.Day}`; 
    
    if (!sessionsMap.has(sessionId)) {
      sessionsMap.set(sessionId, {
        id: sessionId,
        date: `Week ${entry.Week}, Day ${entry.Day}`,
        week: entry.Week,
        day: entry.Day,
        workoutName: `Workout Week ${entry.Week}, Day ${entry.Day}`,
        loggedSets: [],
      });
    }

    const session = sessionsMap.get(sessionId)!;
    session.loggedSets.push({
      exerciseName: entry.Exercise,
      tool: entry.Tool || undefined,
      setNumber: entry.SetNumber || 0,
      weight: entry.Weight !== null ? String(entry.Weight) : "",
      reps: entry.Reps !== null ? String(entry.Reps) : "",
      notes: "", 
      targetMuscleGroup: entry.TargetGroup || undefined,
    });
  });
  
  const groupedSessions = Array.from(sessionsMap.values());
  
  groupedSessions.sort((a,b) => {
    if (a.week !== b.week) return b.week - a.week;
    return b.day - a.day;
  });

  return groupedSessions;
}


export function ProgressDisplay({ historyFlat, isLoading }: ProgressDisplayProps) {
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

  const historySessions = groupHistoryBySession(historyFlat);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Workout History</CardTitle>
        <History className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        {historySessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ProgressChartIcon className="mx-auto h-12 w-12 mb-2" />
            <p>No workout history yet. Log some workouts to see your progress!</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Session (Week-Day)</TableHead>
                  <TableHead className="min-w-[300px]">Logged Sets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historySessions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      {item.loggedSets && item.loggedSets.length > 0 ? (
                        <div className="space-y-2">
                          {item.loggedSets.reduce<JSX.Element[][]>((acc, set, idx, arr) => {
                            if (idx === 0 || set.exerciseName !== arr[idx - 1].exerciseName || set.tool !== arr[idx-1].tool) {
                              acc.push([]);
                            }
                            acc[acc.length - 1].push(
                              <div key={`${item.id}-set-${set.exerciseName}-${set.setNumber}-${idx}`} className="p-2 rounded-md bg-secondary/30">
                                {(idx === 0 || set.exerciseName !== arr[idx -1].exerciseName || set.tool !== arr[idx-1].tool) && (
                                   <p className="font-semibold text-sm mb-1">
                                     {set.exerciseName} 
                                     {set.tool && <Badge variant="outline" className="ml-1 text-xs">{set.tool}</Badge>}
                                     {set.targetMuscleGroup && <Badge variant="secondary" className="ml-1 text-xs">{set.targetMuscleGroup}</Badge>}
                                   </p>
                                )}
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
