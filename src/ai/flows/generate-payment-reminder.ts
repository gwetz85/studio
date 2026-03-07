'use server';
/**
 * @fileOverview A Genkit flow for generating personalized payment reminder messages.
 *
 * - generatePaymentReminder - A function that generates a payment reminder message.
 * - GeneratePaymentReminderInput - The input type for the generatePaymentReminder function.
 * - GeneratePaymentReminderOutput - The return type for the generatePaymentReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePaymentReminderInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  outstandingAmount: z.number().describe('The outstanding amount due.'),
});
export type GeneratePaymentReminderInput = z.infer<
  typeof GeneratePaymentReminderInputSchema
>;

const GeneratePaymentReminderOutputSchema = z.object({
  message: z.string().describe('The personalized payment reminder message.'),
});
export type GeneratePaymentReminderOutput = z.infer<
  typeof GeneratePaymentReminderOutputSchema
>;

export async function generatePaymentReminder(
  input: GeneratePaymentReminderInput
): Promise<GeneratePaymentReminderOutput> {
  return generatePaymentReminderFlow(input);
}

const paymentReminderPrompt = ai.definePrompt({
  name: 'paymentReminderPrompt',
  input: {schema: GeneratePaymentReminderInputSchema},
  output: {schema: GeneratePaymentReminderOutputSchema},
  prompt: `You are a helpful assistant for a billing department. Your task is to generate a polite but firm payment reminder message for a customer whose internet bill is overdue. The message should include the customer's name and the outstanding amount. The message should be concise and professional. Do not include salutations or closings, just the body of the message.

Customer Name: {{{customerName}}}
Outstanding Amount: {{{outstandingAmount}}}

Please generate the reminder message in a JSON format with a single field 'message'.

Example Output:
{
  "message": "Dear [Customer Name], this is a friendly reminder that your internet bill of [Amount] is overdue. Please settle it as soon as possible. Thank you."
}`,
});

const generatePaymentReminderFlow = ai.defineFlow(
  {
    name: 'generatePaymentReminderFlow',
    inputSchema: GeneratePaymentReminderInputSchema,
    outputSchema: GeneratePaymentReminderOutputSchema,
  },
  async input => {
    const {output} = await paymentReminderPrompt(input);
    return output!;
  }
);
