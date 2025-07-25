
'use server';

/**
 * @fileOverview A Genkit flow to send a real invitation email to a new user using Resend.
 *
 * @exports sendInvitationEmail - An async function that takes user and group details to send an invitation.
 * @exports SendInvitationEmailInput - The input type for the sendInvitationEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendInvitationEmailInputSchema = z.object({
  email: z.string().email().describe('The email address of the new user to invite.'),
  groupName: z.string().describe('The name of the group the user is invited to.'),
  inviterName: z.string().describe('The name of the user who is sending the invitation.'),
});
export type SendInvitationEmailInput = z.infer<typeof SendInvitationEmailInputSchema>;

export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<void> {
  await sendInvitationEmailFlow(input);
}

const sendInvitationEmailFlow = ai.defineFlow(
  {
    name: 'sendInvitationEmailFlow',
    inputSchema: SendInvitationEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    // A simple, styled HTML email template with a join button.
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6a33d2;">You're Invited!</h2>
        <p>Hey!</p>
        <p><strong>${input.inviterName}</strong> has invited you to join the group "<strong>${input.groupName}</strong>" on SplitSync.</p>
        <p>Click the button below to accept your invitation and start sharing expenses!</p>
        <a href="http://localhost:9002/login" style="display: inline-block; margin: 20px 0; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #6a33d2; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Join the Group
        </a>
        <p style="font-size: 12px; color: #777;"><em>(Note: This is a prototype application. If the button doesn't work, please navigate to the app manually.)</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating email invitation. ---');
      console.log(`To: ${input.email}`);
      console.log(`From: SplitSync <onboarding@resend.dev>`);
      console.log(`Subject: You're invited to join "${input.groupName}" on SplitSync!`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`); // Stripped HTML for console readability
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync <onboarding@resend.dev>', // Resend requires this for the free tier
        to: input.email,
        subject: `You're invited to join "${input.groupName}" on SplitSync!`,
        html: emailHtml
      });
      console.log(`Successfully sent invitation email to ${input.email}`);
    } catch (error) {
      console.error("Error sending email via Resend:", error);
      // Optional: Add more robust error handling here
      throw new Error('Failed to send email.');
    }
  }
);
