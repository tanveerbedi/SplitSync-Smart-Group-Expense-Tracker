import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-expense-category.ts';
import '@/ai/flows/send-invitation-email.ts';
import '@/ai/flows/send-support-email.ts';
import '@/ai/flows/send-password-reset-email.ts';
import '@/ai/flows/send-notification-email.ts';
import '@/ai/flows/send-verification-email.ts';
import '@/ai/flows/scan-receipt.ts';
import '@/ai/flows/summarize-expenses.ts';
import '@/ai/flows/suggest-merchant.ts';
import '@/ai/flows/suggest-badge.ts';
import '@/ai/flows/suggest-settlement.ts';
import '@/ai/flows/send-badge-email.ts';
import '@/ai/flows/assistant.ts';
// import '@/ai/flows/chat-tools.ts'; // This file is now empty and tools are moved to assistant.ts
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/chat-with-assistant.ts';
