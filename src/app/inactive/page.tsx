"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, UserX, RotateCcw, Phone, MapPin, Eye, User, Mail, Calendar, Cpu, Receipt } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function InactiveUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);

  const inactiveCustomers = useLiveQuery(() => {
    const query = db.customers.where('status').equals('inactive');
    if (!search) return query.toArray();
    const s = search.toLowerCase();
    return query.filter(c => 
      (c.name?.toLowerCase().includes(s) || false) || 
      (c.phone?.includes(s) || false) ||
      (c.email?.toLowerCase().includes(s) || false)
    ).toArray();
  }, [search]);

  const packages = useLiveQuery(() => db.packages.toArray());
  
  const customerPayments = useLiveQuery(async () => {
    if (!viewingCustomer?.id) return [];
    return db.payments
      .where('customerId')
      .equals(viewingCustomer.id)
      .filter(p => p.status === 'paid')
      .reverse()
      .toArray();
  }, [viewingCustomer]);

  const getPackageName = (id: number) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  const handleOpenPreview = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsPreviewOpen(true);
  };

  const handleRestore = async (customer: Customer) => {
    if (!customer.id) return;
    try {
      await db.customers.update(customer.id, { 
        status: 'active',
        deactivationDate: undefined 
      });
      toast({ 
        title: "Pelanggan Diaktifkan Kembali", 
        description: `${customer.name} kini kembali ke daftar Pelanggan Aktif.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mengaktifkan" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.transaction('rw', db.customers, db.payments, async () => {
        await db.customers.delete(id);
        await db.payments.where('customerId').equals(id).delete();
      });
      toast({ title: "Data Dihapus Permanen" });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus" });
    }
  };

  const handleResetAll = async () => {
    const inactiveOnes = await db.customers.where('status').equals('inactive').toArray();
    if (inactiveOnes.length === 0) return;

    try {
      await db.transaction('rw', db.customers, db.payments, async () => {
        for (const customer of inactiveOnes) {
          if (customer.id) {
            await db.customers.delete(customer.id);
            await db.payments.where('customerId').equals(customer.id).delete();
          }
        }
      });
      toast({ title: "Semua Data Nonaktif Direset" });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mereset data" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">User Nonaktif</h1>
          <p className="text-slate-500 dark:text-slate-400">Arsip pelanggan yang telah dinonaktifkan dari sistem.</p>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!inactiveCustomers?.length}>
              <Trash2 className="mr-2 h-4 w-4" /> Kosongkan Arsip
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Reset Semua Data Nonaktif?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-slate-400">
                Tindakan ini akan menghapus seluruh pelanggan di daftar ini secara permanen. Data riwayat tagihan juga akan ikut terhapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll} className="bg-rose-600 hover:bg-rose-700">
                Ya, Hapus Semua
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari berdasarkan nama, email, atau telepon..." 
          className="border-none shadow-none focus-visible:ring-0 text-slate-600 dark:text-slate-300 bg-transparent" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <DialogHeader className="p-6 bg-rose-600 text-white">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detail Data Pelanggan Nonaktif
            </DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <ScrollArea className="max-h-[70vh]">
              {viewingCustomer && (
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Informasi Profil</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-rose-600 mt-1" />
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{viewingCustomer.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{viewingCustomer.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-rose-600 mt-1" />
                            <p className="text-sm text-slate-600 dark:text-slate-300">{viewingCustomer.phone}</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-rose-600 mt-1" />
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{viewingCustomer.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status & Perangkat</h3>
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400">NONAKTIF</Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-800">
                              {getPackageName(viewingCustomer.packageId)}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Terdaftar: {new Date(viewingCustomer.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            {viewingCustomer.deactivationDate && (
                              <div className="flex items-center gap-2 text-xs text-rose-600 font-bold">
                                <UserX className="h-3.5 w-3.5" />
                                <span>Dinonaktifkan: {new Date(viewingCustomer.deactivationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                              <Cpu className="h-3.5 w-3.5" />
                              <span>Modem: {viewingCustomer.modemSnMac || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-slate-800" />

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Receipt className="h-4 w-4" /> Riwayat Pembayaran Lunas
                    </h3>
                    
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-900/30">
                      <Table>
                        <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold dark:text-slate-400">Periode</TableHead>
                            <TableHead className="text-[10px] font-bold dark:text-slate-400">Tanggal Bayar</TableHead>
                            <TableHead className="text-[10px] font-bold text-right dark:text-slate-400">Jumlah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerPayments && customerPayments.length > 0 ? (
                            customerPayments.map((p) => (
                              <TableRow key={p.id} className="dark:border-slate-800">
                                <TableCell className="text-xs font-semibold dark:text-white">{p.billingPeriod}</TableCell>
                                <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                  {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('id-ID') : '-'}
                                </TableCell>
                                <TableCell className="text-xs font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                                  Rp {p.amount.toLocaleString('id-ID')}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-6 text-slate-400 text-xs italic">
                                Tidak ada riwayat pembayaran lunas.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="w-full">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900/40 backdrop-blur-md">
        <ScrollArea className="w-full">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="py-4 px-6 dark:text-slate-400">Identitas Pelanggan</TableHead>
                  <TableHead className="dark:text-slate-400">Paket Terakhir</TableHead>
                  <TableHead className="dark:text-slate-400">Kontak & Perangkat</TableHead>
                  <TableHead className="text-right px-6 dark:text-slate-400">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                    <TableCell className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">{customer.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                        {getPackageName(customer.packageId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {customer.phone}</div>
                        <div className="flex items-center gap-1.5 text-primary font-mono"><Cpu className="h-3 w-3" /> {customer.modemSnMac || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary" 
                          title="Lihat Detail Lengkap"
                          onClick={() => handleOpenPreview(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] border-primary/40 text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                          onClick={() => handleRestore(customer)}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" /> Aktifkan
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                          onClick={() => customer.id && handleDelete(customer.id)}
                          title="Hapus Permanen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!inactiveCustomers?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-8 w-8 opacity-20" />
                        <p className="text-xs">Daftar arsip pelanggan nonaktif kosong.</p>
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
    </div>
  )
}
