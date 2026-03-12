
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, User, Phone, MapPin, Eye, Receipt, Calendar, Cpu, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = React.useState<any | null>(null);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const isAfterCutoff = currentDay > 8;

  const customersQuery = useMemoFirebase(() => {
    return query(collection(db, "customers"), where("status", "in", ["active", "passive"]));
  }, [db]);
  const { data: customersRaw } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => collection(db, "servicePackages"), [db]);
  const { data: packages } = useCollection(packagesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    return query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod));
  }, [db, currentPeriod]);
  const { data: currentPeriodInvoices } = useCollection(invoicesQuery);

  const viewInvoicesQuery = useMemoFirebase(() => {
    if (!viewingCustomer?.id) return null;
    return query(
      collection(db, "invoices"), 
      where("customerId", "==", viewingCustomer.id),
      where("status", "==", "paid")
    );
  }, [db, viewingCustomer]);
  const { data: customerPayments } = useCollection(viewInvoicesQuery);

  const filteredCustomers = React.useMemo(() => {
    if (!customersRaw) return [];
    if (!search) return customersRaw;
    const s = search.toLowerCase();
    return customersRaw.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s) ||
      c.modemSnMac?.toLowerCase().includes(s)
    );
  }, [customersRaw, search]);

  const isIsolated = (customer: any) => {
    if (customer.status !== 'active') return false;
    if (!isAfterCutoff) return false;
    const invoice = currentPeriodInvoices?.find(i => i.customerId === customer.id);
    return !invoice || invoice.status !== 'paid';
  };

  const handleOpenAddDialog = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleOpenPreview = (customer: any) => {
    setViewingCustomer(customer);
    setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;
    
    let deactivationDate = editingCustomer?.deactivationDate || null;
    if (newStatus === 'inactive' && editingCustomer?.status !== 'inactive') {
      deactivationDate = Date.now();
    } else if (newStatus !== 'inactive') {
      deactivationDate = null;
    }

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      modemSnMac: formData.get("modemSnMac") as string,
      packageId: formData.get("packageId") as string,
      status: newStatus,
      updatedAt: Date.now(),
      deactivationDate: deactivationDate
    };

    try {
      if (editingCustomer?.id) {
        await updateDoc(doc(db, "customers", editingCustomer.id), data);
        toast({ title: "Profil diperbarui" });
      } else {
        await addDoc(collection(db, "customers"), {
          ...data,
          createdAt: Date.now()
        });
        toast({ title: "Pelanggan baru terdaftar" });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan data" });
    }
  };

  const deleteCustomer = async (id: string) => {
    if (confirm("Hapus pelanggan ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "customers", id));
        toast({ title: "Pelanggan dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  const getPackageName = (id: string) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Pelanggan</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Kelola data pelanggan online real-time.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800 border-b">
            <DialogTitle className="text-xl flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5 text-primary" />
              {editingCustomer ? "Edit Profil Pelanggan" : "Registrasi Pelanggan Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <ScrollArea className="max-h-[60vh] md:max-h-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" name="name" defaultValue={editingCustomer?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="modemSnMac">SN / MAC Modem</Label>
                  <Input id="modemSnMac" name="modemSnMac" defaultValue={editingCustomer?.modemSnMac} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Input id="address" name="address" defaultValue={editingCustomer?.address} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageId">Pilih Paket</Label>
                  <Select name="packageId" defaultValue={editingCustomer?.packageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages?.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id!}>
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Layanan</Label>
                  <Select name="status" defaultValue={editingCustomer?.status || "active"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="passive">Pasif</SelectItem>
                      <SelectItem value="inactive">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="h-5 w-5" /> Detail Pelanggan
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-8">
            {viewingCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi Pribadi</h3>
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{viewingCustomer.name}</p>
                        <p className="text-xs text-slate-500">{viewingCustomer.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</h3>
                    <div className="flex flex-wrap gap-2">
                       <Badge className={isIsolated(viewingCustomer) ? "bg-rose-600" : "bg-emerald-600"}>
                        {isIsolated(viewingCustomer) ? "TERISOLIR" : viewingCustomer.status.toUpperCase()}
                       </Badge>
                       <Badge variant="outline">{getPackageName(viewingCustomer.packageId)}</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Riwayat Pembayaran (Paid)</h3>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableBody>
                        {customerPayments?.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs font-medium">{p.billingPeriod}</TableCell>
                            <TableCell className="text-xs text-right font-semibold text-emerald-600">
                              Rp {p.amount.toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari pelanggan..." 
          className="border-none shadow-none focus-visible:ring-0" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900/40">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="py-4 px-6">Identitas</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="py-3 px-6">
                    <div className="font-semibold text-slate-900 dark:text-white">{customer.name}</div>
                    <div className="text-[10px] text-slate-500">{customer.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {getPackageName(customer.packageId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={isIsolated(customer) ? "bg-rose-600 animate-pulse" : "bg-emerald-600"}>
                      {isIsolated(customer) ? "ISOLIR" : customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenPreview(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => deleteCustomer(customer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
