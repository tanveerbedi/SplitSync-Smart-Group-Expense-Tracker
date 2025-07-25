
'use server';

/**
 * @fileOverview A conversational AI assistant for SplitSync.
 *
 * - assistant - The main function that drives the conversation.
 * - AssistantInput - The input type for the assistant function.
 * - AssistantOutput - The return type for the assistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Tool definitions moved here to resolve 'use server' export issues.

const listGroupsTool = ai.defineTool(
  {
    name: 'listGroupsTool',
    description: 'Returns a list of all available expense groups for the current user. Use this to find a group ID when the user mentions a group name.',
    inputSchema: z.void(),
    outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
  },
  async () => {
    // This is a placeholder. In a real app, you'd fetch this from a database
    // based on the current user's session. Since this flow doesn't have
    // direct access to the store, we can't get the real groups. The prompt
    // is designed to use the groups passed in the input instead.
    return []; 
  }
);


const AddExpenseToolInputSchema = z.object({
    groupId: z.string().describe("The ID of the group to add the expense to."),
    description: z.string().optional().describe("The description of the expense. If not provided by the user, this can be omitted."),
    amount: z.number().describe("The total amount of the expense."),
    paidById: z.string().describe("The ID of the user who paid for the expense."),
});

const addExpenseTool = ai.defineTool(
  {
    name: 'addExpenseTool',
    description: 'Use this tool to add a new expense to a group once you have all the required information (groupId, amount, paidById). The description is optional.',
    inputSchema: AddExpenseToolInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // This tool no longer modifies state. It just confirms the action is valid.
    // The client will handle adding the expense to the store.
    const descriptionText = input.description ? ` for "${input.description}"` : '';
    return `OK, I've prepared an expense for ₹${input.amount}${descriptionText}.`;
  }
);


const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const AssistantInputSchema = z.object({
  message: z.string().describe('The user\'s message or command.'),
  users: z.array(UserSchema).describe('A list of all users in the system.'),
  groups: z.array(GroupSchema).describe('A list of all groups the current user is a member of.'),
  currentUserId: z.string().describe('The ID of the user sending the message.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
    response: z.string().optional().describe('The AI assistant\'s response to the user.'),
    toolCall: z.object({
        name: z.string(),
        input: z.any(),
    }).optional().describe("The tool call to be executed by the client."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}

const PromptInputSchema = AssistantInputSchema.extend({
  usersJson: z.string(),
  groupsJson: z.string(),
});

const prompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: PromptInputSchema },
  tools: [addExpenseTool, listGroupsTool],
  prompt: `You are SplitSync Assistant, a helpful AI integrated into an expense-splitting app. Your personality is friendly, concise, and helpful. You ONLY handle commands to add expenses. Do not engage in general conversation.

User Information:
- The user sending the message has the ID: {{currentUserId}}. When they say "me" or "I", they are referring to this user ID. You can find their name in the users list.

Available Tools:
You have a tool to add expenses.

Command Handling:
- Your primary goal is to gather all information needed for the 'addExpenseTool': 'groupId', 'amount', and 'paidById'. The 'description' is optional.
- To find the 'groupId', you MUST use the user's group list provided below in the "User's groups" JSON. Match the user's text (e.g., "in our apartment group") to the closest group name in the JSON (e.g., "Apartment Mates") and use its ID.
- The 'paidById' will almost always be the 'currentUserId' unless the user specifies someone else by name (e.g., "paid by Sargun"). Find the matching user ID from the "All users" JSON.
- If any information is missing (e.g., amount or group), ask the user for clarification.
- Once you have all required pieces of information, call the 'addExpenseTool'.
- If the user's message is not an expense-adding command, simply respond with an empty string.

Context:
- All users: {{{usersJson}}}
- User's groups: {{{groupsJson}}}

User's message:
"{{message}}"
`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    try {
        const llmResponse = await prompt({
          ...input,
          usersJson: JSON.stringify(input.users),
          groupsJson: JSON.stringify(input.groups),
        });
        
        // Check for tool call requests from the model
        const toolCall = llmResponse.toolRequest;
        if (toolCall) {
            return {
                toolCall: {
                    name: toolCall.name,
                    input: toolCall.input
                },
                response: undefined
            };
        } else {
            // Otherwise, it's a standard text response
            return { response: llmResponse.text };
        }
    } catch (error) {
        console.error("AI assistant call failed:", error);
        // Check if it's a rate limit error to provide a more specific message.
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('503'))) {
             return { response: "I'm sorry, I'm a bit busy right now due to too many requests. Please try again in a little while." };
        }
        return { response: "I'm sorry, but I encountered an unexpected error. Please try again." };
    }
  }
);
