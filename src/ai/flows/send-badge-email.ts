
'use server';

/**
 * @fileOverview A Genkit flow to send an email notification when a user earns a new badge.
 *
 * @exports sendBadgeEmail - An async function that takes user and badge details to send a notification.
 * @exports SendBadgeEmailInput - The input type for the sendBadgeEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendBadgeEmailInputSchema = z.object({
  userName: z.string().describe("The name of the user who earned the badge."),
  badgeName: z.string().describe("The name of the badge earned."),
  badgeDescription: z.string().describe("The description of what the badge is for."),
});
export type SendBadgeEmailInput = z.infer<typeof SendBadgeEmailInputSchema>;

export async function sendBadgeEmail(input: SendBadgeEmailInput): Promise<void> {
  await sendBadgeEmailFlow(input);
}

const sendBadgeEmailFlow = ai.defineFlow(
  {
    name: 'sendBadgeEmailFlow',
    inputSchema: SendBadgeEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = 'tanveer904.be22@chitkara.edu.in';

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #6a33d2; text-align: center;">New Achievement Unlocked!</h2>
        <p style="text-align: center;">Congratulations, <strong>${input.userName}</strong>!</p>
        <div style="background-color: #f9f9f9; border: 2px dashed #6a33d2; padding: 25px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <p style="font-size: 16px; margin: 0;">You've earned the</p>
            <h3 style="font-size: 24px; color: #6a33d2; margin: 10px 0;">"${input.badgeName}"</h3>
            <p style="font-size: 14px; color: #555; margin: 0;"><em>${input.badgeDescription}</em></p>
        </div>
        <p>Keep up the great work! You can view all your badges on your profile page.</p>
        <a href="http://localhost:9002/profile" style="display: block; margin: 20px auto; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #6a33d2; border-radius: 8px; text-decoration: none; font-weight: bold; text-align: center; width: fit-content;">
          View My Badges
        </a>
        <p style="font-size: 12px; color: #777; text-align: center;"><em>This is an automated notification from the SplitSync application.</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating new badge email. ---');
      console.log(`To: ${recipientEmail}`);
      console.log(`From: SplitSync Achievements <onboarding@resend.dev>`);
      console.log(`Subject: ✨ Congratulations! You've earned a new badge!`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync Achievements <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `✨ Congratulations! You've earned a new badge!`,
        html: emailHtml
      });
      console.log(`Successfully sent new badge email to ${recipientEmail}`);
    } catch (error) {
      console.error("Error sending new badge email via Resend:", error);
      throw new Error('Failed to send new badge email.');
    }
  }
);
