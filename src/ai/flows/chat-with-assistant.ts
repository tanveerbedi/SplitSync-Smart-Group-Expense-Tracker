
'use server';

/**
 * @fileOverview A Genkit flow for general conversational chat with the AI assistant.
 *
 * @exports chatWithAssistant - An async function that takes a message and returns a conversational response.
 * @exports ChatWithAssistantInput - The input type for the chatWithAssistant function.
 * @exports ChatWithAssistantOutput - The output type for the chatWithAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAssistantInputSchema = z.object({
  message: z.string().describe("The user's message."),
  currentUserName: z.string().describe("The name of the current user."),
});
export type ChatWithAssistantInput = z.infer<typeof ChatWithAssistantInputSchema>;

const ChatWithAssistantOutputSchema = z.object({
  response: z.string().describe("The AI assistant's friendly, conversational response."),
});
export type ChatWithAssistantOutput = z.infer<typeof ChatWithAssistantOutputSchema>;

export async function chatWithAssistant(input: ChatWithAssistantInput): Promise<ChatWithAssistantOutput> {
  return chatWithAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAssistantPrompt',
  input: { schema: ChatWithAssistantInputSchema },
  output: { schema: ChatWithAssistantOutputSchema },
  prompt: `You are SplitSync Assistant, a friendly AI in an expense-splitting app.
Your personality is helpful and concise. The user, {{currentUserName}}, is talking to you.
This is not a command, but a general question or statement. Provide a short, conversational response.

User's message: "{{message}}"
`,
});

const chatWithAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAssistantFlow',
    inputSchema: ChatWithAssistantInputSchema,
    outputSchema: ChatWithAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error) {
      console.error("AI chat call failed:", error);
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('503'))) {
        return { response: "I'm a bit busy right now. Please try again in a moment." };
      }
      return { response: "Sorry, I encountered an error. Please try again." };
    }
  }
);
