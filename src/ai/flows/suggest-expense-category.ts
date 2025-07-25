'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting expense categories based on a user-provided description.
 *
 * @exports suggestExpenseCategory - An async function that takes an expense description and returns a suggested category.
 * @exports SuggestExpenseCategoryInput - The input type for the suggestExpenseCategory function.
 * @exports SuggestExpenseCategoryOutput - The output type for the suggestExpenseCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExpenseCategoryInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the expense entered by the user.'),
});
export type SuggestExpenseCategoryInput = z.infer<
  typeof SuggestExpenseCategoryInputSchema
>;

const SuggestExpenseCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the expense.'),
});
export type SuggestExpenseCategoryOutput = z.infer<
  typeof SuggestExpenseCategoryOutputSchema
>;

export async function suggestExpenseCategory(
  input: SuggestExpenseCategoryInput
): Promise<SuggestExpenseCategoryOutput> {
  return suggestExpenseCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExpenseCategoryPrompt',
  input: {schema: SuggestExpenseCategoryInputSchema},
  output: {schema: SuggestExpenseCategoryOutputSchema},
  prompt: `Given the following expense description, suggest a suitable category. Respond with ONLY the category name.

Description: {{{description}}}`,
});

const suggestExpenseCategoryFlow = ai.defineFlow(
  {
    name: 'suggestExpenseCategoryFlow',
    inputSchema: SuggestExpenseCategoryInputSchema,
    outputSchema: SuggestExpenseCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
