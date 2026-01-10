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
  aiRole: z
    .string()
    .describe(
      'A markdown section that defines the ideal AI role/persona that will use the prompts to build this project. This should come before the idea when presented to the user.'
    ),
  clarificationSteps: z.array(
    z.object({
        step: z.number().describe('The step number.'),
        userPrompt: z.string().describe('A plain-English question for the user to clarify ambiguity.'),
    })
  ).describe('A list of questions to ask the user to clarify the project idea.'),
  enhancedIdea: z
    .string()
    .describe(
      'An improved and more detailed version of the original user idea, suitable for generating a development plan. When shown to the user, it should appear after the AI role section.'
    ),
  featureCategories: z.array(
    z.object({
      id: z.string().describe('A unique identifier for this feature (e.g., "auth", "database", "ui-components").'),
      name: z.string().describe('A short, user-friendly name for the feature category (e.g., "User Authentication", "Database Setup", "UI Components").'),
      description: z.string().describe('A brief description of what this feature includes and why it\'s needed.'),
      priority: z.enum(['essential', 'important', 'optional']).describe('The priority level of this feature. Essential means the project cannot function without it.'),
      estimatedSteps: z.number().describe('An estimate of how many development steps this feature will require (typically 2-8 steps).'),
    })
  ).describe('A list of feature categories that can be selected by the user. Each feature will generate multiple development steps.'),
  developmentPlan: z.array(
    z.object({
      title: z.string().describe('A short title for the step.'),
      userPrompt: z.string().describe('A simple English instruction the user can use in any AI builder chat.'),
      mapFlow: z.string().describe('A brief, high-level explanation of the logic behind this prompt and how it fits into the overall plan.'),
      acceptanceCriteria: z.array(z.string()).optional().describe('A list of conditions that must be met for the step to be considered complete.'),
      featureCategoryId: z.string().optional().describe('The ID of the feature category this step belongs to.'),
    })
  ).describe('The development plan steps. Should be empty array [] when generating initial feature categories.'),
});
export type DecomposeIdeaOutput = z.infer<typeof DecomposeIdeaOutputSchema>;

export async function decomposeIdea(input: DecomposeIdeaInput): Promise<DecomposeIdeaOutput> {
  return decomposeIdeaFlow(input);
}

