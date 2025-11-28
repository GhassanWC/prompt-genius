'use server';
/**
 * @fileOverview Enhances an AI role/persona definition for use with builders.
 *
 * - enhanceAiRole - A function that refines the AI role text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceAiRoleInputSchema = z.object({
  role: z.string().describe('The AI role/persona description to enhance.'),
});

export type EnhanceAiRoleInput = z.infer<typeof EnhanceAiRoleInputSchema>;

const EnhanceAiRoleOutputSchema = z.object({
  enhancedRole: z
    .string()
    .describe('The refined AI role/persona, ready to be used before a sequence of prompts.'),
});

export type EnhanceAiRoleOutput = z.infer<typeof EnhanceAiRoleOutputSchema>;

export async function enhanceAiRole(input: EnhanceAiRoleInput): Promise<EnhanceAiRoleOutput> {
  return enhanceAiRoleFlow(input);
}

const enhanceAiRolePrompt = ai.definePrompt({
  name: 'enhanceAiRolePrompt',
  input: { schema: EnhanceAiRoleInputSchema },
  output: { schema: EnhanceAiRoleOutputSchema },
  prompt: `You are an expert prompt engineer specializing in writing AI role/persona definitions.

Your task is to take the user's existing AI role text and rewrite it so that:
- It is clear, concise, and free of redundancy.
- It keeps all important constraints and responsibilities.
- It stays in the same style (bullet points, sections) where possible.
- It is safe, professional, and neutral in tone.

Return ONLY the improved role text. Do not add any commentary or extra fields.

Original AI role:
\`\`\`markdown
{{{role}}}
\`\`\``,
});

const enhanceAiRoleFlow = ai.defineFlow(
  {
    name: 'enhanceAiRoleFlow',
    inputSchema: EnhanceAiRoleInputSchema,
    outputSchema: EnhanceAiRoleOutputSchema,
  },
  async (input) => {
    const { output } = await enhanceAiRolePrompt(input, {
      model: 'googleai/gemini-2.0-flash',
    });
    if (!output) {
      throw new Error('Failed to enhance AI role.');
    }
    return output;
  }
);


