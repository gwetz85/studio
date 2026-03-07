"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Payment, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Bell, CheckCircle2, AlertCircle, Sparkles, Copy, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { generatePaymentReminder } from "@/ai/flows/generate-payment-reminder"

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
      toast({ variant: "destructive", title: "Pelanggan tidak memiliki paket yang ditetapkan" });
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
      toast({ title: "Invoice tercatat" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan pembayaran" });
    }
  };

  const updateStatus = async (id: number, status: 'paid' | 'pending' | 'overdue') => {
    await db.payments.update(id, { 
      status, 
      paymentDate: status === 'paid' ? Date.now() : undefined 
    });
    toast({ title: `Pembayaran ditandai sebagai ${status === 'paid' ? 'Lunas' : status === 'pending' ? 'Menunggu' : 'Terlambat'}` });
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
      toast({ variant: "destructive", title: "Generasi AI gagal. Periksa koneksi Anda." });
      setReminderMessage("Koneksi diperlukan untuk fitur AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderMessage);
    toast({ title: "Pengingat disalin ke papan klip" });
  };

  const getCustomerName = (id: number) => customers?.find(c => c.id === id)?.name || "Tidak Diketahui";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Pembayaran & Penagihan</h1>
          <p className="text-muted-foreground">Pantau tunggakan dan buat pengingat berbasis AI.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Buat Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entri Penagihan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Pelanggan</Label>
                <Select name="customerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pelanggan" />
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
                  <Label htmlFor="billingPeriod">Periode (TTTT-BB)</Label>
                  <Input id="billingPeriod" name="billingPeriod" placeholder="2023-10" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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
              <DialogFooter>
                <Button type="submit" className="w-full bg-accent text-accent-foreground">Buat Invoice</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getCustomerName(payment.customerId)}</TableCell>
                  <TableCell>{payment.billingPeriod}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={payment.status === 'paid' ? 'default' : payment.status === 'overdue' ? 'destructive' : 'secondary'}
                      className={payment.status === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {payment.status === 'paid' ? 'LUNAS' : payment.status === 'overdue' ? 'TERLAMBAT' : 'MENUNGGU'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status !== 'paid' && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" onClick={() => updateStatus(payment.id!, 'paid')}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Tandai Lunas
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => handleGenerateReminder(payment)}>
                            <Bell className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {payment.status === 'pending' && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus(payment.id!, 'overdue')}>
                            <AlertCircle className="h-4 w-4" />
                         </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!payments?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Belum ada catatan pembayaran.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Pengingat Pembayaran AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">AI sedang menyusun pengingat sopan berdasarkan detail pelanggan...</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-secondary/30 p-4 border border-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {reminderMessage || "Gagal membuat pengingat."}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!reminderMessage}>
                    <Copy className="mr-2 h-4 w-4" /> Salin Pesan
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReminderDialogOpen(false)}>Tutup</Button>
            <Button className="bg-accent text-accent-foreground" onClick={() => handleGenerateReminder(activePayment!)}>
              Buat Ulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
