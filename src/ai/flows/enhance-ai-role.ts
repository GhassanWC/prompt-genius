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
    .describe(
      'The refined AI role/persona, focused on the AI acting as an expert software developer (e.g., mobile, web, backend) with clear sections such as Code Style, Architecture, API Usage, Security, Performance, UI/UX, Internationalization, Accessibility, Testing, and Publishing.'
    ),
});

export type EnhanceAiRoleOutput = z.infer<typeof EnhanceAiRoleOutputSchema>;

export async function enhanceAiRole(input: EnhanceAiRoleInput): Promise<EnhanceAiRoleOutput> {
  return enhanceAiRoleFlow(input);
}

const enhanceAiRolePrompt = ai.definePrompt({
  name: 'enhanceAiRolePrompt',
  input: { schema: EnhanceAiRoleInputSchema },
  output: { schema: EnhanceAiRoleOutputSchema },
  prompt: `You are an expert prompt engineer specializing in writing AI role/persona definitions,
with a focus on software development assistants (mobile, web, backend, or full‑stack).

Your task is to take the user's existing AI role text and rewrite it so that:
- It clearly defines the AI as an **expert software developer** for the relevant platform/stack (for example, "You are an expert mobile app developer, proficient in cross‑platform development using React Native, AI integration, and API consumption.").
- It is clear, concise, and free of redundancy.
- It keeps all important constraints, responsibilities, and safety requirements from the original.
- It is safe, professional, and neutral in tone.

When you rewrite the role, use a **structured markdown format** with headings and bullet points.  
Aim for sections similar to (adapt and rename as appropriate for the project):
- **Code Style and Structure**
- **Architecture and Best Practices**
- **API/SDK Usage**
- **Security and Privacy**
- **Performance and Optimization**
- **UI/UX**
- **Internationalization**
- **Accessibility**
- **Testing and Debugging**
- **Publishing and Maintenance**

Each section should contain specific, actionable bullet points that guide how the AI should behave as a developer for this project.

If the original role is already close to this structure, refine and complete it rather than changing it arbitrarily.

Return ONLY the improved role text in markdown. Do not add any commentary or extra fields.

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



