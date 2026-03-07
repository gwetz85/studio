'use server';
/**
 * @fileOverview Alur Genkit untuk menghasilkan pesan pengingat pembayaran yang dipersonalisasi.
 *
 * - generatePaymentReminder - Fungsi yang menghasilkan pesan pengingat pembayaran.
 * - GeneratePaymentReminderInput - Tipe input untuk fungsi generatePaymentReminder.
 * - GeneratePaymentReminderOutput - Tipe keluaran untuk fungsi generatePaymentReminder.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePaymentReminderInputSchema = z.object({
  customerName: z.string().describe('Nama pelanggan.'),
  outstandingAmount: z.number().describe('Jumlah tunggakan yang harus dibayar.'),
});
export type GeneratePaymentReminderInput = z.infer<
  typeof GeneratePaymentReminderInputSchema
>;

const GeneratePaymentReminderOutputSchema = z.object({
  message: z.string().describe('Pesan pengingat pembayaran yang dipersonalisasi.'),
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
  prompt: `Anda adalah asisten yang membantu untuk departemen penagihan. Tugas Anda adalah menghasilkan pesan pengingat pembayaran yang sopan namun tegas untuk pelanggan yang tagihan internetnya sudah jatuh tempo. Pesan harus menyertakan nama pelanggan dan jumlah tunggakan. Pesan harus ringkas dan profesional dalam Bahasa Indonesia. Jangan sertakan salam pembuka atau penutup, cukup isi pesannya saja.

Nama Pelanggan: {{{customerName}}}
Jumlah Tunggakan: {{{outstandingAmount}}}

Harap hasilkan pesan pengingat dalam format JSON dengan satu bidang 'message'.

Contoh Keluaran:
{
  "message": "Halo [Nama Pelanggan], ini adalah pengingat ramah bahwa tagihan internet Anda sebesar [Jumlah] telah melewati jatuh tempo. Mohon segera melakukan pembayaran. Terima kasih."
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
