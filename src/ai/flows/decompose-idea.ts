'use server';
/**
 * @fileOverview Decomposes a project idea into a sequential development plan.
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

const DecomposeIdeaOutputSchema = z.object({
  clarificationSteps: z.array(
    z.object({
        step: z.number().describe('The step number.'),
        userPrompt: z.string().describe('A plain-English question for the user to clarify ambiguity.'),
    })
  ).describe('A list of questions to ask the user to clarify the project idea.'),
  enhancedIdea: z.string().describe('An improved and more detailed version of the original user idea, suitable for generating a development plan.'),
  developmentPlan: z.array(
    z.object({
      title: z.string().describe('A short title for the step.'),
      userPrompt: z.string().describe('A simple English instruction the user can use in any AI builder chat.'),
      mapFlow: z.string().describe('A brief, high-level explanation of the logic behind this prompt and how it fits into the overall plan.'),
      timeEstimate: z.string().optional().describe('An estimate of the time required for the step.'),
      complexity: z.enum(["low", "medium", "high"]).optional().describe('The complexity of the step.'),
      acceptanceCriteria: z.array(z.string()).optional().describe('A list of conditions that must be met for the step to be considered complete.'),
    })
  ),
});
export type DecomposeIdeaOutput = z.infer<typeof DecomposeIdeaOutputSchema>;

export async function decomposeIdea(input: DecomposeIdeaInput): Promise<DecomposeIdeaOutput> {
  return decomposeIdeaFlow(input);
}

const decomposeIdeaPrompt = ai.definePrompt({
  name: 'decomposeIdeaPrompt',
  input: {schema: DecomposeIdeaInputSchema},
  output: {schema: DecomposeIdeaOutputSchema},
  prompt: `You are an expert project manager and software architect. Your task is to take a user’s project idea (in plain English), clarify any ambiguities, refine it, and then break it down into a structured, sequential, and complete development plan. All prompts you generate must be simple, natural-language instructions—no code, commands, or technical details.

**Emit only a single JSON object** with these top-level fields:

1. **clarificationSteps**:  
   An array of 1–3 objects, each with:  
   - **step**: integer (1, 2, …)  
   - **userPrompt**: a plain-English question the user can answer to remove ambiguity  

2. **enhancedIdea**:  
   A clear, fleshed-out summary of the user’s concept, including edge cases and core features, phrased in straightforward English.

3. **developmentPlan**:  
   An array of strictly ordered, **atomic** steps that create a full end-to-end plan. Each step object must include:
   - **title**: a short descriptive name  
   - **userPrompt**: a simple English instruction the user can paste verbatim into any AI builder chat to accomplish that task  
   - **mapFlow**: one sentence explaining how this step fits into the overall project story  
   - **timeEstimate** (optional): e.g. \`"30m"\`, \`"2h"\`  
   - **complexity** (optional): \`"low" | "medium" | "high"\`  
   - **acceptanceCriteria** (optional): an array of bullet-point strings describing what “done” looks like

**Rules for generation**  
- Emit **only** the JSON object—no extra text or fields.  
- All prompts are in plain English; do not include any code, CLI commands, file paths, or technical jargon.  
- Use atomic, single-action steps (e.g. “Design the signup page,” “Add email/password validation”).  
- Ensure the sequence covers every prerequisite in order.

Here is the user’s original idea:  
\`\`\`text
{{{idea}}}
\`\`\``,
});


const decomposeIdeaFlow = ai.defineFlow(
  {
    name: 'decomposeIdeaFlow',
    inputSchema: DecomposeIdeaInputSchema,
    outputSchema: DecomposeIdeaOutputSchema,
  },
  async (input) => {
    try {
      const response = await decomposeIdeaPrompt(input, {
          model: 'googleai/gemini-2.0-flash', // Hardcoded to the free-tier model
      });

      const output = response.output;

      if (!output) {
        console.error('AI prompt failed to generate a plan.', {
          finishReason: response.finishReason,
          finishMessage: response.finishMessage,
        });
        throw new Error(
          `The AI failed to generate a project plan. This could be due to a content safety block or other model error. Finish reason: ${response.finishReason}`
        );
      }
      return output;
    } catch (e: any) {
      console.error('Error in decomposeIdeaFlow:', e);
      // Re-throw a more user-friendly error. This will be caught by the client component.
      throw new Error(
        `Failed to generate project plan. This is often due to a missing API key or network issue. Please check your configuration. Original error: ${e.message}`
      );
    }
  }
);
