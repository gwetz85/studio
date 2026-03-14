"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, User, Eye, Phone, MapPin, Cpu, Calendar, CreditCard, Clock, Wrench, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function CustomersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { role, username } = useAuth();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = React.useState<any | null>(null);
  const [notingCustomer, setNotingCustomer] = React.useState<any | null>(null);

  const [currentPeriod, setCurrentPeriod] = React.useState("");
  const [isAfterCutoff, setIsAfterCutoff] = React.useState(false);

  React.useEffect(() => {
    const now = new Date();
    setCurrentPeriod(now.toISOString().slice(0, 7));
    setIsAfterCutoff(now.getDate() > 8);
  }, []);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "customers"), where("status", "in", ["active", "passive"]));
  }, [db, user]);
  const { data: customersRaw } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user || !currentPeriod) return null;
    return query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod));
  }, [db, currentPeriod, user]);
  const { data: currentPeriodInvoices } = useCollection(invoicesQuery);

  const viewInvoicesQuery = useMemoFirebase(() => {
    if (!viewingCustomer?.id || !user) return null;
    return query(
      collection(db, "invoices"), 
      where("customerId", "==", viewingCustomer.id)
    );
  }, [db, viewingCustomer, user]);
  const { data: customerInvoices } = useCollection(viewInvoicesQuery);

  const filteredCustomers = React.useMemo(() => {
    if (!customersRaw) return [];
    if (!search) return customersRaw;
    const s = search.toLowerCase();
    return customersRaw.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.email?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.modemSnMac?.toLowerCase().includes(s)
    );
  }, [customersRaw, search]);

  const isIsolated = (customer: any) => {
    if (!customer || customer.status !== 'active') return false;
    if (!isAfterCutoff) return false;
    const invoice = currentPeriodInvoices?.find(i => i.customerId === customer.id);
    return !invoice || invoice.status !== 'paid';
  };

  const handleOpenAddDialog = () => {
    if (role !== 'admin' && role !== 'staff') return;
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: any) => {
    if (role !== 'admin' && role !== 'staff' && role !== 'teknisi') return;
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleOpenPreview = (customer: any) => {
    setViewingCustomer(customer);
    setIsPreviewOpen(true);
  };

  const handleOpenNoteDialog = (customer: any) => {
    if (role !== 'admin' && role !== 'teknisi') return;
    setNotingCustomer(customer);
    setIsNoteDialogOpen(true);
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

    const data: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      modemSnMac: formData.get("modemSnMac") as string,
      packageId: formData.get("packageId") as string,
      status: newStatus,
      issueNotes: formData.get("issueNotes") as string || "",
      updatedAt: Date.now(),
      deactivationDate: deactivationDate
    };

    try {
      if (editingCustomer?.id) {
        await updateDoc(doc(db, "customers", editingCustomer.id), data);
        toast({ title: "Data berhasil diperbarui" });
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

  const handleQuickSaveNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin' && role !== 'teknisi') return;
    const formData = new FormData(e.currentTarget);
    const newNoteText = formData.get("newNote") as string;
    
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm", { locale: localeId });
    const formattedNote = `[${timestamp}] ${username}: ${newNoteText}`;
    
    const currentNotes = notingCustomer?.issueNotes || "";
    const updatedNotes = currentNotes 
      ? `${formattedNote}\n---\n${currentNotes}` 
      : formattedNote;

    try {
      if (notingCustomer?.id) {
        await updateDoc(doc(db, "customers", notingCustomer.id), {
          issueNotes: updatedNotes,
          updatedAt: Date.now()
        });
        toast({ title: "Gangguan berhasil dicatat" });
        setIsNoteDialogOpen(false);
        setNotingCustomer(null);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mencatat gangguan" });
    }
  };

  const deleteCustomer = async (id: string) => {
    if (role !== 'admin') return;
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

  const formatDate = (ts: number | undefined) => {
    if (!ts) return "N/A";
    return format(new Date(ts), "dd MMMM yyyy", { locale: localeId });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Pelanggan</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Kelola data pelanggan online real-time.</p>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Button>
        )}
      </div>

      {/* Dialog Registrasi/Edit Profil & Notes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800 border-b">
            <DialogTitle className="text-xl flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5 text-primary" />
              {editingCustomer ? "Edit Profil & Catatan Pelanggan" : "Registrasi Pelanggan Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <ScrollArea className="max-h-[70vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" name="name" defaultValue={editingCustomer?.name} required disabled={role === 'teknisi'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} required disabled={role === 'teknisi'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required disabled={role === 'teknisi'} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="modemSnMac">SN / MAC Modem</Label>
                  <Input id="modemSnMac" name="modemSnMac" defaultValue={editingCustomer?.modemSnMac} disabled={role === 'teknisi'} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Input id="address" name="address" defaultValue={editingCustomer?.address} required disabled={role === 'teknisi'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageId">Pilih Paket</Label>
                  <Select name="packageId" defaultValue={editingCustomer?.packageId} disabled={role === 'teknisi'}>
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
                  <Select name="status" defaultValue={editingCustomer?.status || "active"} disabled={role === 'teknisi'}>
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
                
                {/* Bagian Catatan Gangguan di Menu Edit */}
                <div className="space-y-2 sm:col-span-2 border-t pt-4 mt-2">
                  <Label htmlFor="issueNotes" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-rose-500" />
                    Arsip Catatan Gangguan (Hanya Admin & Teknisi)
                  </Label>
                  <Textarea 
                    id="issueNotes" 
                    name="issueNotes" 
                    defaultValue={editingCustomer?.issueNotes}
                    placeholder="Riwayat gangguan teknis pelanggan..."
                    className="min-h-[150px] font-mono text-xs bg-slate-50 dark:bg-slate-900"
                    disabled={role === 'staff'}
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    *Catatan disusun secara kronologis untuk memudahkan tracking perbaikan.
                  </p>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Input Cepat Gangguan Baru */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-6 bg-rose-50 dark:bg-rose-900/20 border-b">
            <DialogTitle className="text-xl flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Catat Gangguan Baru: {notingCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSaveNote} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote">Detail Keluhan / Gangguan Hari Ini</Label>
              <Textarea 
                id="newNote" 
                name="newNote" 
                placeholder="Contoh: Lampu LOS Merah, kabel putus di tiang nomor 5..."
                className="min-h-[120px] resize-none"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700">Simpan Catatan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview Lengkap */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Detail Lengkap Pelanggan
              </div>
              <Badge variant="outline" className="border-white text-white">
                Reg: {formatDate(viewingCustomer?.createdAt)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6 md:p-8 space-y-8">
              {viewingCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3" /> Informasi Identitas
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Nama Lengkap</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{viewingCustomer.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Email</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{viewingCustomer.email || "No Email"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Telepon</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{viewingCustomer.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">SN / MAC Modem</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{viewingCustomer.modemSnMac || "N/A"}</p>
                          </div>
                        </div>
                        <div className="sm:col-span-2 flex items-start gap-2 border-t pt-4">
                          <MapPin className="h-4 w-4 text-rose-500 mt-1" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Alamat Pemasangan</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewingCustomer.address || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* CATATAN GANGGUAN SECTION */}
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Wrench className="h-3 w-3" /> Riwayat Gangguan Teknis (Kronologis)
                      </h3>
                      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 dark:bg-rose-900/10 dark:border-rose-900/30 min-h-[100px]">
                        {viewingCustomer.issueNotes ? (
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap divide-y divide-rose-100">
                            {viewingCustomer.issueNotes.split('---').map((note, idx) => (
                              <div key={idx} className="py-2 first:pt-0 last:pb-0">
                                {note.trim()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Belum ada riwayat catatan gangguan teknis untuk pelanggan ini.</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> Rekapan Pembayaran
                      </h3>
                      <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="text-[10px] uppercase">Periode</TableHead>
                              <TableHead className="text-[10px] uppercase">Status</TableHead>
                              <TableHead className="text-[10px] uppercase text-right">Nominal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerInvoices?.sort((a,b) => b.billingPeriod.localeCompare(a.billingPeriod)).map((inv) => (
                              <TableRow key={inv.id}>
                                <TableCell className="text-xs font-medium flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {inv.billingPeriod}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cn(
                                    "text-[9px] px-1.5 py-0",
                                    inv.status === 'paid' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"
                                  )}>
                                    {inv.status.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono font-bold text-slate-700">
                                  Rp {(inv.amount || 0).toLocaleString('id-ID')}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!customerInvoices || customerInvoices.length === 0) && (
                              <TableRow><TableCell colSpan={3} className="text-center text-xs text-slate-400 py-12">Belum ada riwayat tagihan.</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-none shadow-none space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Berlangganan</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Layanan</span>
                          <Badge className={cn(
                            "px-4 py-1",
                            isIsolated(viewingCustomer) ? "bg-rose-600" : (viewingCustomer.status === 'active' ? "bg-emerald-600" : "bg-amber-500")
                          )}>
                            {isIsolated(viewingCustomer) ? "TERISOLIR" : (viewingCustomer.status?.toUpperCase() || "N/A")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Paket Aktif</span>
                          <span className="text-sm font-bold text-primary">{getPackageName(viewingCustomer.packageId)}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3 w-3" /> Terakhir Update
                          </div>
                          <p className="text-xs font-medium">{formatDate(viewingCustomer.updatedAt || viewingCustomer.createdAt)}</p>
                        </div>
                      </div>
                    </Card>

                    <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-2">
                       <h4 className="text-[10px] font-black text-primary uppercase">Catatan Sistem</h4>
                       <p className="text-[10px] text-slate-600 leading-relaxed italic">
                        Setiap gangguan yang dicatat teknisi akan tersimpan dalam arsip permanen pelanggan sebagai bahan evaluasi kualitas jaringan.
                       </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t">
            <Button onClick={() => setIsPreviewOpen(false)} className="w-full sm:w-auto">Tutup Detail</Button>
          </DialogFooter>
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
                    <div className="font-semibold text-slate-900 dark:text-white">{customer.name || "N/A"}</div>
                    <div className="text-[10px] text-slate-500">{customer.email || "No Email"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {getPackageName(customer.packageId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(isIsolated(customer) ? "bg-rose-600 animate-pulse" : (customer.status === 'active' ? "bg-emerald-600" : "bg-amber-500"))}>
                      {isIsolated(customer) ? "ISOLIR" : (customer.status || "N/A")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1">
                      {/* Tombol Catat Gangguan Baru (Admin & Teknisi) */}
                      {(role === 'admin' || role === 'teknisi') && (
                        <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Catat Gangguan Baru" onClick={() => handleOpenNoteDialog(customer)}>
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="icon" onClick={() => handleOpenPreview(customer)} title="Lihat Detail Lengkap">
                        <Eye className="h-4 w-4" />
                      </Button>

                      {(role === 'admin' || role === 'staff' || role === 'teknisi') && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)} title="Edit Profil / Riwayat Gangguan">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {role === 'admin' && (
                        <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => deleteCustomer(customer.id)} title="Hapus Permanen">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
