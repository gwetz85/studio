"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Payment } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Bell, CheckCircle2, AlertCircle, Sparkles, Copy, Loader2, Calendar as CalendarIcon, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { generatePaymentReminder } from "@/ai/flows/generate-payment-reminder"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function PaymentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [activePayment, setActivePayment] = React.useState<Payment | null>(null);
  const [reminderMessage, setReminderMessage] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const payments = useLiveQuery(() => db.payments.orderBy('billingPeriod').reverse().toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const packages = useLiveQuery(() => db.packages.toArray());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerId = Number(formData.get("customerId"));
    const customer = customers?.find(c => c.id === customerId);
    const pkg = packages?.find(p => p.id === customer?.packageId);
    
    if (!pkg) {
      toast({ variant: "destructive", title: "Gagal membuat tagihan", description: "Pelanggan belum memiliki paket yang ditentukan." });
      return;
    }

    const data: Payment = {
      customerId,
      amount: pkg.price,
      billingPeriod: formData.get("billingPeriod") as string,
      status: formData.get("status") as 'paid' | 'pending' | 'overdue',
      paymentDate: formData.get("status") === 'paid' ? Date.now() : undefined,
    };

    try {
      await db.payments.add(data);
      toast({ title: "Tagihan diterbitkan", description: "Catatan pembayaran baru telah ditambahkan." });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan" });
    }
  };

  const updateStatus = async (id: number, status: 'paid' | 'pending' | 'overdue') => {
    await db.payments.update(id, { 
      status, 
      paymentDate: status === 'paid' ? Date.now() : undefined 
    });
    const label = status === 'paid' ? 'Lunas' : status === 'pending' ? 'Menunggu' : 'Terlambat';
    toast({ title: "Status diperbarui", description: `Tagihan ditandai sebagai ${label}.` });
  };

  const handleGenerateReminder = async (payment: Payment) => {
    const customer = customers?.find(c => c.id === payment.customerId);
    if (!customer) return;

    setActivePayment(payment);
    setReminderDialogOpen(true);
    setIsGenerating(true);
    setReminderMessage("");

    try {
      const result = await generatePaymentReminder({
        customerName: customer.name,
        outstandingAmount: payment.amount,
      });
      setReminderMessage(result.message);
    } catch (error) {
      toast({ variant: "destructive", title: "AI sedang sibuk", description: "Pastikan Anda terhubung ke internet untuk fitur ini." });
      setReminderMessage("Gagal menyusun pesan secara otomatis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderMessage);
    toast({ title: "Pesan disalin" });
  };

  const getCustomerName = (id: number) => customers?.find(c => c.id === id)?.name || "N/A";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tagihan & Pembayaran</h1>
          <p className="text-slate-500">Monitor arus kas dan kirim pengingat untuk tagihan tertunggak.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Buat Tagihan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" /> Terbitkan Invoice
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Pilih Pelanggan</Label>
                <Select name="customerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Siapa yang ditagih?" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id!.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingPeriod">Periode Tagihan</Label>
                  <Input id="billingPeriod" name="billingPeriod" placeholder="2024-01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Awal</Label>
                  <Select name="status" defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="overdue">Terlambat</SelectItem>
                      <SelectItem value="paid">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Buat Invoice Sekarang</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 px-6">Pelanggan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah Tagihan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right px-6">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6 font-semibold text-slate-900">
                      {getCustomerName(payment.customerId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CalendarIcon className="h-3 w-3" /> {payment.billingPeriod}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-700">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          payment.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }
                      >
                        {payment.status === 'paid' ? 'LUNAS' : payment.status === 'overdue' ? 'TERLAMBAT' : 'MENUNGGU'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1.5">
                        {payment.status !== 'paid' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50" 
                              onClick={() => updateStatus(payment.id!, 'paid')}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Lunas
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10" 
                              title="Kirim Pengingat AI"
                              onClick={() => handleGenerateReminder(payment)}
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {payment.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50" 
                            title="Tandai Terlambat"
                            onClick={() => updateStatus(payment.id!, 'overdue')}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.status === 'paid' && (
                          <div className="text-xs text-slate-400 italic flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Selesai
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!payments?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 opacity-20" />
                        <p>Belum ada riwayat tagihan yang tercatat.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Asisten Pengingat AI
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-60" />
                <p className="text-sm text-slate-500 text-center max-w-[200px]">Sedang menyusun pesan yang ramah dan profesional...</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-slate-50 p-5 border border-slate-200 text-sm leading-relaxed text-slate-700 shadow-inner min-h-[100px]">
                  {reminderMessage || "Ups, terjadi masalah saat memproses permintaan AI."}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="shadow-sm" onClick={copyToClipboard} disabled={!reminderMessage}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Salin Teks
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setReminderDialogOpen(false)}>Tutup</Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-sm" onClick={() => handleGenerateReminder(activePayment!)} disabled={isGenerating}>
              Buat Ulang Pesan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
