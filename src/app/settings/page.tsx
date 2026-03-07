
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useLiveQuery } from "dexie-react-hooks"
import { 
  Download, 
  Upload, 
  Trash2, 
  Info, 
  Moon, 
  Sun, 
  ShieldAlert,
  Database,
  User,
  LogOut,
  History,
  Users,
  Search
} from "lucide-react"
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
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function SettingsPage() {
  const { toast } = useToast();
  const { logout, role, isLoading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [lastAutoBackupTime, setLastAutoBackupTime] = React.useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = React.useState("");

  // Fetch customers for individual deletion
  const customers = useLiveQuery(() => {
    if (!customerSearch) return db.customers.toArray();
    const s = customerSearch.toLowerCase();
    return db.customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.phone.includes(s)
    ).toArray();
  }, [customerSearch]);

  // Handle Theme Init and Auto Backup Info
  React.useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    setIsDarkMode(theme === "dark");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }

    const backupTime = localStorage.getItem("mtnet_last_backup_time");
    if (backupTime) {
      try {
        const timeValue = parseInt(backupTime);
        if (!isNaN(timeValue)) {
          setLastAutoBackupTime(format(new Date(timeValue), "dd MMM yyyy, HH:mm", { locale: localeId }));
        }
      } catch (e) {
        console.error("Invalid backup time format", e);
      }
    }
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return null;
  }

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    const theme = checked ? "dark" : "light";
    localStorage.setItem("theme", theme);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast({
      title: `Tema ${checked ? "Gelap" : "Terang"} Aktif`,
      description: "Pengaturan tampilan telah disimpan.",
    });
  };

  const handleBackup = async () => {
    try {
      const customersData = await db.customers.toArray();
      const packagesData = await db.packages.toArray();
      const paymentsData = await db.payments.toArray();
      
      const backupData = {
        version: "1.0.0",
        timestamp: Date.now(),
        data: { customers: customersData, packages: packagesData, payments: paymentsData }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MTNET_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Backup Berhasil", description: "File data telah diunduh ke perangkat Anda." });
    } catch (error) {
      toast({ variant: "destructive", title: "Backup Gagal", description: "Terjadi kesalahan saat mengekspor data." });
    }
  };

  const restoreData = async (backup: any) => {
    await db.transaction('rw', db.customers, db.packages, db.payments, async () => {
      await db.customers.clear();
      await db.packages.clear();
      await db.payments.clear();

      if (backup.data.customers) await db.customers.bulkAdd(backup.data.customers);
      if (backup.data.packages) await db.packages.bulkAdd(backup.data.packages);
      if (backup.data.payments) await db.payments.bulkAdd(backup.data.payments);
    });
    toast({ title: "Restore Berhasil", description: "Seluruh data telah dipulihkan." });
    window.location.reload();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        if (!backup.data) throw new Error("Format tidak valid");
        if (confirm("Restore akan menimpa data saat ini. Lanjutkan?")) {
          await restoreData(backup);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Restore Gagal", description: "File cadangan rusak atau tidak kompatibel." });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleRestoreAutoBackup = () => {
    const backupStr = localStorage.getItem("mtnet_auto_backup");
    if (!backupStr) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada data pencadangan otomatis yang ditemukan." });
      return;
    }

    try {
      const backup = JSON.parse(backupStr);
      if (confirm(`Pulihkan data dari pencadangan otomatis terakhir (${lastAutoBackupTime})? Data saat ini akan ditimpa.`)) {
        restoreData(backup);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Kesalahan", description: "Data pencadangan otomatis rusak." });
    }
  };

  const handleClearAllData = async () => {
    try {
      await db.transaction('rw', db.customers, db.packages, db.payments, async () => {
        await db.customers.clear();
        await db.packages.clear();
        await db.payments.clear();
      });
      toast({ title: "Data Dihapus", description: "Seluruh database telah dikosongkan." });
      window.location.reload();
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat menghapus data." });
    }
  };

  const deleteIndividualCustomer = async (id: number) => {
    if (confirm("Hapus pelanggan ini secara permanen dari database?")) {
      try {
        await db.customers.delete(id);
        toast({ title: "Pelanggan dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus", description: "Terjadi kesalahan pada database." });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h1>
          <p className="text-slate-500">Kelola data aplikasi dan preferensi sistem Anda.</p>
        </div>
        <Button variant="outline" className="text-rose-600 border-rose-100 hover:bg-rose-50" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Keluar Sesi
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500 dark:hidden" />
              <Moon className="h-5 w-5 text-indigo-400 hidden dark:block" />
              <CardTitle>Tampilan</CardTitle>
            </div>
            <CardDescription>Atur bagaimana aplikasi terlihat di perangkat Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Mode Gelap</Label>
                <p className="text-sm text-slate-500">Aktifkan tema gelap untuk kenyamanan mata.</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Manajemen Data</CardTitle>
            </div>
            <CardDescription>Cadangkan atau pulihkan data lokal Anda secara aman.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" /> Ekspor Data
              </h3>
              <p className="text-[10px] text-slate-500">Unduh seluruh database dalam format JSON ke perangkat.</p>
              <Button variant="outline" size="sm" className="w-full bg-white text-xs" onClick={handleBackup}>
                Mulai Backup
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" /> Impor Data
              </h3>
              <p className="text-[10px] text-slate-500">Pulihkan data dari file backup (.json) yang ada.</p>
              <div className="relative">
                <Button variant="outline" size="sm" className="w-full bg-white text-xs">
                  Pilih File
                </Button>
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleRestore}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" /> Auto Restore
              </h3>
              <p className="text-[10px] text-slate-500">
                {lastAutoBackupTime ? `Terakhir: ${lastAutoBackupTime}` : "Belum ada auto backup."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white text-xs border-amber-200 text-amber-700 hover:bg-amber-50" 
                onClick={handleRestoreAutoBackup}
                disabled={!lastAutoBackupTime}
              >
                Restore Terakhir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Individual Customer Deletion Section */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" />
              <CardTitle>Hapus User (Pelanggan)</CardTitle>
            </div>
            <CardDescription>Cari dan hapus data pelanggan/user secara individu dari database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau nomor telepon..." 
                className="pl-10 h-10"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="border rounded-xl overflow-hidden bg-white">
              <ScrollArea className="h-[250px]">
                <div className="divide-y">
                  {customers?.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.phone} • {customer.email}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-9 w-9"
                        onClick={() => customer.id && deleteIndividualCustomer(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {customers && customers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <Users className="h-8 w-8 opacity-20 mb-2" />
                      <p className="text-sm">Tidak ada pelanggan ditemukan.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100 shadow-sm bg-rose-50/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle>Zona Berbahaya</CardTitle>
            </div>
            <CardDescription>Tindakan ini permanen dan tidak dapat dibatalkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda sangat yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seluruh data pelanggan, paket, dan riwayat pembayaran akan dihapus secara permanen dari database lokal browser ini.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-rose-600 hover:bg-rose-700">
                    Ya, Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Informasi Aplikasi</h3>
                  <p className="text-xs text-slate-400">MTNET Billing - Sistem Manajemen Luring</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-primary inline-block w-fit">v1.2.0-stable</span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <User className="h-3 w-3" />
                  <span>Dibuat oleh <span className="text-slate-200 font-semibold">AGUS SURIYADI</span></span>
                </div>
                <p className="text-[10px] text-slate-500">Dibuat dengan ❤️ untuk UMKM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
