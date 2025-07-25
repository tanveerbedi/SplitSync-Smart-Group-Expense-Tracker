
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting a merchant name based on a partial input.
 *
 * @exports suggestMerchant - An async function that takes a partial expense description and returns a suggested merchant name.
 * @exports SuggestMerchantInput - The input type for the suggestMerchant function.
 * @exports SuggestMerchantOutput - The output type for the suggestMerchant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const SuggestMerchantInputSchema = z.object({
  text: z
    .string()
    .describe('The partial description of the expense entered by the user.'),
});
export type SuggestMerchantInput = z.infer<
  typeof SuggestMerchantInputSchema
>;

const SuggestMerchantOutputSchema = z.object({
  merchant: z.string().describe('The suggested full merchant name for the expense.'),
});
export type SuggestMerchantOutput = z.infer<
  typeof SuggestMerchantOutputSchema
>;

export async function suggestMerchant(
  input: SuggestMerchantInput
): Promise<SuggestMerchantOutput> {
  return suggestMerchantFlow(input);
}

const suggestMerchantFlow = ai.defineFlow(
  {
    name: 'suggestMerchantFlow',
    inputSchema: SuggestMerchantInputSchema,
    outputSchema: SuggestMerchantOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `Based on the following partial text, suggest a plausible full merchant name. For example, if the user types "starb", you might suggest "Starbucks".

Input: ${input.text}`,
        output: {
            schema: SuggestMerchantOutputSchema
        }
    });
    return output!;
  }
);