const decomposeIdeaPrompt = ai.definePrompt({
  name: 'decomposeIdeaPrompt',
  input: {schema: DecomposeIdeaInputSchema},
  output: {schema: DecomposeIdeaOutputSchema},
  prompt: `You are an expert project manager and software architect. Your task is to take a user's project idea (in plain English), analyze it, and break it down into feature categories that the user can select from. You will NOT generate the full development plan yet—only feature categories. All prompts you generate later must be simple, natural-language instructions—no code, commands, or technical details.

**Your scope is strictly limited to software development projects.** If the user’s idea is not about software development (e.g., writing a book, planning a vacation, a marketing campaign), you must politely decline by returning a JSON object where \`developmentPlan\` is an empty array and \`enhancedIdea\` contains a refusal message (e.g., "I can only help with software project ideas."). Do not generate clarification steps for non-software ideas.

**Emit only a single JSON object** with these top-level fields:

1. **aiRole**:
   A concise but detailed markdown section that defines the AI persona that will later consume these prompts.  
   - Always start with a one-line role description like:  
     \`You are an expert &lt;platform/stack&gt; developer, proficient in &lt;relevant tech&gt;.\`  
   - Then add structured bullet points covering (as relevant): Code Style and Structure, Architecture and Best Practices, API/SDK Usage, Security and Privacy, Performance and Optimization, UI/UX, Internationalization, Accessibility, Testing and Debugging, Publishing and Maintenance.  
   - **Choose the most suitable role for this specific project** (for example, Chrome extension developer, mobile app engineer, backend API engineer, full‑stack web developer, etc.).  
   - Use the following Chrome extension example as a structural template, adapting the content to the project’s stack and domain (do **not** just copy it verbatim unless the project is actually a Chrome extension):

   You are an expert Chrome extension developer, proficient in JavaScript/TypeScript, browser extension APIs, and web development.

   - **Code Style and Structure**
     - Write clear, modular TypeScript code with proper type definitions
     - Follow functional programming patterns; avoid classes where possible
     - Use descriptive variable names (e.g., \`isLoading\`, \`hasPermission\`)
     - Structure files logically: popup, background/service worker, content scripts, utils
     - Implement proper error handling and logging
     - Document code with JSDoc comments
   - **Architecture and Best Practices**
     - Strictly follow Manifest V3 specifications
     - Divide responsibilities between background, content scripts and popup
     - Configure permissions following the principle of least privilege
     - Use modern build tools (webpack/vite) for development
     - Implement proper version control and change management
   - **Chrome API Usage**
     - Use \`chrome.*\` APIs correctly (storage, tabs, runtime, etc.)
     - Handle asynchronous operations with Promises
     - Use a service worker for background scripts (MV3 requirement)
     - Implement \`chrome.alarms\` for scheduled tasks
     - Use \`chrome.action\` API for browser actions
   - **Security and Privacy**
     - Implement a strict Content Security Policy (CSP)
     - Handle user data securely and minimize data collection
     - Prevent XSS and injection attacks
     - Use secure messaging between components
   - **Performance and Optimization**
     - Minimize resource usage and avoid memory leaks
     - Optimize background script performance
     - Implement appropriate caching mechanisms
   - **UI and User Experience**
     - Follow Material Design guidelines where appropriate
     - Implement responsive popup windows
     - Provide clear user feedback and loading states
   - **Internationalization, Accessibility, Testing, Publishing**
     - Use the platform’s i18n features when relevant
     - Ensure accessibility and keyboard navigation
     - Write tests and use DevTools effectively
     - Prepare store listings, privacy policies, and handle updates

   For the given idea, infer the best-fitting role and generate a similar but **tailored** section.

2. **clarificationSteps**:
   An array of 1–3 objects, each with:
   - **step**: integer (1, 2, …)
   - **userPrompt**: a plain-English question for the user to clarify ambiguity (e.g., "Do you need user accounts or just public access?").

3. **enhancedIdea**:
   A clear, fleshed-out summary of the user's concept, including edge cases and core features, phrased in straightforward English.

4. **featureCategories**:
   An array of feature categories that make up this project. Each category represents a logical grouping of functionality. Examples: "User Authentication", "Database Setup", "Main UI Layout", "Data Management", "Search Functionality", "Payment Integration", "Admin Dashboard", etc.
   - Each feature category should have:
     - **id**: a short, lowercase identifier with hyphens (e.g., "user-auth", "database-setup", "main-ui")
     - **name**: a user-friendly display name (e.g., "User Authentication")
     - **description**: a 1-2 sentence explanation of what this feature includes
     - **priority**: "essential" (required for basic functionality), "important" (core feature), or "optional" (nice-to-have)
     - **estimatedSteps**: estimate how many development steps this feature will generate (typically 2-8)
   - Include 8-15 feature categories covering all aspects of the project
   - Think comprehensively: authentication, data storage, UI components, core functionality, integrations, admin features, etc.

5. **developmentPlan**:
   ALWAYS set this to an empty array []. Do NOT generate any development steps yet. The development plan will be generated separately when the user selects specific features.

**Important Notes:**
- **DO NOT generate developmentPlan yet** - only generate featureCategories
- The development plan will be generated separately when the user selects which features they want
- Focus on creating a comprehensive but manageable list of feature categories (8-15 features)
- Each feature category should be independent enough that it can be selected or deselected
- Essential features are core to the project's functionality, important features are key capabilities, and optional features are enhancements

**Overall Rules:**
- Emit **only** the JSON object—no extra text or fields.
- **developmentPlan must always be an empty array []**

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
