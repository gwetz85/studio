"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
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
  Palette,
  Check
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
import { cn } from "@/lib/utils"

const sidebarColors = [
  { name: "Biru (Bawaan)", value: "blue", class: "bg-blue-500" },
  { name: "Merah", value: "red", class: "bg-red-500" },
  { name: "Kuning", value: "yellow", class: "bg-yellow-400" },
  { name: "Oren", value: "orange", class: "bg-orange-500" },
  { name: "Ungu", value: "purple", class: "bg-purple-600" },
  { name: "Abu-Abu", value: "gray", class: "bg-slate-500" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { logout, role, isLoading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [activeSidebarColor, setActiveSidebarColor] = React.useState("blue");
  const [lastAutoBackupTime, setLastAutoBackupTime] = React.useState<string | null>(null);

  // Handle Theme Init and Auto Backup Info
  React.useEffect(() => {
    const theme = localStorage.getItem("theme");
    const color = localStorage.getItem("sidebar_color") || "blue";
    const darkModeActive = theme === "dark";
    setIsDarkMode(darkModeActive);
    setActiveSidebarColor(color);
    
    if (darkModeActive) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.setAttribute("data-sidebar-color", color);

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
      description: `Aplikasi sekarang menggunakan Mode ${checked ? "Gelap" : "Terang"}.`,
    });
  };

  const changeSidebarColor = (color: string) => {
    setActiveSidebarColor(color);
    localStorage.setItem("sidebar_color", color);
    document.documentElement.setAttribute("data-sidebar-color", color);
    toast({
      title: "Warna Sidebar Diperbarui",
      description: `Template warna kini menggunakan ${color.charAt(0).toUpperCase() + color.slice(1)}.`,
    });
  };

  const handleBackup = async () => {
    try {
      const customersData = await db.customers.toArray();
      const packagesData = await db.packages.toArray();
      const paymentsData = await db.payments.toArray();
      
      const backupData = {
        version: "2.0.1",
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pengaturan</h1>
          <p className="text-slate-500">Kelola data aplikasi dan preferensi sistem Anda.</p>
        </div>
        <Button variant="outline" className="text-rose-600 border-rose-100 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Keluar Sesi
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm dark:bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500 dark:hidden" />
              <Moon className="h-5 w-5 text-indigo-400 hidden dark:block" />
              <CardTitle>Tampilan & Tema</CardTitle>
            </div>
            <CardDescription>Pilih antara Mode Terang/Gelap dan kustomisasi warna sidebar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between py-2 border-b dark:border-slate-800">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Mode Gelap</Label>
                <p className="text-sm text-slate-500">Ubah tampilan aplikasi menjadi tema gelap.</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>

            <div className="space-y-4">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Template Warna Aplikasi
                </Label>
                <p className="text-sm text-slate-500">Pilih skema warna untuk Menu Kiri (Sidebar).</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                {sidebarColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => changeSidebarColor(color.value)}
                    className={cn(
                      "group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      activeSidebarColor === color.value 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full shadow-sm flex items-center justify-center", color.class)}>
                      {activeSidebarColor === color.value && <Check className="h-5 w-5 text-white drop-shadow" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-600 dark:text-slate-400">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Manajemen Data</CardTitle>
            </div>
            <CardDescription>Cadangkan atau pulihkan data lokal Anda secara aman.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" /> Ekspor Data
              </h3>
              <p className="text-[10px] text-slate-500">Unduh seluruh database dalam format JSON.</p>
              <Button variant="outline" size="sm" className="w-full bg-white dark:bg-slate-900 text-xs" onClick={handleBackup}>
                Mulai Backup
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" /> Impor Data
              </h3>
              <p className="text-[10px] text-slate-500">Pulihkan data dari file backup (.json).</p>
              <div className="relative">
                <Button variant="outline" size="sm" className="w-full bg-white dark:bg-slate-900 text-xs">
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

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" /> Auto Restore
              </h3>
              <p className="text-[10px] text-slate-500">
                {lastAutoBackupTime ? `Terakhir: ${lastAutoBackupTime}` : "Belum ada auto backup."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white dark:bg-slate-900 text-xs border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950" 
                onClick={handleRestoreAutoBackup}
                disabled={!lastAutoBackupTime}
              >
                Restore Terakhir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100 dark:border-rose-900 shadow-sm bg-rose-50/20 dark:bg-rose-950/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
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
                  <p className="text-xs text-slate-400">MTNET SYSTEM - Sistem Manajemen Luring</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-primary inline-block w-fit">v2.0.1</span>
                <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/60">
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