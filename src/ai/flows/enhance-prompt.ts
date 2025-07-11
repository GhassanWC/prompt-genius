'use server';
/**
 * @fileOverview Enhances a user-provided prompt to be clearer for an AI.
 *
 * - enhancePrompt - A function that enhances a single prompt.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The user prompt to enhance.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The AI-enhanced version of the prompt.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const enhancePromptGenkitPrompt = ai.definePrompt({
  name: 'enhancePromptPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an expert prompt engineer. Your task is to take a user's rough instruction and refine it into a clear, specific, and unambiguous prompt suitable for another AI model. 

Your goal is to improve the grammar, vocabulary, and overall structure to ensure the instruction is easily understood and executed.
The output should only contain the enhanced prompt text. Do not add any extra commentary or explanation.

Original Prompt:
\`\`\`
{{{prompt}}}
\`\`\`
`,
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await enhancePromptGenkitPrompt(input, { model: 'googleai/gemini-2.0-flash' });
    if (!output) {
      throw new Error('Failed to enhance prompt.');
    }
    return output;
  }
);
