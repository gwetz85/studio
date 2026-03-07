"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Payment } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Bell, CheckCircle2, AlertCircle, Sparkles, Copy, Loader2, Calendar as CalendarIcon, Wallet, Printer, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { generatePaymentReminder } from "@/ai/flows/generate-payment-reminder"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { format, isValid } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function PaymentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = React.useState(false);
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

  const handlePrintReceipt = (payment: Payment) => {
    setActivePayment(payment);
    setReceiptDialogOpen(true);
  };

  const printReceiptAction = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;
    
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderMessage);
    toast({ title: "Pesan disalin" });
  };

  const getCustomerName = (id: number) => customers?.find(c => c.id === id)?.name || "N/A";

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount).replace('Rp', '').trim();
  };

  const receiptData = React.useMemo(() => {
    if (!activePayment || !customers || !packages) return null;
    const customer = customers.find(c => c.id === activePayment.customerId);
    const pkg = packages.find(p => p.id === customer?.packageId);
    if (!customer || !pkg) return null;

    const paymentDate = activePayment.paymentDate ? new Date(activePayment.paymentDate) : new Date();
    const dateStr = isValid(paymentDate) ? format(paymentDate, "yyyy-MM-dd HH:mm:ss") : "-";

    const parts = activePayment.billingPeriod.split('-');
    let monthName = activePayment.billingPeriod;
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      if (!isNaN(year) && !isNaN(month)) {
        const billingDate = new Date(year, month - 1);
        if (isValid(billingDate)) {
          monthName = format(billingDate, "MMMM yyyy", { locale: localeId });
        }
      }
    }

    return {
      customer,
      pkg,
      dateStr,
      monthName,
      custNo: `CUST-${customer.id?.toString().padStart(3, '0')}`,
      invNo: `INV-${activePayment.billingPeriod.replace('-', '')}-${activePayment.id?.toString().padStart(3, '0')}`,
    };
  }, [activePayment, customers, packages]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tagihan & Pembayaran</h1>
          <p className="text-slate-500">Monitor arus kas dan cetak kwitansi resmi untuk pelanggan.</p>
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
                      Rp {payment.amount.toLocaleString('id-ID')}
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
                        {payment.status === 'paid' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs bg-slate-50 text-slate-600 hover:text-primary" 
                            onClick={() => handlePrintReceipt(payment)}
                          >
                            <Printer className="mr-1 h-3 w-3" /> Kwitansi
                          </Button>
                        )}
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

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-[800px] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center no-print">
            <h2 className="font-semibold flex items-center gap-2"><Printer className="h-4 w-4" /> Pratinjau Kwitansi</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setReceiptDialogOpen(false)}>Tutup</Button>
              <Button size="sm" onClick={printReceiptAction}><Printer className="mr-2 h-4 w-4" /> Cetak Kwitansi</Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-[80vh]">
            <div id="receipt-content" className="p-12 font-mono text-slate-800 bg-white">
              {receiptData && (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex flex-col items-end">
                    <h1 className="text-4xl font-bold tracking-widest border-b-2 border-slate-900 pb-1">KWITANSI</h1>
                    <p className="text-xs mt-1">PEMBAYARAN TAGIHAN INTERNET</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 pt-4 pb-4 border-t border-dotted border-slate-300">
                    <div className="space-y-1">
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">No.Pelanggan</span>
                        <span className="shrink-0">:</span>
                        <span>{receiptData.custNo}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">Nama</span>
                        <span className="shrink-0">:</span>
                        <span className="font-bold">{receiptData.customer.name}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">Alamat</span>
                        <span className="shrink-0">:</span>
                        <span className="text-sm">{receiptData.customer.address}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">Tanggal</span>
                        <span className="shrink-0">:</span>
                        <span>{receiptData.dateStr}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">No.Kwitansi</span>
                        <span className="shrink-0">:</span>
                        <span>{receiptData.invNo}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-24 shrink-0">Kasir</span>
                        <span className="shrink-0">:</span>
                        <span>Admin</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 border-y border-dotted border-slate-300 flex justify-between items-center">
                    <div className="flex-1">
                      {receiptData.custNo} - {receiptData.pkg.speed} {receiptData.pkg.name} - {receiptData.monthName}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">Rp</span>
                      <span className="w-24 text-right font-bold">{formatIDR(activePayment?.amount || 0)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <div className="w-72 space-y-1">
                      <div className="flex justify-between">
                        <span>Biaya Layanan</span>
                        <div className="flex gap-4">
                          <span>Rp</span>
                          <span className="w-24 text-right">{formatIDR(activePayment?.amount || 0)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Administrasi</span>
                        <div className="flex gap-4">
                          <span>Rp</span>
                          <span className="w-24 text-right">0</span>
                        </div>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-dotted border-slate-300">
                        <span>Diskon</span>
                        <div className="flex gap-4">
                          <span>Rp</span>
                          <span className="w-24 text-right">- 0</span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 text-lg font-bold">
                        <span>Biaya Total</span>
                        <div className="flex gap-4">
                          <span>Rp</span>
                          <span className="w-24 text-right">{formatIDR(activePayment?.amount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <ScrollBar />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #receipt-content { p: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  )
}
