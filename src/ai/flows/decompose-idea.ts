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

**Your scope is strictly limited to software development projects.** If the user’s idea is not about software development (e.g., writing a book, planning a vacation, a marketing campaign), you must politely decline by returning a JSON object where \`developmentPlan\` is an empty array and \`enhancedIdea\` contains a refusal message (e.g., "I can only help with software project ideas."). Do not generate clarification steps for non-software ideas.

**Emit only a single JSON object** with these top-level fields:

1. **clarificationSteps**:
   An array of 1–3 objects, each with:
   - **step**: integer (1, 2, …)
   - **userPrompt**: a plain-English question for the user to clarify ambiguity (e.g., "Do you need user accounts or just public access?").

2. **enhancedIdea**:
   A clear, fleshed-out summary of the user’s concept, including edge cases and core features, phrased in straightforward English.

3. **developmentPlan**:
   An array of strictly ordered, **atomic** steps that create a full end-to-end plan. Each step object must include:
   - **title**: a short descriptive name for the task.
   - **userPrompt**: a simple, single-action English instruction the user can paste verbatim into any AI builder chat. Frame this from the user's perspective (e.g., "Create a new screen called 'Home'").
   - **mapFlow**: one sentence explaining how this step fits into the overall project story (e.g., "This establishes the main entry point for users.").
   - **timeEstimate** (optional): e.g. \`"15m"\`, \`"1h"\`.
   - **complexity** (optional): \`"low" | "medium" | "high"\`.
   - **acceptanceCriteria**: an array of 1-3 bullet-point strings describing what “done” looks like for this specific step. This is **mandatory**. Be specific (e.g., "Shows 'No results' if the search is empty," "Tapping the button navigates to the profile page.").

**Rules for userPrompt generation:**
- **Be Atomic:** Each prompt must be a single, focused action. (e.g., separate "define the data model" from "populate it with mock data").
- **Use Examples:** When defining data models or schemas, include a simple example value in the prompt. (e.g., "Define a 'CoffeeShop' record... Use this sample entry: { name: 'Cafe Sunrise' }").
- **Cover Edge Cases:** Explicitly include prompts for handling empty states and potential errors (e.g., "If the user is not logged in, show a login button.").
- **Include Checkpoints:** After every 4-5 steps, insert a checkpoint prompt like "Pause and test the app to confirm the login and list screens work as expected."
- **Finish with a Test:** The final step should always be a smoke-test prompt, like "Run the app and confirm there are no errors on startup."
- **Use Plain English:** Absolutely no code, CLI commands, file paths, or technical jargon.

**Overall Rules:**
- Emit **only** the JSON object—no extra text or fields.
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
