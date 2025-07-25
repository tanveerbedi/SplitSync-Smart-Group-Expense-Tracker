
'use server';

/**
 * @fileOverview A Genkit flow to suggest a new badge for a user to earn.
 *
 * @exports suggestNextBadge - An async function that takes user stats and returns a badge suggestion.
 * @exports SuggestNextBadgeInput - The input type for the suggestNextBadge function.
 * @exports SuggestNextBadgeOutput - The output type for the suggestNextBadge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestNextBadgeInputSchema = z.object({
  userName: z.string().describe("The user's name."),
  existingBadges: z.array(z.string()).describe('A list of badges the user already has.'),
  availableBadges: z.array(z.string()).describe('A list of all possible badges they can earn.'),
  totalExpensesCreated: z.number().describe('The total number of expenses the user has created.'),
  totalAmountPaid: z.number().describe('The total amount the user has paid in expenses.'),
  groupCount: z.number().describe('The number of groups the user is a member of.'),
});
export type SuggestNextBadgeInput = z.infer<typeof SuggestNextBadgeInputSchema>;

const SuggestNextBadgeOutputSchema = z.object({
  suggestion: z.string().describe('A friendly and encouraging message suggesting a specific badge the user could aim for next, explaining why. e.g., "You\'re close to earning the \'Generous Spender\' badge! Just a few more expenses."'),
  badgeToSuggest: z.string().describe('The title of the single badge being suggested. e.g., "Generous Spender"'),
});
export type SuggestNextBadgeOutput = z.infer<typeof SuggestNextBadgeOutputSchema>;

export async function suggestNextBadge(input: SuggestNextBadgeInput): Promise<SuggestNextBadgeOutput> {
  return suggestNextBadgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextBadgePrompt',
  input: { schema: SuggestNextBadgeInputSchema },
  output: { schema: SuggestNextBadgeOutputSchema },
  prompt: `
    You are a motivational coach in an expense-splitting app. Your goal is to encourage user engagement by suggesting a new badge for them to earn.

    User Information:
    - Name: {{userName}}
    - Badges they already have: {{#each existingBadges}}{{this}}, {{/each}}
    - All available badges: {{#each availableBadges}}{{this}}, {{/each}}
    - Total expenses created: {{totalExpensesCreated}}
    - Total amount paid: ₹{{totalAmountPaid}}
    - Number of groups: {{groupCount}}

    Analyze the user's stats and their existing badges. Pick ONE achievable badge from the "available badges" list that they do not already have.

    Generate a short, friendly, and encouraging suggestion (1-2 sentences) for {{userName}}. Explain what they can do to earn it. For example, if they are close to a spending badge, mention that. If they've joined a few groups, suggest a badge related to joining more.

    Your response must be in the specified JSON format.
  `,
});


const suggestNextBadgeFlow = ai.defineFlow(
  {
    name: 'suggestNextBadgeFlow',
    inputSchema: SuggestNextBadgeInputSchema,
    outputSchema: SuggestNextBadgeOutputSchema,
  },
  async input => {
    // Filter out badges the user already has
    const unearnedBadges = input.availableBadges.filter(
      (badge) => !input.existingBadges.includes(badge)
    );

    if (unearnedBadges.length === 0) {
      return { 
          suggestion: "You're a superstar! You've collected all the available badges. Thanks for being an amazing user!",
          badgeToSuggest: ''
      };
    }
    
    try {
        const { output } = await prompt({ ...input, availableBadges: unearnedBadges });
        return output!;
    } catch (error) {
        console.error("Failed to fetch badge suggestion due to an API error:", error);
        // Return a graceful fallback instead of crashing the app
        return {
            suggestion: "Could not load a smart suggestion right now. Keep up the great work!",
            badgeToSuggest: ''
        };
    }
  }
);
