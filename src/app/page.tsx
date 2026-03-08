"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Package, CreditCard, ShieldAlert, Wifi, Sparkles, PieChart as PieChartIcon } from "lucide-react"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
} from "recharts"
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart"

// Custom MTnet Logo Component
const MTLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 32V10L20 22L34 10V32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 22V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 36H28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="34" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="20" cy="22" r="2.5" fill="currentColor"/>
  </svg>
)

export default function Dashboard() {
  const { toast } = useToast();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const [isProcessingAutoBill, setIsProcessingAutoBill] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(false);

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
    if (currentDay > 8) {
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
      bg: "bg-blue-100/50 dark:bg-blue-900/30",
    },
    {
      title: "Paket Aktif",
      value: stats.packages,
      icon: Package,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100/50 dark:bg-cyan-900/30",
    },
    {
      title: "Pembayaran Menunggu",
      value: stats.pending,
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100/50 dark:bg-amber-900/30",
    },
    {
      title: "User Terisolir",
      value: stats.isolated,
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100/50 dark:bg-rose-900/30",
    },
  ];

  const chartData = [
    { name: "Aktif", value: stats.active, fill: "hsl(var(--primary))" },
    { name: "Pasif", value: stats.passive, fill: "hsl(var(--accent))" },
    { name: "Non-Aktif", value: stats.inactive, fill: "hsl(var(--destructive))" },
  ];

  const chartConfig = {
    value: { label: "Jumlah" },
    Aktif: { label: "Aktif", color: "hsl(var(--primary))" },
    Pasif: { label: "Pasif", color: "hsl(var(--accent))" },
    "Non-Aktif": { label: "Non-Aktif", color: "hsl(var(--destructive))" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-2 shadow-xl border border-white/20">
              <MTLogo className="h-12 w-12 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-center text-white uppercase tracking-tighter">SELAMAT DATANG DI MTNET SYSTEM</DialogTitle>
              <div className="text-primary-foreground/90 text-center space-y-4 mt-4">
                <p className="font-bold text-lg leading-tight">Sistem Manajemen Penagihan & Layanan Internet</p>
                <div className="text-sm text-left bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                  <p className="mb-3 font-semibold">Dikembangkan oleh:</p>
                  <p className="font-bold text-lg text-white mb-3">AGUS SURIYADI</p>
                  <p className="font-medium mb-2 opacity-80 underline decoration-white/30 underline-offset-4 text-xs uppercase tracking-widest">Modul Aplikasi:</p>
                  <ul className="grid grid-cols-2 gap-2 opacity-90 font-bold text-[10px] uppercase">
                    <li className="flex items-center gap-1.5"><div className="h-1 w-1 bg-white rounded-full" /> Data Pelanggan</li>
                    <li className="flex items-center gap-1.5"><div className="h-1 w-1 bg-white rounded-full" /> Billing System</li>
                    <li className="flex items-center gap-1.5"><div className="h-1 w-1 bg-white rounded-full" /> Isolir & Nonaktif</li>
                    <li className="flex items-center gap-1.5"><div className="h-1 w-1 bg-white rounded-full" /> Menu Teknisi</li>
                  </ul>
                </div>
                <p className="text-xs italic opacity-80">Aplikasi ini dirancang untuk mempermudah operasional harian Anda dalam satu platform terpadu.</p>
                <p className="font-black text-xl pt-2 tracking-widest">TERIMA KASIH</p>
              </div>
            </DialogHeader>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
            <DialogFooter>
              <Button onClick={() => setShowWelcome(false)} className="w-full h-12 font-bold tracking-tight shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                MASUK KE DASHBOARD
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
          <Card key={item.title} className="border-none bg-white/45 dark:bg-slate-900/45 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group border border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2.5 rounded-xl transition-transform group-hover:scale-110`}>
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
        <Card className="lg:col-span-2 border-none bg-white/45 dark:bg-slate-900/45 backdrop-blur-md shadow-sm overflow-hidden rounded-2xl border border-white/20">
          <CardHeader className="bg-white/40 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Statistik Status Pelanggan</CardTitle>
            <PieChartIcon className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-x-6 gap-y-2 pt-8" />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-white/45 dark:bg-slate-900/45 backdrop-blur-md shadow-sm overflow-hidden rounded-2xl border border-white/20">
          <CardHeader className="bg-white/40 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-green-900 dark:text-green-300 uppercase tracking-tight">Database Lokal</span>
                </div>
                <Badge className="bg-green-600 dark:bg-green-500 rounded-lg px-3 py-1">AKTIF</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-widest">Periode Saat Ini</p>
                  <p className="font-bold text-slate-900 dark:text-white text-2xl">{currentPeriod}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold tracking-widest">Tanggal Hari Ini</p>
                  <p className="font-bold text-slate-900 dark:text-white text-2xl">{currentDay}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase text-primary tracking-wider">Info Billing</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                  Sistem otomatis menerbitkan tagihan setiap tanggal 1. Masa isolasi dimulai setelah tanggal 8.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
