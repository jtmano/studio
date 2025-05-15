"use client";

import { useState } from 'react';
import type { SuggestExerciseInput, SuggestExerciseOutput } from "@/ai/flows/suggest-exercise";
import { suggestExercise } from "@/lib/actions"; // Using the server action wrapper
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, WandSparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const muscleGroups = [
  "Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Abs", "Full Body"
];

export function AiExerciseSuggester() {
  const [targetMuscleGroup, setTargetMuscleGroup] = useState<string>("");
  const [workoutHistory, setWorkoutHistory] = useState<string>("");
  const [suggestion, setSuggestion] = useState<SuggestExerciseOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!targetMuscleGroup || !workoutHistory) {
      setError("Please provide both workout history and a target muscle group.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setSuggestion(null);

    const input: SuggestExerciseInput = {
      workoutHistory,
      targetMuscleGroup,
    };

    try {
      const result = await suggestExercise(input);
      setSuggestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error("AI Suggestion Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-primary" />
            AI Exercise Suggester
          </CardTitle>
          <CardDescription>Get a new exercise idea based on your goals and history.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="targetMuscleGroup" className="text-sm font-medium">Target Muscle Group</Label>
          <Select value={targetMuscleGroup} onValueChange={setTargetMuscleGroup} disabled={isLoading}>
            <SelectTrigger id="targetMuscleGroup">
              <SelectValue placeholder="Select a muscle group" />
            </SelectTrigger>
            <SelectContent>
              {muscleGroups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="workoutHistory" className="text-sm font-medium">Your Recent Workout History (briefly describe)</Label>
          <Textarea
            id="workoutHistory"
            value={workoutHistory}
            onChange={(e) => setWorkoutHistory(e.target.value)}
            placeholder="e.g., Last chest day: Bench Press 3x5 100kg, Incline DB Press 3x10 30kg..."
            rows={4}
            disabled={isLoading}
            className="resize-none"
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading || !targetMuscleGroup || !workoutHistory}>
          {isLoading ? "Getting Suggestion..." : <><WandSparkles className="mr-2 h-4 w-4" /> Suggest Exercise</>}
        </Button>
      </CardFooter>

      {suggestion && (
        <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-3 text-primary">AI Suggestion:</h3>
            <Card className="bg-secondary/30 p-4">
                <CardTitle className="text-lg">{suggestion.exerciseName}</CardTitle>
                <CardContent className="pt-2 px-0 space-y-1 text-sm">
                    <p><strong>Sets:</strong> {suggestion.sets}</p>
                    <p><strong>Reps:</strong> {suggestion.reps}</p>
                    <p><strong>Weight:</strong> {suggestion.weight}</p>
                    <p className="mt-2"><strong>Reasoning:</strong> {suggestion.reasoning}</p>
                </CardContent>
            </Card>
        </div>
      )}
    </Card>
  );
}
