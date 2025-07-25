
'use server';

/**
 * @fileOverview A Genkit flow to send a password reset email using Resend.
 *
 * @exports sendPasswordResetEmail - An async function that takes an email address and sends a reset link.
 * @exports SendPasswordResetEmailInput - The input type for the sendPasswordResetEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendPasswordResetEmailInputSchema = z.object({
  email: z.string().email().describe('The email address of the user requesting a password reset.'),
});
export type SendPasswordResetEmailInput = z.infer<typeof SendPasswordResetEmailInputSchema>;

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  await sendPasswordResetEmailFlow(input);
}

const sendPasswordResetEmailFlow = ai.defineFlow(
  {
    name: 'sendPasswordResetEmailFlow',
    inputSchema: SendPasswordResetEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    // A simple, styled HTML email template with a reset button.
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6a33d2;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your SplitSync account. If you did not make this request, you can ignore this email.</p>
        <p>Click the button below to reset your password:</p>
        <a href="http://localhost:9002/login" style="display: inline-block; margin: 20px 0; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #6a33d2; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
        <p style="font-size: 12px; color: #777;"><em>(Note: In a real app, this link would be unique and expire after a short time.)</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating password reset email. ---');
      console.log(`To: ${input.email}`);
      console.log(`From: SplitSync Security <onboarding@resend.dev>`);
      console.log(`Subject: Your SplitSync Password Reset Request`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync Security <onboarding@resend.dev>',
        to: input.email,
        subject: `Your SplitSync Password Reset Request`,
        html: emailHtml
      });
      console.log(`Successfully sent password reset email to ${input.email}`);
    } catch (error) {
      console.error("Error sending email via Resend:", error);
      throw new Error('Failed to send email.');
    }
  }
);
