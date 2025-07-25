
'use server';

/**
 * @fileOverview A Genkit flow to suggest settling up outstanding debts.
 *
 * @exports suggestSettlement - An async function that takes user debts and returns a friendly reminder.
 * @exports SuggestSettlementInput - The input type for the suggestSettlement function.
 * @exports SuggestSettlementOutput - The output type for the suggestSettlement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DebtInfoSchema = z.object({
  owedTo: z.string().describe('The name of the person the user owes money to.'),
  amount: z.number().describe('The amount owed.'),
});

const SuggestSettlementInputSchema = z.object({
  userName: z.string().describe("The user's name."),
  debts: z.array(DebtInfoSchema).describe('A list of debts the user has.'),
});
export type SuggestSettlementInput = z.infer<typeof SuggestSettlementInputSchema>;

const SuggestSettlementOutputSchema = z.object({
  suggestion: z.string().describe('A friendly and encouraging message suggesting the user settle their debts.'),
});
export type SuggestSettlementOutput = z.infer<typeof SuggestSettlementOutputSchema>;

export async function suggestSettlement(input: SuggestSettlementInput): Promise<SuggestSettlementOutput> {
  return suggestSettlementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSettlementPrompt',
  input: { schema: SuggestSettlementInputSchema },
  output: { schema: SuggestSettlementOutputSchema },
  prompt: `
    You are a friendly financial assistant in an expense-splitting app. Your goal is to gently encourage users to settle their debts.

    User Information:
    - Name: {{userName}}
    - Owes money to: 
    {{#each debts}}
    - {{owedTo}} (₹{{amount}})
    {{/each}}

    Based on this, generate a short, friendly, and non-demanding message (1-2 sentences) for {{userName}}. 
    The tone should be a helpful nudge, not a scolding reminder. For example: "Hey {{userName}}, ready to clear your tabs? Settling up with {{#each debts}}{{owedTo}}{{#if @last}}{{else}}, {{/if}}{{/each}} is easy!"

    Your response must be in the specified JSON format.
  `,
});


const suggestSettlementFlow = ai.defineFlow(
  {
    name: 'suggestSettlementFlow',
    inputSchema: SuggestSettlementInputSchema,
    outputSchema: SuggestSettlementOutputSchema,
  },
  async input => {
    if (input.debts.length === 0) {
      return { suggestion: '' };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
