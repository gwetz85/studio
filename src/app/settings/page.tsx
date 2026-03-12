
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useFirestore, useUser } from "@/firebase"
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore"
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
  LogOut,
  Palette,
  Check,
  Loader2
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
  const firestore = useFirestore();
  const { user } = useUser();
  const { logout, role, isLoading: authLoading } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [activeSidebarColor, setActiveSidebarColor] = React.useState("blue");
  const [isProcessing, setIsProcessing] = React.useState(false);

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
    });
  };

  const changeSidebarColor = (color: string) => {
    setActiveSidebarColor(color);
    localStorage.setItem("sidebar_color", color);
    document.documentElement.setAttribute("data-sidebar-color", color);
    toast({
      title: "Warna Sidebar Diperbarui",
    });
  };

  const fetchCollection = async (name: string) => {
    const snapshot = await getDocs(collection(firestore, name));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const handleBackup = async () => {
    if (!user || role !== 'admin') return;
    setIsProcessing(true);
    try {
      const backupData = {
        version: "2.1.0",
        timestamp: Date.now(),
        data: {
          customers: await fetchCollection("customers"),
          servicePackages: await fetchCollection("servicePackages"),
          invoices: await fetchCollection("invoices"),
          psbRequests: await fetchCollection("psbRequests"),
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MTNET_Cloud_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Backup Cloud Berhasil", description: "Data cloud telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Backup Gagal", description: "Gagal mengambil data dari server." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || role !== 'admin') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        
        const dataToRestore = backup.data || backup;
        
        if (confirm("PENTING: Restore akan menimpa/menambahkan data ke server Cloud dan bisa dilihat oleh semua user. Lanjutkan?")) {
          setIsProcessing(true);
          
          const collectionMapping: Record<string, string> = {
            "customers": "customers",
            "packages": "servicePackages",
            "servicePackages": "servicePackages",
            "payments": "invoices",
            "invoices": "invoices",
            "psb": "psbRequests",
            "psbRequests": "psbRequests"
          };

          for (const key in dataToRestore) {
            const targetCol = collectionMapping[key];
            if (!targetCol) continue;

            const docs = dataToRestore[key];
            if (!Array.isArray(docs)) continue;

            for (const docData of docs) {
              const { id, ...data } = docData;
              const docId = id ? String(id) : undefined;

              try {
                if (docId) {
                  await setDoc(doc(firestore, targetCol, docId), data, { merge: true });
                } else {
                  await addDoc(collection(firestore, targetCol), data);
                }
              } catch (e) {
                console.warn(`Gagal memulihkan dokumen di ${targetCol}:`, e);
              }
            }
          }

          toast({ title: "Restore Cloud Berhasil", description: "Data telah disinkronkan ke seluruh tim." });
        }
      } catch (error) {
        console.error("Kesalahan Restore:", error);
        toast({ variant: "destructive", title: "Restore Gagal", description: "Format file tidak didukung atau file rusak." });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleClearAllData = async () => {
    if (!user || role !== 'admin') return;
    setIsProcessing(true);
    try {
      const collections = ["customers", "servicePackages", "invoices", "psbRequests"];
      for (const colName of collections) {
        const snapshot = await getDocs(collection(firestore, colName));
        for (const docItem of snapshot.docs) {
          await deleteDoc(doc(firestore, colName, docItem.id));
        }
      }
      toast({ title: "Database Cloud Bersih", description: "Seluruh data di server telah dihapus." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membersihkan database cloud." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pengaturan</h1>
          <p className="text-slate-500">Kelola cloud database dan preferensi sistem.</p>
        </div>
        <Button variant="outline" className="text-rose-600 border-rose-100" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm dark:bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500 dark:hidden" />
              <Moon className="h-5 w-5 text-indigo-400 hidden dark:block" />
              <CardTitle>Tampilan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between py-2 border-b dark:border-slate-800">
              <Label className="text-base font-semibold">Mode Gelap</Label>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Warna Sidebar
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {sidebarColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => changeSidebarColor(color.value)}
                    className={cn(
                      "group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      activeSidebarColor === color.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-full", color.class)}>
                      {activeSidebarColor === color.value && <Check className="h-4 w-4 text-white mx-auto mt-2" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase">{color.name}</span>
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
              <CardTitle>Cloud Sync & Backup</CardTitle>
            </div>
            <CardDescription>Semua aksi di sini akan berdampak pada seluruh perangkat tim.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-600">
                <Download className="h-4 w-4" /> Download Cloud Data
              </h3>
              <p className="text-[10px] text-slate-500">Ambil salinan data terbaru dari server cloud.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white dark:bg-slate-900" 
                onClick={handleBackup}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin h-3 w-3" /> : "Mulai Backup"}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-600">
                <Upload className="h-4 w-4" /> Upload & Sync Cloud
              </h3>
              <p className="text-[10px] text-slate-500">Unggah file backup untuk disinkronkan ke seluruh tim.</p>
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white dark:bg-slate-900"
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin h-3 w-3" /> : "Pilih File"}
                </Button>
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleRestore}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100 dark:border-rose-900 shadow-sm bg-rose-50/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle>Hapus Server Cloud</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Kosongkan Seluruh Database Cloud
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Seluruh Data Tim?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus data di server pusat. Seluruh staf tidak akan melihat data apa pun lagi. Pastikan Anda sudah mendownload backup.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-rose-600">
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
                <Info className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold">MTNET Cloud v2.1.0</h3>
                  <p className="text-xs text-slate-400">Mode Sinkronisasi Real-time Aktif</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 text-right">
                Dibuat oleh <span className="text-slate-200">AGUS SURIYADI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
