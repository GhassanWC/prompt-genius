'use server';
/**
 * @fileOverview Execution Follow-Up Agent - Analyzes gaps between original prompts and AI execution.
 * 
 * This agent helps users repair prompts when AI tools don't follow instructions.
 * It identifies why prompts failed in execution and generates corrective prompts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExecutionFollowUpInputSchema = z.object({
  originalPrompt: z.string().describe('The original prompt that was given to the AI.'),
  actualOutput: z.string().describe('What the AI actually did or produced (paste the behavior/output here).'),
  desiredOutcome: z.string().optional().describe('Optional: What the user actually wanted to achieve (if not clear from the original prompt).'),
  aiTool: z.string().optional().describe('Optional: The AI tool used (Cursor, ChatGPT, Gemini, Copilot, etc.).'),
});

export type ExecutionFollowUpInput = z.infer<typeof ExecutionFollowUpInputSchema>;

const ExecutionFollowUpOutputSchema = z.object({
  gapAnalysis: z.string().describe('Analysis of why the prompt failed in execution - what went wrong and why.'),
  correctivePrompt: z.string().describe('A corrective, copy-paste ready prompt that restates constraints, locks decisions, removes ambiguity, and realigns the AI with original intent.'),
  keyIssues: z.array(z.string()).describe('List of specific issues identified (e.g., missing constraints, ambiguity, drift).'),
  recommendations: z.string().describe('Additional recommendations for improving prompt execution.'),
});

export type ExecutionFollowUpOutput = z.infer<typeof ExecutionFollowUpOutputSchema>;

export async function executionFollowUp(input: ExecutionFollowUpInput): Promise<ExecutionFollowUpOutput> {
  return executionFollowUpFlow(input);
}

const executionFollowUpGenkitPrompt = ai.definePrompt({
  name: 'executionFollowUpPrompt',
  input: {schema: ExecutionFollowUpInputSchema},
  output: {schema: ExecutionFollowUpOutputSchema},
  prompt: `You are an expert prompt repair agent specializing in analyzing execution failures. Your task is to identify why an AI tool failed to follow a prompt correctly and generate a corrective prompt that will steer the AI back on track.

**Your Role:**
- Analyze the gap between what was requested and what was actually produced
- Identify root causes of execution failures (not theoretical issues, but actual execution problems)
- Generate corrective prompts that are copy-paste ready for immediate use
- Focus on practical fixes: restating constraints, locking decisions, removing ambiguity, realigning intent

**Analysis Framework:**
1. **Constraint Violation**: Did the AI ignore specific constraints or requirements?
2. **Decision Drift**: Did the AI make decisions that deviated from the original intent?
3. **Ambiguity Exploitation**: Did the AI exploit ambiguous language to take shortcuts?
4. **Scope Creep/Reduction**: Did the AI add unnecessary elements or omit required ones?
5. **Format/Structure Issues**: Did the AI ignore specified output formats or structures?
6. **Context Loss**: Did the AI forget or ignore important context from the prompt?

**Output Requirements:**
- The corrective prompt MUST be immediately usable - copy, paste, and run
- The corrective prompt should explicitly restate all constraints
- The corrective prompt should lock down any decisions that were left open
- The corrective prompt should remove all identified ambiguities
- The corrective prompt should clearly realign with the original intent
- Be direct and actionable - this is a control prompt, not a conversation starter

**Original Prompt:**
\`\`\`
{{{originalPrompt}}}
\`\`\`

**What the AI Actually Did:**
\`\`\`
{{{actualOutput}}}
\`\`\`

{{#if desiredOutcome}}
**Desired Outcome:**
\`\`\`
{{{desiredOutcome}}}
\`\`\`

{{/if}}
{{#if aiTool}}
**AI Tool Used:** {{{aiTool}}}

{{/if}}
Now analyze the execution gap and provide:
1. A detailed gap analysis explaining why the prompt failed in execution
2. A corrective, copy-paste ready prompt that fixes all identified issues
3. A list of specific key issues that were found
4. Recommendations for preventing similar issues in the future

Remember: The output should be a control prompt designed to steer the AI back on track, not code or chat. This prompt will be used across tools like Cursor, ChatGPT, Gemini, and Copilot.
`,
});

const executionFollowUpFlow = ai.defineFlow(
  {
    name: 'executionFollowUpFlow',
    inputSchema: ExecutionFollowUpInputSchema,
    outputSchema: ExecutionFollowUpOutputSchema,
  },
  async input => {
    const {output} = await executionFollowUpGenkitPrompt(input, { model: 'googleai/gemini-2.0-flash' });
    if (!output) {
      throw new Error('Failed to generate execution follow-up analysis.');
    }
    return output;
  }
);

