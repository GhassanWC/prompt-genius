'use server';

import { z } from 'genkit';
import { ai } from '../genkit';

const TestPromptInputSchema = z.object({
  fullPrompt: z.string(),
});

const TestPromptOutputSchema = z.object({
  response: z.string(),
});

export type TestPromptInput = {
  prompt: string;
  aiRole?: string;
};

export type TestPromptOutput = z.infer<typeof TestPromptOutputSchema>;

export async function testPrompt(input: TestPromptInput): Promise<TestPromptOutput> {
  return testPromptFlow(input);
}

const testPromptGenkitPrompt = ai.definePrompt({
  name: 'testPromptPrompt',
  input: { schema: TestPromptInputSchema },
  output: { schema: TestPromptOutputSchema },
  prompt: `{{{fullPrompt}}}`,
});

const testPromptFlow = ai.defineFlow(
  {
    name: 'testPromptFlow',
    inputSchema: z.object({
      prompt: z.string(),
      aiRole: z.string().optional(),
    }),
    outputSchema: TestPromptOutputSchema,
  },
  async (input) => {
    // Build the full prompt string dynamically
    let fullPrompt = `You are an expert AI assistant helping users build applications. Your task is to respond to the user's prompt as if you were an AI coding assistant or app builder.

`;

    if (input.aiRole && input.aiRole.trim()) {
      fullPrompt += `Here is the AI role/persona you should adopt:
\`\`\`
${input.aiRole}
\`\`\`

Please follow the guidelines, coding style, architecture principles, and best practices outlined in the AI role above.

`;
    }

    fullPrompt += `User's prompt:
\`\`\`
${input.prompt}
\`\`\`

Please provide a helpful, detailed response that demonstrates how you would handle this prompt. Be specific and actionable. If the prompt asks you to create something, explain what you would create and how. If it asks you to implement a feature, describe the implementation approach.

Your response should be clear, well-structured, and ready to be used as guidance for building the requested feature or functionality.`;

    const { output } = await testPromptGenkitPrompt({ fullPrompt }, { 
      model: 'googleai/gemini-2.0-flash' 
    });
    
    if (!output || !output.response) {
      throw new Error('Failed to generate response for prompt test.');
    }

    return output;
  }
);

