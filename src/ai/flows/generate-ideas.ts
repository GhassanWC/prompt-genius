'use server';
/**
 * @fileOverview Generates creative project ideas for users based on optional context.
 *
 * - generateIdeas - A function that generates project ideas.
 * - GenerateIdeasInput - The input type for the generateIdeas function.
 * - GenerateIdeasOutput - The return type for the generateIdeas function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIdeasInputSchema = z.object({
  context: z.string().optional().describe('Optional context or preferences to guide idea generation (e.g., "web apps", "mobile", "AI tools", "productivity").'),
  count: z.number().optional().default(6).describe('Number of ideas to generate (default: 6).'),
});
export type GenerateIdeasInput = z.infer<typeof GenerateIdeasInputSchema>;

const ProjectIdeaSchema = z.object({
  id: z.string().describe('Unique identifier for this idea (e.g., "idea-1", "idea-2").'),
  title: z.string().describe('A catchy, memorable project name (2-4 words).'),
  tagline: z.string().describe('A short, punchy tagline that captures the essence (max 10 words).'),
  description: z.string().describe('A detailed description of the project idea (2-3 sentences).'),
  category: z.enum(['web-app', 'mobile-app', 'ai-tool', 'saas', 'chrome-extension', 'api', 'devtool', 'productivity', 'social', 'e-commerce', 'education', 'health', 'finance', 'entertainment', 'other']).describe('The primary category of the project.'),
  techStack: z.array(z.string()).describe('Suggested technologies for building this project (2-4 items).'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Estimated difficulty level.'),
  timeEstimate: z.string().describe('Estimated time to build (e.g., "2-3 days", "1 week", "2-4 weeks").'),
  icon: z.string().describe('An emoji that represents the project.'),
});
export type ProjectIdea = z.infer<typeof ProjectIdeaSchema>;

const GenerateIdeasOutputSchema = z.object({
  ideas: z.array(ProjectIdeaSchema).describe('Array of generated project ideas.'),
});
export type GenerateIdeasOutput = z.infer<typeof GenerateIdeasOutputSchema>;

export async function generateIdeas(input: GenerateIdeasInput): Promise<GenerateIdeasOutput> {
  return generateIdeasFlow(input);
}

const generateIdeasPrompt = ai.definePrompt({
  name: 'generateIdeasPrompt',
  input: { schema: GenerateIdeasInputSchema },
  output: { schema: GenerateIdeasOutputSchema },
  prompt: `You are a creative product strategist and startup idea generator. Your task is to generate innovative, practical software project ideas that developers can build.

**Guidelines:**
1. Generate exactly {{{count}}} unique project ideas.
2. Each idea should be:
   - Practical and buildable by a single developer or small team
   - Solving a real problem or providing genuine value
   - Interesting and engaging to work on
   - Achievable within a reasonable timeframe
3. Vary the ideas across different categories and difficulty levels.
4. Make titles catchy and memorable (think startup names).
5. Taglines should be punchy and instantly communicate value.
6. Descriptions should clearly explain what the project does and who it's for.
7. Tech stack suggestions should be modern and practical.

{{#if context}}
**User Preferences/Context:**
The user is interested in: {{{context}}}
Tailor your ideas to match these preferences while still providing variety.
{{else}}
**No specific preferences provided.**
Generate a diverse mix of ideas across different categories: web apps, mobile apps, AI tools, Chrome extensions, SaaS products, developer tools, etc.
{{/if}}

**Diversity Requirements:**
- Include at least one beginner-friendly project
- Include at least one advanced/challenging project
- Mix different categories (don't repeat the same category more than twice)
- Vary the time estimates

**Output Format:**
Return a JSON object with an "ideas" array containing exactly {{{count}}} project ideas.

**Example Output Structure:**
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "CodeSnap",
      "tagline": "Beautiful code screenshots in seconds",
      "description": "A web app that transforms code snippets into stunning, shareable images with customizable themes, backgrounds, and syntax highlighting. Perfect for developers sharing on social media.",
      "category": "devtool",
      "techStack": ["Next.js", "Tailwind CSS", "html-to-image"],
      "difficulty": "beginner",
      "timeEstimate": "2-3 days",
      "icon": "📸"
    }
  ]
}

Now generate {{{count}}} creative, practical project ideas:`,
});

const generateIdeasFlow = ai.defineFlow(
  {
    name: 'generateIdeasFlow',
    inputSchema: GenerateIdeasInputSchema,
    outputSchema: GenerateIdeasOutputSchema,
  },
  async (input) => {
    try {
      const response = await generateIdeasPrompt(
        { 
          context: input.context, 
          count: input.count || 6 
        }, 
        {
          model: 'googleai/gemini-2.0-flash',
        }
      );

      const output = response.output;

      if (!output || !output.ideas || output.ideas.length === 0) {
        console.error('AI prompt failed to generate ideas.', {
          finishReason: response.finishReason,
          finishMessage: response.finishMessage,
        });
        throw new Error(
          `The AI failed to generate project ideas. Finish reason: ${response.finishReason}`
        );
      }

      return output;
    } catch (e: any) {
      console.error('Error in generateIdeasFlow:', e);
      throw new Error(
        `Failed to generate project ideas. Please try again. Original error: ${e.message}`
      );
    }
  }
);

