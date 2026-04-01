
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, addDoc, updateDoc, doc, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { 
  Users, 
  AlertCircle, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Search, 
  MapPin, 
  Phone, 
  Cpu, 
  Package, 
  User,
  Edit2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function LaporanGangguanPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { role, username } = useAuth();
  
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [reportText, setReportText] = React.useState("");
  const [fixTexts, setFixTexts] = React.useState<Record<string, string>>({});
  
  // Edit State
  const [editingIssueId, setEditingIssueId] = React.useState<string | null>(null);
  const [editingReportText, setEditingReportText] = React.useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // 1. Fetch Customers for Dropbox
  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "customers"), where("status", "==", "active"));
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  // 2. Fetch Active Issues (Pending)
  const activeIssuesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "issues"), 
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);
  const { data: activeIssues } = useCollection(activeIssuesQuery);

  // 3. Fetch Service Packages (for details)
  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const selectedCustomer = React.useMemo(() => {
    return customers?.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const getPackageName = (id: string) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  // HANDLERS
  const handleKirimLaporan = async () => {
    if (!selectedCustomerId || !reportText) {
      toast({ variant: "destructive", title: "Lengkapi data laporan" });
      return;
    }

    try {
      await addDoc(collection(db, "issues"), {
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || "N/A",
        reportDescription: reportText,
        fixDescription: "",
        status: "pending",
        createdAt: Date.now(),
        reporter: username || "Staff"
      });
      
      toast({ title: "Laporan Terkirim", description: "Data gangguan telah terkunci di sistem." });
      setReportText("");
      setSelectedCustomerId(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal mengirim laporan" });
    }
  };

  const handleSaveEksekusi = async (issueId: string) => {
    if (role !== 'admin') return;
    const fixText = fixTexts[issueId];
    
    if (!fixText) {
      toast({ variant: "destructive", title: "Isi perbaikan terlebih dahulu" });
      return;
    }

    try {
      await updateDoc(doc(db, "issues", issueId), {
        fixDescription: fixText,
        status: "completed",
        solvedAt: Date.now()
      });
      
      toast({ title: "Gangguan Selesai", description: "Laporan telah disimpan sebagai riwayat utuh." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menyimpan eksekusi" });
    }
  };

  const handleOpenEdit = (issue: any) => {
    setEditingIssueId(issue.id);
    setEditingReportText(issue.reportDescription);
    setIsEditDialogOpen(true);
  };

  const handleUpdateReportDescription = async () => {
    if (!editingIssueId || !editingReportText) return;

    try {
      await updateDoc(doc(db, "issues", editingIssueId), {
        reportDescription: editingReportText
      });
      
      toast({ title: "Laporan Diperbarui", description: "Catatan gangguan telah berhasil diubah." });
      setIsEditDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memperbarui laporan" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Gangguan</h1>
        <p className="text-slate-500 dark:text-slate-400">Pusat pelaporan dan eksekusi perbaikan jaringan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BAGIAN 1: DATA PELANGGAN */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm dark:bg-slate-900/40">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                1. Pilih Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Cari Nama Pelanggan</Label>
                <Select value={selectedCustomerId || ""} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih nama pelanggan terdaftar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-rose-500" /> {selectedCustomer.address}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Telepon</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-emerald-500" /> {selectedCustomer.phone}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">SN / MAC Modem</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Cpu className="h-3 w-3 text-primary" /> {selectedCustomer.modemSnMac || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Paket Aktif</p>
                      <Badge variant="secondary" className="text-[10px]">
                        <Package className="h-3 w-3 mr-1" /> {getPackageName(selectedCustomer.packageId)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BAGIAN 2: INPUT LAPORAN GANGGUAN */}
          <Card className={cn(
            "border-none shadow-sm dark:bg-slate-900/40 transition-opacity",
            !selectedCustomerId && "opacity-50 pointer-events-none"
          )}>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                2. Input Laporan Gangguan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Deskripsi Keluhan / Gangguan</Label>
                <Textarea 
                  placeholder="Contoh: Lampu LOS merah, Internet Lambat, dll..."
                  className="min-h-[120px] resize-none"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleKirimLaporan} 
                className="w-full bg-rose-600 hover:bg-rose-700 shadow-lg"
                disabled={!selectedCustomerId || !reportText}
              >
                KIRIM LAPORAN
              </Button>
              <p className="text-[10px] text-center text-slate-500 italic">
                *Data akan langsung terlocked di sistem MTNET setelah dikirim.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* BAGIAN 3: EKSEKUSI (HANYA ADMIN) */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm dark:bg-slate-900/40 h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-500" />
                3. Eksekusi Perbaikan
              </CardTitle>
              <CardDescription>Daftar antrean pengerjaan teknis di lapangan.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="p-6 space-y-6">
                  {activeIssues?.map((issue) => (
                    <div key={issue.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{issue.customerName}</h4>
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[9px] h-4">ANTREAN</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {format(new Date(issue.createdAt), "dd MMM, HH:mm", { locale: localeId })}
                            <Separator orientation="vertical" className="h-2" />
                            <User className="h-3 w-3" /> {issue.reporter}
                          </div>
                        </div>
                      </div>

                      <div className="group relative p-3 rounded-lg bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                        <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                          <span className="font-bold">Laporan:</span> {issue.reportDescription}
                        </p>
                        {(role === 'admin' || issue.reporter === username) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleOpenEdit(issue)}
                          >
                            <Edit2 className="h-3 w-3 text-slate-400" />
                          </Button>
                        )}
                      </div>

                      {role === 'admin' ? (
                        <div className="space-y-3 pt-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Input Hasil Eksekusi</Label>
                          <Textarea 
                            placeholder="Ketik detail perbaikan yang dilaksanakan..."
                            className="text-xs min-h-[80px] bg-slate-50 dark:bg-slate-800/50"
                            value={fixTexts[issue.id!] || ""}
                            onChange={(e) => setFixTexts(prev => ({ ...prev, [issue.id!]: e.target.value }))}
                          />
                          <Button 
                            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleSaveEksekusi(issue.id!)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> SIMPAN & SELESAI
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Menunggu Eksekusi Admin</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {activeIssues?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500" />
                      <h4 className="font-bold">Semua Aman</h4>
                      <p className="text-xs">Tidak ada antrean gangguan aktif saat ini.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="bg-slate-50 dark:bg-slate-800 p-6 border-b text-center">
            <DialogTitle className="text-sm font-bold uppercase tracking-tight">Edit Laporan Gangguan</DialogTitle>
            <DialogDescription className="text-[10px]">Ubah detail catatan keluhan pelanggan.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Laporan</Label>
              <Textarea 
                value={editingReportText}
                onChange={(e) => setEditingReportText(e.target.value)}
                className="min-h-[120px] text-xs resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 h-10 text-xs">BATAL</Button>
              <Button onClick={handleUpdateReportDescription} className="flex-1 h-10 text-xs shadow-lg">SIMPAN PERUBAHAN</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
