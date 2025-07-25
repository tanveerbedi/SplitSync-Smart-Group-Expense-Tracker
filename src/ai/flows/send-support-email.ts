
'use server';

/**
 * @fileOverview A Genkit flow to send a support request email using Resend.
 *
 * @exports sendSupportEmail - An async function that takes a subject and message to send a support email.
 * @exports SendSupportEmailInput - The input type for the sendSupportEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendSupportEmailInputSchema = z.object({
  fromEmail: z.string().email().describe('The email address of the user sending the request.'),
  fromName: z.string().describe('The name of the user sending the request.'),
  subject: z.string().describe('The subject of the support request.'),
  message: z.string().describe('The content of the support message.'),
});
export type SendSupportEmailInput = z.infer<typeof SendSupportEmailInputSchema>;

export async function sendSupportEmail(input: SendSupportEmailInput): Promise<void> {
  await sendSupportEmailFlow(input);
}

const sendSupportEmailFlow = ai.defineFlow(
  {
    name: 'sendSupportEmailFlow',
    inputSchema: SendSupportEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const supportEmailRecipient = 'tanveer904.be22@chitkara.edu.in';

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #6a33d2;">New Support Request</h2>
        <p>You have received a new support request from a user.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>From:</strong> ${input.fromName} (${input.fromEmail})</p>
        <p><strong>Subject:</strong> ${input.subject}</p>
        <h3 style="margin-top: 30px; color: #333;">Message:</h3>
        <div style="background-color: #f9f9f9; border-left: 4px solid #6a33d2; padding: 15px; white-space: pre-wrap;">
          <p>${input.message}</p>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 30px;"><em>This email was sent from the SplitSync application's support form.</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating support email. ---');
      console.log(`To: ${supportEmailRecipient}`);
      console.log(`From: SplitSync Support <onboarding@resend.dev>`);
      console.log(`Subject: New Support Request: ${input.subject}`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync Support <onboarding@resend.dev>',
        to: supportEmailRecipient,
        reply_to: input.fromEmail,
        subject: `[SplitSync Support] ${input.subject}`,
        html: emailHtml
      });
      console.log(`Successfully sent support email from ${input.fromEmail}`);
    } catch (error) {
      console.error("Error sending support email via Resend:", error);
      throw new Error('Failed to send support email.');
    }
  }
);
