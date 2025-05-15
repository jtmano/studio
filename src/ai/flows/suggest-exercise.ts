'use server';

/**
 * @fileOverview Provides AI-powered exercise suggestions based on workout history and target muscle group.
 *
 * - suggestExercise - A function that suggests an exercise.
 * - SuggestExerciseInput - The input type for the suggestExercise function.
 * - SuggestExerciseOutput - The return type for the suggestExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExerciseInputSchema = z.object({
  workoutHistory: z
    .string()
    .describe('The user`s workout history, including exercises, sets, reps, and weight.'),
  targetMuscleGroup: z.string().describe('The target muscle group for the exercise suggestion.'),
});
export type SuggestExerciseInput = z.infer<typeof SuggestExerciseInputSchema>;

const SuggestExerciseOutputSchema = z.object({
  exerciseName: z.string().describe('The name of the suggested exercise.'),
  sets: z.number().describe('The suggested number of sets for the exercise.'),
  reps: z.number().describe('The suggested number of reps for the exercise.'),
  weight: z.string().describe('The suggested weight for the exercise, include units.'),
  reasoning: z.string().describe('The reasoning behind the exercise suggestion.'),
});
export type SuggestExerciseOutput = z.infer<typeof SuggestExerciseOutputSchema>;

export async function suggestExercise(input: SuggestExerciseInput): Promise<SuggestExerciseOutput> {
  return suggestExerciseFlow(input);
}

const suggestExercisePrompt = ai.definePrompt({
  name: 'suggestExercisePrompt',
  input: {schema: SuggestExerciseInputSchema},
  output: {schema: SuggestExerciseOutputSchema},
  prompt: `You are a personal trainer who suggests new exercises to users. The user will provide their workout history, and the target muscle group that they want to focus on.

Workout History: {{{workoutHistory}}}
Target Muscle Group: {{{targetMuscleGroup}}}

Based on this information, suggest an exercise for the user to try. Provide the name of the exercise, the number of sets and reps, and the weight to use.

Explain your reasoning for suggesting this exercise and these parameters.
`,
});

const suggestExerciseFlow = ai.defineFlow(
  {
    name: 'suggestExerciseFlow',
    inputSchema: SuggestExerciseInputSchema,
    outputSchema: SuggestExerciseOutputSchema,
  },
  async input => {
    const {output} = await suggestExercisePrompt(input);
    return output!;
  }
);
