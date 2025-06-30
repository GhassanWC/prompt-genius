'use server';
/**
 * @fileOverview AI-powered prompt generation for various platforms.
 *
 * - generatePlatformPrompts - A function that generates platform-specific prompts based on a user idea.
 * - GeneratePlatformPromptsInput - The input type for the generatePlatformPrompts function.
 * - GeneratePlatformPromptsOutput - The return type for the generatePlatformPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlatformPromptsInputSchema = z.object({
  idea: z.string().describe('The user defined idea for which prompts are generated.'),
});
export type GeneratePlatformPromptsInput = z.infer<typeof GeneratePlatformPromptsInputSchema>;

const GeneratePlatformPromptsOutputSchema = z.array(
  z.object({
    step: z.string().describe('A short title for each step.'),
    platform: z.string().describe('The target platform for the step (Firebase, Replit, Lovable, Blob, etc.).'),
    prompt: z.string().describe('A copy-paste ready prompt optimized for the platform.'),
  })
);
export type GeneratePlatformPromptsOutput = z.infer<typeof GeneratePlatformPromptsOutputSchema>;

export async function generatePlatformPrompts(input: GeneratePlatformPromptsInput): Promise<GeneratePlatformPromptsOutput> {
  return generatePlatformPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlatformPromptsPrompt',
  input: {schema: GeneratePlatformPromptsInputSchema},
  output: {schema: GeneratePlatformPromptsOutputSchema},
  prompt: `You are a project assistant that receives a user idea and returns actionable prompts for Firebase, Replit, Lovable, and Blob. Each step should include a short title, the target platform, and a prompt the user can paste into that platform.\n\nUser Idea: {{{idea}}}`,
});

const generatePlatformPromptsFlow = ai.defineFlow(
  {
    name: 'generatePlatformPromptsFlow',
    inputSchema: GeneratePlatformPromptsInputSchema,
    outputSchema: GeneratePlatformPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
