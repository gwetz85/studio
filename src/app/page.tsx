
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Package, CreditCard, CheckCircle2, ShieldAlert, Wifi, Sparkles, BarChart3 } from "lucide-react"
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
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell
} from "recharts"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from "@/components/ui/chart"

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
    const totalCount = await db.customers.count();
    const activeCount = await db.customers.where('status').equals('active').count();
    const passiveCount = await db.customers.where('status').equals('passive').count();
    const inactiveCount = await db.customers.where('status').equals('inactive').count();
    
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
      total: totalCount,
      active: activeCount,
      passive: passiveCount,
      inactive: inactiveCount,
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
      value: stats.total,
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
  ];

  const chartData = [
    { status: "Aktif", count: stats.active, fill: "hsl(var(--primary))" },
    { status: "Pasif", count: stats.passive, fill: "hsl(var(--accent))" },
    { status: "Non-Aktif", count: stats.inactive, fill: "hsl(var(--destructive))" },
  ];

  const chartConfig = {
    count: {
      label: "Jumlah Pelanggan",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900 rounded-[2.5rem]">
          <div className="bg-primary p-8 text-white text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md mb-2">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-white">SELAMAT DATANG DI APLIKASI MTNET SYSTEM</DialogTitle>
              <DialogDescription className="text-primary-foreground/90 text-center space-y-4">
                <p className="font-semibold">Aplikasi ini dibuat dan dikembangkan oleh AGUS SURIYADI</p>
                <div className="text-sm text-left bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                  <p className="mb-2">Mohon pergunakan aplikasi ini dengan sebaiknya.</p>
                  <p className="font-bold mb-1 underline">Aplikasi ini berisi tentang:</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-90">
                    <li>Data Pelanggan</li>
                    <li>Payment</li>
                    <li>User Isolir dan Nonaktif</li>
                    <li>Fitur Teknisi</li>
                  </ul>
                </div>
                <p className="text-xs italic">Aplikasi ini memberikan pengalaman bekerja secara terorganisir di 1 aplikasi dan akan terus melakukan update fitur secara berkala.</p>
                <p className="font-bold pt-2">Terima Kasih</p>
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900">
            <DialogFooter>
              <Button onClick={() => setShowWelcome(false)} className="w-full h-11 font-bold tracking-tight rounded-2xl">
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
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900/50 rounded-2xl">
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

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Grafik Status Pelanggan */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden dark:bg-slate-900/50 rounded-2xl">
          <CardHeader className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Statistik Status Pelanggan</CardTitle>
              <CardDescription>Perbandingan jumlah pelanggan berdasarkan status layanan.</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis 
                  dataKey="status" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  barSize={60}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Status Sistem */}
        <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900/50 rounded-2xl">
          <CardHeader className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Database Lokal</span>
                </div>
                <Badge className="bg-green-600 dark:bg-green-500 rounded-lg">Aktif</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Periode Saat Ini</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xl">{currentPeriod}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Tanggal Operasional</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xl">{currentDay}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase text-primary">Info Billing</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Tagihan otomatis diterbitkan setiap tanggal 1. Masa isolasi dimulai setelah tanggal 9 untuk pelanggan yang belum melunasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
