"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, CreditCard, CheckCircle2, ShieldAlert, Wifi, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { toast } = useToast();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const [isProcessingAutoBill, setIsProcessingAutoBill] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(false);

  // Welcome Pop-up Logic
  React.useEffect(() => {
    const welcomeShown = sessionStorage.getItem("mtnet_welcome_shown");
    if (!welcomeShown) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        sessionStorage.setItem("mtnet_welcome_shown", "true");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto Generate Bills Logic
  React.useEffect(() => {
    const generateMonthlyBills = async () => {
      if (isProcessingAutoBill) return;
      
      try {
        setIsProcessingAutoBill(true);
        const activeCustomers = await db.customers.where('status').equals('active').toArray();
        const allPackages = await db.packages.toArray();
        const currentPayments = await db.payments.where('billingPeriod').equals(currentPeriod).toArray();
        
        const existingCustomerIds = new Set(currentPayments.map(p => p.customerId));
        let generatedCount = 0;

        for (const customer of activeCustomers) {
          if (!existingCustomerIds.has(customer.id!)) {
            const pkg = allPackages.find(p => p.id === customer.packageId);
            if (pkg) {
              await db.payments.add({
                customerId: customer.id!,
                amount: pkg.price,
                billingPeriod: currentPeriod,
                status: 'pending',
              });
              generatedCount++;
            }
          }
        }

        if (generatedCount > 0) {
          toast({
            title: "Tagihan Otomatis Diterbitkan",
            description: `${generatedCount} invoice baru untuk periode ${currentPeriod} telah berhasil dibuat secara otomatis.`,
          });
        }
      } catch (error) {
        console.error("Gagal melakukan auto-billing:", error);
      } finally {
        setIsProcessingAutoBill(false);
      }
    };

    generateMonthlyBills();
  }, [currentPeriod, toast]);

  const stats = useLiveQuery(async () => {
    const customerCount = await db.customers.count();
    const packageCount = await db.packages.count();
    const pendingPayments = await db.payments.where('status').equals('pending').count();
    
    let isolatedCount = 0;
    if (currentDay > 9) {
      const activeCustomers = await db.customers.where('status').equals('active').toArray();
      const currentPaidPayments = await db.payments
        .where('billingPeriod').equals(currentPeriod)
        .and(p => p.status === 'paid')
        .toArray();
      
      const paidCustomerIds = new Set(currentPaidPayments.map(p => p.customerId));
      isolatedCount = activeCustomers.filter(c => !paidCustomerIds.has(c.id!)).length;
    }
    
    return {
      customers: customerCount,
      packages: packageCount,
      pending: pendingPayments,
      isolated: isolatedCount,
    }
  }, [currentDay, currentPeriod]);

  if (!stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  const dashboardItems = [
    {
      title: "Total Pelanggan",
      value: stats.customers,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Paket Aktif",
      value: stats.packages,
      icon: Package,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
    },
    {
      title: "Pembayaran Menunggu",
      value: stats.pending,
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "User Terisolir",
      value: stats.isolated,
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="bg-primary p-8 text-white text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md mb-2">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-white">SELAMAT DATANG DI APLIKASI MTNET SYSTEM</DialogTitle>
              <DialogDescription className="text-primary-foreground/90 text-center">
                Sistem manajemen internet Anda telah siap digunakan. Mulai kelola pelanggan dan tagihan dengan mudah hari ini.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900">
            <DialogFooter>
              <Button onClick={() => setShowWelcome(false)} className="w-full h-11 font-bold tracking-tight">
                Mulai Bekerja
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Ringkasan operasional layanan internet Anda hari ini.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2.5 rounded-xl`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900/50">
          <CardHeader className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Aturan Masa Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold">9</div>
              <div>
                <h3 className="font-semibold text-rose-900 dark:text-rose-100">Batas Tanggal Pembayaran</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">Seluruh paket berakhir setiap tanggal 9. Pelanggan yang belum membayar setelah tanggal ini akan otomatis masuk daftar terisolir.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-primary shadow-sm font-bold">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Tagihan Otomatis</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Aplikasi otomatis membuat tagihan untuk pelanggan aktif setiap tanggal 1 setiap bulannya.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-primary shadow-sm font-bold">!</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Status Saat Ini</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hari ini tanggal <strong>{currentDay}</strong>. {currentDay > 9 ? "Masa isolasi sedang berlangsung." : "Masih dalam masa tenggang pembayaran."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900/50">
          <CardHeader className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Database Lokal</span>
                </div>
                <Badge className="bg-green-600 dark:bg-green-500">Aktif</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Periode</p>
                  <p className="font-bold text-slate-900 dark:text-white">{currentPeriod}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Mode</p>
                  <p className="font-bold text-slate-900 dark:text-white">Otomatis</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
