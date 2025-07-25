
'use server';

/**
 * @fileOverview A Genkit flow to scan a receipt image and extract expense details.
 *
 * - scanReceipt - A function that takes a receipt image and returns structured data.
 * - ScanReceiptInput - The input type for the scanReceipt function.
 * - ScanReceiptOutput - The return type for the scanReceipt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ScanReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  description: z.string().describe('A short, suitable description for the expense (e.g., "Lunch at The Cafe", "Groceries from SuperMart").'),
  amount: z.number().describe('The final total amount from the receipt.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: { schema: ScanReceiptInputSchema },
  output: { schema: ScanReceiptOutputSchema },
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `Analyze the following receipt image and extract the key information.

- The description should be based on the merchant's name or the most prominent items.
- The amount must be the final total, including any taxes or tips.
- The date should be formatted as YYYY-MM-DD.

Receipt: {{media url=receiptDataUri}}`,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
