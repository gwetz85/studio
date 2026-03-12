
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, CheckCircle2, AlertCircle, Sparkles, MessageCircle, Wallet, Printer, Undo2, Loader2, Copy } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { generatePaymentReminder } from "@/ai/flows/generate-payment-reminder"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function PaymentsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [activePayment, setActivePayment] = React.useState<any | null>(null);
  const [reminderMessage, setReminderMessage] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "invoices"), orderBy("billingPeriod", "desc"));
  }, [db, user]);
  const { data: payments } = useCollection(paymentsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customers");
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === customerId);
    const pkg = packages?.find(p => p.id === customer?.packageId);
    
    if (!pkg) {
      toast({ variant: "destructive", title: "Gagal membuat tagihan" });
      return;
    }

    const data = {
      customerId,
      amount: pkg.price,
      billingPeriod: formData.get("billingPeriod") as string,
      status: formData.get("status") as string,
      paymentDate: formData.get("status") === 'paid' ? Date.now() : null,
      updatedAt: Date.now()
    };

    try {
      await addDoc(collection(db, "invoices"), data);
      toast({ title: "Tagihan diterbitkan" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "invoices", id), { 
        status, 
        paymentDate: status === 'paid' ? Date.now() : null,
        updatedAt: Date.now()
      });
      toast({ title: "Status diperbarui" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal update status" });
    }
  };

  const handleGenerateReminder = async (payment: any) => {
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
      setReminderMessage("Gagal menyusun pesan secara otomatis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppDirect = (payment: any) => {
    const customer = customers?.find(c => c.id === payment.customerId);
    if (!customer) return;
    const message = `Halo ${customer.name}, tagihan internet Rp ${payment.amount.toLocaleString('id-ID')} periode ${payment.billingPeriod} belum lunas. Mohon segera dibayar. Terima kasih.`;
    window.open(`https://wa.me/${formatWhatsAppNumber(customer.phone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.name || "N/A";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tagihan & Pembayaran</h1>
          <p className="text-slate-500">Sinkronisasi Real-time dengan Cloud Database.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Buat Tagihan</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle>Terbitkan Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Pilih Pelanggan</Label>
              <Select name="customerId" required>
                <SelectTrigger><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="billingPeriod" placeholder="2024-01" required />
              <Select name="status" defaultValue="pending">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="overdue">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Buat Tagihan</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-6">Pelanggan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="px-6 font-semibold">{getCustomerName(payment.customerId)}</TableCell>
                  <TableCell>{payment.billingPeriod}</TableCell>
                  <TableCell>Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Badge className={payment.status === 'paid' ? 'bg-emerald-500' : payment.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1">
                      {payment.status !== 'paid' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => updateStatus(payment.id!, 'paid')}>Lunas</Button>
                          <Button variant="ghost" size="icon" onClick={() => handleWhatsAppDirect(payment)}><MessageCircle className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleGenerateReminder(payment)}><Sparkles className="h-4 w-4 text-primary" /></Button>
                        </>
                      )}
                      {payment.status === 'paid' && (
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(payment.id!, 'pending')}><Undo2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* AI Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle>Asisten Pengingat AI</DialogTitle></DialogHeader>
          <div className="py-4">
             {isGenerating ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : <p className="text-sm bg-slate-50 p-4 rounded-xl">{reminderMessage}</p>}
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => navigator.clipboard.writeText(reminderMessage)}>Copy</Button>
             <Button onClick={() => setReminderDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
