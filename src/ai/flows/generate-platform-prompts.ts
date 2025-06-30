'use server';
/**
 * @fileOverview Decomposes a project idea into a sequential development plan with a recommended stack.
 *
 * - generatePlatformPrompts - A function that generates a sequential development plan.
 * - GeneratePlatformPromptsInput - The input type for the generatePlatformPrompts function.
 * - GeneratePlatformPromptsOutput - The return type for the generatePlatformPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlatformPromptsInputSchema = z.object({
  idea: z.string().describe('The user defined idea for which prompts are generated.'),
});
export type GeneratePlatformPromptsInput = z.infer<typeof GeneratePlatformPromptsInputSchema>;

const GeneratePlatformPromptsOutputSchema = z.object({
  stack: z
    .string()
    .describe(
      'The recommended development stack for the project, e.g., "Lovable + n8n", "Firebase Studio (Full-stack)", "Replit (Full-stack)".'
    ),
  steps: z.array(
    z.object({
      phase: z.string().describe('The development phase, either "Frontend" or "Backend".'),
      platform: z
        .string()
        .describe(
          'The platform best suited for this step (e.g., Lovable, n8n, ChatGPT, Firebase, Replit).'
        ),
      title: z.string().describe('A short title for the step.'),
      prompt: z.string().describe('A copy-paste ready prompt for the platform.'),
    })
  ),
});
export type GeneratePlatformPromptsOutput = z.infer<typeof GeneratePlatformPromptsOutputSchema>;

export async function generatePlatformPrompts(
  input: GeneratePlatformPromptsInput
): Promise<GeneratePlatformPromptsOutput> {
  return generatePlatformPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlatformPromptsPrompt',
  input: {schema: GeneratePlatformPromptsInputSchema},
  output: {schema: GeneratePlatformPromptsOutputSchema},
  prompt: `You are an expert project manager and software architect. Your task is to take a user's project idea and break it down into a structured, sequential, and complete development plan.

1.  **Analyze the Idea**: Understand the core features and requirements of the user's idea.
2.  **Recommend a Stack**: Based on the idea, recommend a suitable development stack. Your options are:
    *   "Lovable + n8n": For projects that can be split into a distinct frontend (built with a UI builder) and a backend (built with a workflow automation tool).
    *   "Firebase Studio (Full-stack)": For full-stack web applications that can leverage Firebase services.
    *   "Replit (Full-stack)": For rapid prototyping of full-stack applications in a cloud IDE.
    Choose the most appropriate stack and set it in the 'stack' field.
3.  **Decompose into Phases**: Divide the project into a 'Frontend' phase and a 'Backend' phase. The steps must be strictly sequential. Generate all frontend steps first, then all backend steps.
4.  **Create a Complete and Logical Story**: Generate a comprehensive list of actionable steps that tell a full development story from start to finish. Do not skip obvious prerequisites. For example, if a user profile page is needed, you must first generate steps for user registration and login. Think through the entire user journey and application logic.
5.  **Define Actionable Steps**: For each step within a phase, provide:
    *   'phase': "Frontend" or "Backend".
    *   'platform': The specific tool for that step (e.g., "Lovable", "n8n", "ChatGPT", "Firebase", "Replit"). The platform should align with the chosen stack. For "Lovable + n8n", use "Lovable" for frontend and "n8n" or "ChatGPT" for backend. For "Firebase Studio" or "Replit", use "Firebase" or "Replit" respectively for most steps.
    *   'title': A short, descriptive title for the task (e.g., "Design the Landing Page", "Create Login Form", "Set up User Authentication API").
    *   'prompt': A detailed, copy-paste ready prompt that the user can directly use on the specified platform to accomplish the task.

Here's the user's idea: {{{idea}}}`,
});

const generatePlatformPromptsFlow = ai.defineFlow(
  {
    name: 'generatePlatformPromptsFlow',
    inputSchema: GeneratePlatformPromptsInputSchema,
    outputSchema: GeneratePlatformPromptsOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    
    if (!output) {
      console.error('AI prompt failed to generate platform prompts.', {
        finishReason: response.finishReason,
        finishMessage: response.finishMessage,
      });
      throw new Error(
        `The AI failed to generate platform prompts. This could be due to a configuration issue (like a missing API key), a content safety block, or another error. Finish reason: ${response.finishReason}`
      );
    }
    
    return output;
  }
);
