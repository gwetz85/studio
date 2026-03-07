"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  Upload, 
  Trash2, 
  Info, 
  Moon, 
  Sun, 
  ShieldAlert,
  Database,
  User
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Handle Theme Init
  React.useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    setIsDarkMode(theme === "dark");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
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
      description: "Pengaturan tampilan telah disimpan.",
    });
  };

  const handleBackup = async () => {
    try {
      const customers = await db.customers.toArray();
      const packages = await db.packages.toArray();
      const payments = await db.payments.toArray();
      
      const backupData = {
        version: "1.0.0",
        timestamp: Date.now(),
        data: { customers, packages, payments }
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
          await db.transaction('rw', db.customers, db.packages, db.payments, async () => {
            await db.customers.clear();
            await db.packages.clear();
            await db.payments.clear();

            if (backup.data.customers) await db.customers.bulkAdd(backup.data.customers);
            if (backup.data.packages) await db.packages.bulkAdd(backup.data.packages);
            if (backup.data.payments) await db.payments.bulkAdd(backup.data.payments);
          });

          toast({ title: "Restore Berhasil", description: "Seluruh data telah dipulihkan." });
          // Optional: Refresh or redirect
          window.location.reload();
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Restore Gagal", description: "File cadangan rusak atau tidak kompatibel." });
      }
    };
    reader.readAsText(file);
    // Clear the input so same file can be selected again
    event.target.value = "";
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h1>
        <p className="text-slate-500">Kelola data aplikasi dan preferensi sistem Anda.</p>
      </div>

      <div className="grid gap-6">
        {/* Tampilan Section */}
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

        {/* Database Section */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Manajemen Data</CardTitle>
            </div>
            <CardDescription>Cadangkan atau pulihkan data lokal Anda secara aman.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Download className="h-4 w-4" /> Ekspor Data
              </h3>
              <p className="text-xs text-slate-500">Unduh seluruh database dalam format JSON untuk cadangan.</p>
              <Button variant="outline" size="sm" className="w-full bg-white" onClick={handleBackup}>
                Mulai Backup
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" /> Impor Data
              </h3>
              <p className="text-xs text-slate-500">Pulihkan data dari file backup yang telah dibuat sebelumnya.</p>
              <div className="relative">
                <Button variant="outline" size="sm" className="w-full bg-white">
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
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
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

        {/* Info Version Section */}
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
