// src/ai/flows/decompose-idea.ts
'use server';
/**
 * @fileOverview Decomposes a project idea into actionable steps and assigns platforms.
 *
 * - decomposeIdea - A function that decomposes the idea.
 * - DecomposeIdeaInput - The input type for the decomposeIdea function.
 * - DecomposeIdeaOutput - The return type for the decomposeIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DecomposeIdeaInputSchema = z.object({
  idea: z.string().describe('The project idea to decompose.'),
});
export type DecomposeIdeaInput = z.infer<typeof DecomposeIdeaInputSchema>;

const DecomposeIdeaOutputSchema = z.array(
  z.object({
    step: z.string().describe('A small actionable step.'),
    platform: z.string().describe('The platform best suited for the step (Firebase, Replit, Lovable, Blob).'),
    prompt: z.string().describe('A copy-paste ready prompt for the platform.'),
  })
);
export type DecomposeIdeaOutput = z.infer<typeof DecomposeIdeaOutputSchema>;

export async function decomposeIdea(input: DecomposeIdeaInput): Promise<DecomposeIdeaOutput> {
  return decomposeIdeaFlow(input);
}

const decomposeIdeaPrompt = ai.definePrompt({
  name: 'decomposeIdeaPrompt',
  input: {schema: DecomposeIdeaInputSchema},
  output: {schema: DecomposeIdeaOutputSchema},
  prompt: `You are a project assistant that receives a user idea and returns actionable prompts for Firebase, Replit, Lovable, and Blob. Each step should include a short title, the target platform, and a prompt the user can paste into that platform.

Here's the user's idea: {{{idea}}}`,
});

const decomposeIdeaFlow = ai.defineFlow(
  {
    name: 'decomposeIdeaFlow',
    inputSchema: DecomposeIdeaInputSchema,
    outputSchema: DecomposeIdeaOutputSchema,
  },
  async input => {
    const {output} = await decomposeIdeaPrompt(input);
    return output!;
  }
);
