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
  enhancedIdea: z.string().describe('An improved and more detailed version of the original user idea, suitable for generating a development plan.'),
  developmentPlan: z.array(
    z.object({
      phase: z.string().describe('The development phase, either "Frontend" or "Backend".'),
      title: z.string().describe('A short title for the step.'),
      environment: z.enum(["Replit", "Blob", "Supabase", "Generic"]).describe('The target environment for the step.'),
      dir: z.string().optional().describe('The target directory or file path.'),
      command: z.string().optional().describe('A shell or CLI command to run.'),
      prompt: z.string().describe('A copy-paste ready, platform-agnostic prompt.'),
      mapFlow: z.string().describe('A brief, high-level explanation of the logic behind this prompt and how it fits into the overall plan.'),
      timeEstimate: z.string().optional().describe('An estimate of the time required for the step.'),
      complexity: z.enum(["low", "medium", "high"]).optional().describe('The complexity of the step.'),
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
  prompt: `You are an expert project manager and software architect. Your task is to take a user’s project idea, refine it, and then break it down into a structured, sequential, and complete development plan. Your output must be a single JSON object, containing:

1. **enhancedIdea**:  
   A clear, fleshed-out summary of the user’s concept, with edge cases and core features clarified.

2. **developmentPlan**:  
   An array of strictly ordered steps—first all “Frontend” steps, then all “Backend” steps—each with these fields:
   - **phase**: \`"Frontend"\` or \`"Backend"\`.  
   - **title**: Short descriptive name.  
   - **environment**: One of \`["Replit", "Blob", "Supabase", "Generic"]\`.  
   - **dir**: (optional) The target directory or file path, e.g. \`"src/components"\` or \`"database/migrations"\`.  
   - **command**: (optional) A shell or CLI command to run, e.g. \`"npx create-next-app --ts"\`.  
   - **prompt**: A copy-and-paste–ready instruction block. It must begin with an environment tag in square brackets, include any CLI/install commands, file-paths, and end with “_Return only code, no explanations or markdown fences_.”  
   - **mapFlow**: One sentence on how this step fits into the overall flow.  
   - **timeEstimate**: (optional) e.g. \`"30m"\`, \`"2h"\`.  
   - **complexity**: (optional) \`"low" | "medium" | "high"\`.

**Instructions for generation**  
- Emit **only** the JSON object—no extra text.  
- Use atomic, single-action steps (install, scaffold, write file, test).  
- Always tag your prompts with \`[Platform: …]\` and \`[Dir: …]\` or \`[File: …]\` when writing code.  
- End every \`prompt\` with:  
  \`Return only the file contents, no markdown fences or extra commentary.\`  

Here’s the user’s original idea:  
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
