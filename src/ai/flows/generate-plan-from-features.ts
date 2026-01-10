'use server';
/**
 * @fileOverview Generates development plan steps from selected feature categories.
 *
 * - generatePlanFromFeatures - A function that generates prompts for selected features.
 * - GeneratePlanFromFeaturesInput - The input type.
 * - GeneratePlanFromFeaturesOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DecomposeIdeaOutput } from './decompose-idea';

const GeneratePlanFromFeaturesInputSchema = z.object({
  enhancedIdea: z.string().describe('The enhanced project idea.'),
  aiRole: z.string().describe('The AI role definition.'),
  selectedFeatureIds: z.array(z.string()).describe('Array of feature category IDs that the user selected.'),
  allFeatures: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      priority: z.enum(['essential', 'important', 'optional']),
      estimatedSteps: z.number(),
    })
  ).describe('All available feature categories with their details.'),
  customFeatures: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ).optional().describe('Any custom features the user added.'),
});

export type GeneratePlanFromFeaturesInput = z.infer<typeof GeneratePlanFromFeaturesInputSchema>;

const GeneratePlanFromFeaturesOutputSchema = z.object({
  developmentPlan: z.array(
    z.object({
      title: z.string().describe('A short title for the step.'),
      userPrompt: z.string().describe('A simple English instruction the user can use in any AI builder chat.'),
      mapFlow: z.string().describe('A brief, high-level explanation of the logic behind this prompt and how it fits into the overall plan.'),
      acceptanceCriteria: z.array(z.string()).describe('A list of 1-3 conditions that must be met for the step to be considered complete.'),
      featureCategoryId: z.string().optional().describe('The ID of the feature category this step belongs to.'),
    })
  ).describe('An ordered array of development steps for the selected features.'),
});

export type GeneratePlanFromFeaturesOutput = z.infer<typeof GeneratePlanFromFeaturesOutputSchema>;

export async function generatePlanFromFeatures(input: GeneratePlanFromFeaturesInput): Promise<GeneratePlanFromFeaturesOutput> {
  return generatePlanFromFeaturesFlow(input);
}

const GeneratePlanFromFeaturesPromptInputSchema = z.object({
  enhancedIdea: z.string(),
  aiRole: z.string(),
  selectedFeatureIdsJson: z.string(),
  allFeaturesJson: z.string(),
  customFeaturesJson: z.string().optional(),
}).passthrough(); // Allow extra fields for template variables

const generatePlanFromFeaturesPrompt = ai.definePrompt({
  name: 'generatePlanFromFeaturesPrompt',
  input: {schema: GeneratePlanFromFeaturesPromptInputSchema},
  output: {schema: GeneratePlanFromFeaturesOutputSchema},
  prompt: `You are an expert project manager and software architect. Your task is to generate a detailed, sequential development plan (as prompts) ONLY for the selected feature categories provided by the user.

**Context:**
- Project Idea: {{{enhancedIdea}}}
- AI Role: {{{aiRole}}}
- Selected Feature IDs: {{{selectedFeatureIdsJson}}}
- All Available Features (for reference): {{{allFeaturesJson}}}
{{{customFeaturesJson}}}

**Your task:**
Generate a complete, ordered sequence of development steps (prompts) that will build all the selected features. Each prompt must be a simple, natural-language instruction—no code, commands, or technical details.

**Rules for prompt generation:**
- **Be Atomic:** Each prompt must be a single, focused action. (e.g., separate "define the data model" from "populate it with mock data").
- **Use Examples:** When defining data models or schemas, include a simple example value in the prompt. (e.g., "Define a 'CoffeeShop' record... Use this sample entry: { name: 'Cafe Sunrise' }").
- **Cover Edge Cases:** Explicitly include prompts for handling empty states and potential errors (e.g., "If the user is not logged in, show a login button.").
- **Order Matters:** Place prerequisites first. For example, database setup before data fetching, authentication before protected routes.
- **Feature Grouping:** Group steps by feature category when logical, but ensure dependencies are respected across features.
- **Finish with Testing:** At the very end, include **one** final smoke-test step like "Run the app and confirm there are no errors on startup and the core flows work as expected."
- **Use Plain English:** Absolutely no code, CLI commands, file paths, or technical jargon.
- **Skip Boilerplate:** **Do NOT create steps about generic project initialization or tooling setup.** Assume the project is already created and dependencies are installed. Avoid steps like "create a new React app", "set up the project with React and Node.js", "initialize a Git repository", or "install basic libraries". Focus only on **feature-level work** that makes the idea powerful (screens, flows, APIs, business logic, permissions, analytics, etc.).
- **Acceptance Criteria:** Every step MUST have 1-3 specific, testable acceptance criteria. Be specific (e.g., "Shows 'No results' if the search is empty," "Tapping the button navigates to the profile page.").

**Output Format:**
Emit a JSON object with a single field:
- **developmentPlan**: An array of step objects, each containing:
  - **title**: A short descriptive name (e.g., "Create Login Screen")
  - **userPrompt**: A simple English instruction (e.g., "Create a login screen with email and password fields, a submit button, and a link to sign up")
  - **mapFlow**: One sentence explaining how this step fits into the overall plan (e.g., "This establishes user authentication, which is required before accessing the main app.")
  - **acceptanceCriteria**: An array of 1-3 specific, testable conditions (e.g., ["User can enter email and password", "Submit button is disabled until both fields are filled", "Error message appears if credentials are invalid"])
  - **featureCategoryId**: (Optional) The ID of the feature category this step belongs to

**Important:**
- Generate steps ONLY for the selected features (matching IDs in selectedFeatureIds array)
- If custom features were provided, treat them as if they were predefined features and generate appropriate steps
- Ensure the sequence is logical and respects dependencies
- Make the plan comprehensive but focused—each selected feature should have 2-8 development steps

**Selected Features to Generate Prompts For:**
{{{selectedFeatureIdsJson}}}

**All Available Features (for context):**
{{{allFeaturesJson}}}

Generate the development plan now.`,
});

const generatePlanFromFeaturesFlow = ai.defineFlow(
  {
    name: 'generatePlanFromFeaturesFlow',
    inputSchema: GeneratePlanFromFeaturesInputSchema,
    outputSchema: GeneratePlanFromFeaturesOutputSchema,
  },
  async (input) => {
    try {
      // Format the input for the prompt template
      const allFeaturesList = input.allFeatures.map(f => `- ${f.name} (${f.id}): ${f.description} [Priority: ${f.priority}, Est. Steps: ${f.estimatedSteps}]`).join('\n');
      const selectedFeaturesList = input.allFeatures
        .filter(f => input.selectedFeatureIds.includes(f.id))
        .map(f => `- ${f.name} (${f.id}): ${f.description} [Priority: ${f.priority}, Est. Steps: ${f.estimatedSteps}]`)
        .join('\n');
      
      const customFeaturesText = input.customFeatures && input.customFeatures.length > 0
        ? `\n- Custom Features Added:\n${input.customFeatures.map(f => `  - ${f.name}: ${f.description}`).join('\n')}`
        : '\n- Custom Features Added: None';

      const formattedInput: any = {
        enhancedIdea: input.enhancedIdea,
        aiRole: input.aiRole,
        selectedFeatureIdsJson: input.selectedFeatureIds.join(', '),
        allFeaturesJson: allFeaturesList,
        customFeaturesJson: customFeaturesText,
      };

      const response = await generatePlanFromFeaturesPrompt(formattedInput, {
        model: 'googleai/gemini-2.0-flash',
      });

      const output = response.output;

      if (!output) {
        console.error('AI prompt failed to generate plan from features.', {
          finishReason: response.finishReason,
          finishMessage: response.finishMessage,
        });
        throw new Error(
          `The AI failed to generate a development plan. This could be due to a content safety block or other model error. Finish reason: ${response.finishReason}`
        );
      }
      return output;
    } catch (e: any) {
      console.error('Error in generatePlanFromFeaturesFlow:', e);
      throw new Error(
        `Failed to generate development plan from features. This is often due to a missing API key or network issue. Please check your configuration. Original error: ${e.message}`
      );
    }
  }
);

