'use server';

/**
 * @fileOverview A Genkit flow to generate a natural language summary of group expenses.
 *
 * @exports summarizeExpenses - An async function that takes expense data and returns a summary.
 * @exports SummarizeExpensesInput - The input type for the summarizeExpenses function.
 * @exports SummarizeExpensesOutput - The output type for the summarizeExpenses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpenseInfoSchema = z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string(),
});

const SummarizeExpensesInputSchema = z.object({
  groupName: z.string().describe("The name of the group."),
  expenses: z.array(ExpenseInfoSchema).describe("An array of expenses for the group."),
});
export type SummarizeExpensesInput = z.infer<typeof SummarizeExpensesInputSchema>;

const SummarizeExpensesOutputSchema = z.object({
  summary: z.string().describe('A friendly, insightful, and brief summary of the spending habits (1-2 sentences).'),
});
export type SummarizeExpensesOutput = z.infer<typeof SummarizeExpensesOutputSchema>;

export async function summarizeExpenses(input: SummarizeExpensesInput): Promise<SummarizeExpensesOutput> {
  return summarizeExpensesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeExpensesPrompt',
  input: { schema: SummarizeExpensesInputSchema },
  output: { schema: SummarizeExpensesOutputSchema },
  prompt: `You are a helpful financial assistant. Analyze the following list of expenses for the group "{{groupName}}" and provide a short, friendly, and insightful summary of their spending habits in 1-2 sentences. Focus on the most significant categories or trends.

Expenses:
{{#each expenses}}
- {{description}} ({{category}}): ₹{{amount}}
{{/each}}
`,
});

const summarizeExpensesFlow = ai.defineFlow(
  {
    name: 'summarizeExpensesFlow',
    inputSchema: SummarizeExpensesInputSchema,
    outputSchema: SummarizeExpensesOutputSchema,
  },
  async input => {
    // If there are no expenses, return a default message to avoid calling the AI.
    if (input.expenses.length === 0) {
      return { summary: "There are no expenses to analyze for this group yet." };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
