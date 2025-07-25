
'use server';

/**
 * @fileOverview A Genkit flow to send a notification email.
 *
 * @exports sendNotificationEmail - An async function that takes a notification message and sends it via email.
 * @exports SendNotificationEmailInput - The input type for the sendNotificationEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendNotificationEmailInputSchema = z.object({
  message: z.string().describe('The notification message to be sent.'),
  recipientEmail: z.string().email().optional().describe('The email address of the recipient.'),
  subject: z.string().optional().describe('The subject of the email.'),
  replyTo: z.string().email().optional().describe('The email address to use for the reply-to header.'),
});
export type SendNotificationEmailInput = z.infer<typeof SendNotificationEmailInputSchema>;

export async function sendNotificationEmail(input: SendNotificationEmailInput): Promise<void> {
  await sendNotificationEmailFlow(input);
}

const sendNotificationEmailFlow = ai.defineFlow(
  {
    name: 'sendNotificationEmailFlow',
    inputSchema: SendNotificationEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultRecipientEmail = 'tanveer904.be22@chitkara.edu.in';
    const recipient = input.recipientEmail || defaultRecipientEmail;
    const subject = input.subject || 'New Notification from SplitSync';
    
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6a33d2;">${subject}</h2>
        <p>You have a new notification:</p>
        <div style="background-color: #f9f9f9; border-left: 4px solid #6a33d2; padding: 15px; margin: 20px 0;">
          ${input.message}
        </div>
        <p style="font-size: 12px; color: #777;"><em>This is an automated notification from the SplitSync application.</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating notification email. ---');
      console.log(`To: ${recipient}`);
      console.log(`From: SplitSync Notifications <onboarding@resend.dev>`);
      console.log(`Subject: ${subject}`);
      console.log(`Reply-To: ${input.replyTo || 'Not set'}`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync Notifications <onboarding@resend.dev>',
        to: recipient,
        subject: subject,
        html: emailHtml,
        reply_to: input.replyTo,
      });
      console.log(`Successfully sent notification email to ${recipient}`);
    } catch (error) {
      console.error("Error sending notification email via Resend:", error);
      throw new Error('Failed to send notification email.');
    }
  }
);
