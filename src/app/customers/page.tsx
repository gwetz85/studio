
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc, query, where, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, User, Eye, Phone, MapPin, Cpu, Calendar, CreditCard, Clock, Wrench, AlertCircle, UserCircle2, ShieldAlert, RefreshCw } from "lucide-react"
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

  // Pagination State
  const [limitCount, setLimitCount] = React.useState(50);

  React.useEffect(() => {
    const now = new Date();
    setCurrentPeriod(now.toISOString().slice(0, 7));
    setIsAfterCutoff(now.getDate() > 8);
  }, []);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "customers"), 
      where("status", "in", ["active", "passive"]),
      limit(limitCount)
    );
  }, [db, user, limitCount]);
  const { data: customersRaw, isLoading: customersLoading } = useCollection(customersQuery);

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

  // Efficient invoice lookup for isolation check
  const currentInvoiceMap = React.useMemo(() => {
    const map = new Map();
    currentPeriodInvoices?.forEach(inv => map.set(inv.customerId, inv));
    return map;
  }, [currentPeriodInvoices]);

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

  const isIsolated = React.useCallback((customer: any) => {
    if (!customer || customer.status !== 'active') return false;
    if (!isAfterCutoff) return false;
    const invoice = currentInvoiceMap.get(customer.id);
    return !invoice || invoice.status !== 'paid';
  }, [currentInvoiceMap, isAfterCutoff]);

  const handleOpenAddDialog = () => {
    if (role !== 'admin' && role !== 'staff') return;
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: any) => {
    if (role !== 'admin' && role !== 'staff') return;
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleOpenPreview = (customer: any) => {
    setViewingCustomer(customer);
    setIsPreviewOpen(true);
  };

  const handleOpenNoteDialog = (customer: any) => {
    if (role !== 'admin') return;
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
    if (role !== 'admin') return;
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
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Pelanggan</h1>
          <p className="text-[10px] md:text-base text-slate-500 dark:text-slate-400">Kelola data pelanggan online real-time.</p>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <Button type="button" className="w-full sm:w-auto shadow-sm h-9 text-xs" onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1 rounded-xl border">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari pelanggan..." 
          className="border-none shadow-none focus-visible:ring-0 text-xs h-8" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid View of Icons - Mobile Optimized */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
        {filteredCustomers?.map((customer) => {
          const isUserIsolated = isIsolated(customer);
          return (
            <div key={customer.id} className="group relative flex flex-col items-center gap-2">
              <button
                onClick={() => handleOpenPreview(customer)}
                className={cn(
                  "relative h-16 w-16 md:h-24 md:w-24 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md active:scale-95 md:group-hover:scale-110",
                  isUserIsolated 
                    ? "bg-rose-100 text-rose-600 ring-2 ring-rose-500/20" 
                    : (customer.status === 'active' 
                        ? "bg-primary/10 text-primary ring-2 ring-primary/10" 
                        : "bg-amber-100 text-amber-600 ring-2 ring-amber-500/20")
                )}
              >
                {isUserIsolated ? (
                  <ShieldAlert className="h-8 w-8 md:h-12 md:w-12 animate-pulse" />
                ) : (
                  <UserCircle2 className="h-8 w-8 md:h-12 md:w-12" />
                )}
                
                {/* Floating Status Indicator */}
                <div className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 md:h-6 md:w-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm",
                  isUserIsolated ? "bg-rose-500" : (customer.status === 'active' ? "bg-emerald-500" : "bg-amber-500")
                )}>
                  <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </button>
              
              <div className="text-center w-full px-1">
                <p className="text-[10px] md:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                  {customer.name || "N/A"}
                </p>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-medium truncate uppercase">
                  {getPackageName(customer.packageId)}
                </p>
              </div>

              {/* Quick Action Overlay (Hanya Admin & Staff) */}
              <div className="hidden md:flex absolute -top-2 -right-2 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {role === 'admin' && (
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-7 w-7 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNoteDialog(customer);
                      }}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </Button>
                 )}
                 {(role === 'admin' || role === 'staff') && (
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-7 w-7 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDialog(customer);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                 )}
              </div>
            </div>
          );
        })}

        {filteredCustomers?.length === 0 && !customersLoading && (
          <div className="col-span-full py-20 text-center opacity-40">
            <UserCircle2 className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xs font-bold">Tidak ada pelanggan</p>
          </div>
        )}

        {customersLoading && (
           Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl bg-slate-100" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-2 w-12 bg-slate-50 rounded" />
             </div>
           ))
        )}
      </div>

      {!search && (customersRaw?.length || 0) >= limitCount && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-bold"
            onClick={() => setLimitCount(prev => prev + 50)}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Muat Lebih Banyak (Menampilkan {customersRaw?.length})
          </Button>
        </div>
      )}

      {/* Dialog Registrasi/Edit Profil & Notes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[95vh]">
          <DialogHeader className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-b shrink-0">
            <DialogTitle className="text-base md:text-xl flex items-center gap-2 dark:text-white">
              <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              {editingCustomer ? "Edit Profil Pelanggan" : "Registrasi Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="text-xs">Nama Lengkap</Label>
                  <Input id="name" name="name" defaultValue={editingCustomer?.name} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="phone" className="text-xs">Telepon</Label>
                  <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1 md:space-y-2 sm:col-span-2">
                  <Label htmlFor="modemSnMac" className="text-xs">SN / MAC Modem</Label>
                  <Input id="modemSnMac" name="modemSnMac" defaultValue={editingCustomer?.modemSnMac} className="h-9 text-xs" />
                </div>
                <div className="space-y-1 md:space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs">Alamat Lengkap</Label>
                  <Input id="address" name="address" defaultValue={editingCustomer?.address} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="packageId" className="text-xs">Paket</Label>
                  <Select name="packageId" defaultValue={editingCustomer?.packageId}>
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="status" className="text-xs">Status Layanan</Label>
                  <Select name="status" defaultValue={editingCustomer?.status || "active"}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="passive">Pasif</SelectItem>
                      <SelectItem value="inactive">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1 md:space-y-2 sm:col-span-2 border-t pt-4 mt-2">
                  <Label htmlFor="issueNotes" className="flex items-center gap-2 text-xs">
                    <Wrench className="h-3 w-3 text-rose-500" />
                    Catatan Gangguan
                  </Label>
                  <Textarea 
                    id="issueNotes" 
                    name="issueNotes" 
                    defaultValue={editingCustomer?.issueNotes}
                    placeholder="Riwayat gangguan teknis..."
                    className="min-h-[100px] font-mono text-[10px] bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 md:p-6 pt-2 shrink-0 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-xs h-9">Batal</Button>
              <Button type="submit" className="text-xs h-9">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview Lengkap - Mobile Optimized */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 flex flex-col max-h-[95vh]">
          <DialogHeader className="p-4 bg-primary text-white shrink-0">
            <DialogTitle className="text-sm md:text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Profil Pelanggan
              </div>
              <Badge variant="outline" className="border-white text-white text-[8px] md:text-xs">
                Sejak: {formatDate(viewingCustomer?.createdAt)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-8 space-y-6">
              {viewingCustomer && (
                <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3" /> Informasi Identitas
                      </h3>
                      <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Nama Lengkap</p>
                            <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">{viewingCustomer.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Email</p>
                            <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white truncate">{viewingCustomer.email || "-"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <Phone className="h-3 w-3 text-primary mt-0.5" />
                            <div>
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Telepon</p>
                              <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">{viewingCustomer.phone || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Cpu className="h-3 w-3 text-primary mt-0.5" />
                            <div>
                              <p className="text-[8px] text-slate-500 uppercase font-bold">SN / MAC</p>
                              <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white truncate">{viewingCustomer.modemSnMac || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 border-t pt-3">
                          <MapPin className="h-3 w-3 text-rose-500 mt-1" />
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Alamat Pemasangan</p>
                            <p className="text-[10px] md:text-xs font-medium text-slate-700 dark:text-slate-300">{viewingCustomer.address || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Wrench className="h-3 w-3" /> Riwayat Gangguan
                      </h3>
                      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 dark:bg-rose-900/10 dark:border-rose-900/30 min-h-[80px]">
                        {viewingCustomer.issueNotes ? (
                          <div className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap divide-y divide-rose-100/50">
                            {viewingCustomer.issueNotes.split('---').map((note, idx) => (
                              <div key={idx} className="py-2 first:pt-0 last:pb-0">
                                {note.trim()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Belum ada catatan gangguan.</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> Pembayaran
                      </h3>
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="h-8">
                              <TableHead className="text-[8px] uppercase px-3">Periode</TableHead>
                              <TableHead className="text-[8px] uppercase px-3">Status</TableHead>
                              <TableHead className="text-[8px] uppercase px-3 text-right">Nominal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerInvoices?.sort((a,b) => b.billingPeriod.localeCompare(a.billingPeriod)).slice(0, 5).map((inv) => (
                              <TableRow key={inv.id} className="h-10">
                                <TableCell className="text-[10px] font-medium px-3">
                                  {inv.billingPeriod}
                                </TableCell>
                                <TableCell className="px-3">
                                  <Badge variant="outline" className={cn(
                                    "text-[7px] px-1 h-4",
                                    inv.status === 'paid' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"
                                  )}>
                                    {inv.status.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-right font-bold px-3">
                                  Rp{(inv.amount || 0).toLocaleString('id-ID')}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!customerInvoices || customerInvoices.length === 0) && (
                              <TableRow><TableCell colSpan={3} className="text-center text-[10px] text-slate-400 py-8">Belum ada riwayat.</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-4">
                    <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-none space-y-3 shadow-none">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Berlangganan</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Kondisi</span>
                          <Badge className={cn(
                            "px-3 py-0.5 text-[9px]",
                            isIsolated(viewingCustomer) ? "bg-rose-600" : (viewingCustomer.status === 'active' ? "bg-emerald-600" : "bg-amber-500")
                          )}>
                            {isIsolated(viewingCustomer) ? "TERISOLIR" : (viewingCustomer.status?.toUpperCase() || "N/A")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Paket</span>
                          <span className="text-xs font-bold text-primary">{getPackageName(viewingCustomer.packageId)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="text-slate-500">Update Terakhir</span>
                           <span className="font-medium">{formatDate(viewingCustomer.updatedAt || viewingCustomer.createdAt)}</span>
                        </div>
                      </div>
                    </Card>

                    <div className="flex flex-col gap-2">
                       {role === 'admin' && (
                         <Button variant="outline" className="w-full text-xs h-9" onClick={() => { setIsPreviewOpen(false); handleOpenNoteDialog(viewingCustomer); }}>
                           <AlertCircle className="mr-2 h-4 w-4 text-rose-500" /> Catat Gangguan
                         </Button>
                       )}
                       {(role === 'admin' || role === 'staff') && (
                         <Button variant="outline" className="w-full text-xs h-9" onClick={() => { setIsPreviewOpen(false); handleOpenEditDialog(viewingCustomer); }}>
                           <Edit2 className="mr-2 h-4 w-4" /> Edit Profil
                         </Button>
                       )}
                       {role === 'admin' && (
                        <Button 
                          variant="destructive" 
                          className="w-full text-xs h-9"
                          onClick={() => {
                            deleteCustomer(viewingCustomer.id);
                            setIsPreviewOpen(false);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus Pelanggan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-3 border-t md:hidden">
            <Button onClick={() => setIsPreviewOpen(false)} className="w-full text-xs h-9">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Input Cepat Gangguan Baru */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4 bg-rose-50 dark:bg-rose-900/20 border-b">
            <DialogTitle className="text-sm flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-4 w-4" />
              Catat Gangguan: {notingCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSaveNote} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote" className="text-xs">Detail Keluhan Baru</Label>
              <Textarea 
                id="newNote" 
                name="newNote" 
                placeholder="Contoh: Lampu LOS Merah..."
                className="min-h-[100px] text-xs resize-none"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNoteDialogOpen(false)} className="text-xs h-9">Batal</Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-xs h-9">Simpan Catatan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
