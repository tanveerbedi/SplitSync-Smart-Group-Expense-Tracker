
'use server';

/**
 * @fileOverview A Genkit flow to send an account verification email using Resend.
 *
 * @exports sendVerificationEmail - An async function that takes user details to send a verification email.
 * @exports SendVerificationEmailInput - The input type for the sendVerificationEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendVerificationEmailInputSchema = z.object({
  email: z.string().email().describe('The email address of the user to verify.'),
  name: z.string().describe('The name of the user.'),
});
export type SendVerificationEmailInput = z.infer<typeof SendVerificationEmailInputSchema>;

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  await sendVerificationEmailFlow(input);
}

const sendVerificationEmailFlow = ai.defineFlow(
  {
    name: 'sendVerificationEmailFlow',
    inputSchema: SendVerificationEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    // A simple, styled HTML email template with a verification button.
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #6a33d2;">Welcome to SplitSync!</h2>
        <p>Hello ${input.name},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below.</p>
        <a href="http://localhost:9002/login" style="display: inline-block; margin: 20px 0; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #6a33d2; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Verify Email Address
        </a>
        <p style="font-size: 12px; color: #777;"><em>If you did not create an account, you can safely ignore this email.</em></p>
      </div>
    `;

    if (!resendApiKey) {
      console.log('--- RESEND_API_KEY not found. Simulating verification email. ---');
      console.log(`To: ${input.email}`);
      console.log(`From: SplitSync Accounts <onboarding@resend.dev>`);
      console.log(`Subject: Please verify your email for SplitSync`);
      console.log(`Body: ${emailHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      console.log('-----------------------------------------------------------');
      return;
    }
    
    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: 'SplitSync Accounts <onboarding@resend.dev>',
        to: input.email,
        subject: `Please verify your email for SplitSync`,
        html: emailHtml
      });
      console.log(`Successfully sent verification email to ${input.email}`);
    } catch (error) {
      console.error("Error sending verification email via Resend:", error);
      throw new Error('Failed to send verification email.');
    }
  }
);
