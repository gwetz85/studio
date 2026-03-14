"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Package, CreditCard, ShieldAlert, Clock, CalendarDays, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [deviceInfo, setDeviceInfo] = React.useState({ 
    os: "Mendeteksi...", type: "Desktop", connection: "Checking...", memory: "..." 
  });
  
  // Real-time clock state
  const [serverTime, setServerTime] = React.useState<{ time: string; date: string } | null>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customers");
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod));
  }, [db, currentPeriod, user]);
  const { data: invoices } = useCollection(invoicesQuery);

  React.useEffect(() => {
    const welcomeShown = sessionStorage.getItem("mtnet_welcome_shown");
    if (!welcomeShown) {
      setShowWelcome(true);
      sessionStorage.setItem("mtnet_welcome_shown", "true");
    }

    const detect = async () => {
      const conn = (navigator as any).connection?.effectiveType || "Wi-Fi";
      const mem = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "N/A";
      setDeviceInfo(prev => ({ ...prev, connection: conn, memory: mem }));
    };
    detect();

    // Timer for real-time clock
    const timer = setInterval(() => {
      const now = new Date();
      setServerTime({
        time: format(now, "HH:mm:ss", { locale: localeId }),
        date: format(now, "EEEE, dd MMMM yyyy", { locale: localeId })
      });
    }, 1000);
    
    // Set initial value
    const now = new Date();
    setServerTime({
      time: format(now, "HH:mm:ss", { locale: localeId }),
      date: format(now, "EEEE, dd MMMM yyyy", { locale: localeId })
    });

    return () => clearInterval(timer);
  }, []);

  const stats = React.useMemo(() => {
    if (!customers || !invoices) return null;
    const active = customers.filter(c => c.status === 'active');
    const isolated = currentDay > 8 ? active.filter(c => {
      const inv = invoices.find(i => i.customerId === c.id);
      return !inv || inv.status !== 'paid';
    }).length : 0;

    return {
      total: customers.length,
      active: active.length,
      passive: customers.filter(c => c.status === 'passive').length,
      inactive: customers.filter(c => c.status === 'inactive').length,
      packages: packages?.length || 0,
      pending: invoices.filter(i => i.status !== 'paid').length,
      isolated,
    };
  }, [customers, invoices, packages, currentDay]);

  if (!stats) return <div className="flex h-96 items-center justify-center animate-pulse">Memuat Data Cloud...</div>;

  const chartData = [
    { name: "Aktif", value: stats.active, fill: "hsl(var(--primary))" },
    { name: "Pasif", value: stats.passive, fill: "hsl(var(--accent))" },
    { name: "Non-Aktif", value: stats.inactive, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="bg-primary p-6 text-white text-center">
            <DialogTitle className="text-xl font-black">MTNET SYSTEM APLIKASI</DialogTitle>
            <DialogDescription className="text-white/80">Sistem Manajemen Real-time Cloud</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-center mb-4 italic">Akses database online aktif. Semua perubahan akan disinkronkan ke seluruh tim.</p>
            <Button onClick={() => setShowWelcome(false)} className="w-full">Masuk</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Pelanggan", val: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Paket Layanan", val: stats.packages, icon: Package, color: "text-cyan-600", bg: "bg-cyan-50" },
          { title: "Tagihan Pending", val: stats.pending, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "User Terisolir", val: stats.isolated, icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((item) => (
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2 rounded-lg`}><item.icon className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{item.val}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg">Statistik Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Info Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Server */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
               <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider">Status Server</span>
               <Badge className="bg-green-600 hover:bg-green-600 shadow-sm border-none text-[10px]">CONNECTED</Badge>
            </div>

            {/* Real-time Clock & Date */}
            <div className="p-4 rounded-xl bg-slate-900 dark:bg-black text-white space-y-1 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Server Real-time</span>
                <Clock className="h-3 w-3 text-primary animate-pulse" />
              </div>
              {serverTime ? (
                <>
                  <div className="text-2xl font-black font-mono tracking-tighter tabular-nums text-primary">
                    {serverTime.time}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    {serverTime.date}
                  </div>
                </>
              ) : (
                <div className="h-10 animate-pulse bg-slate-800 rounded mt-2" />
              )}
            </div>

            {/* Info Details */}
            <div className="p-3 border rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Batas Pembayaran:</span>
                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 font-black h-5">
                  Tgl 8 / Bln
                </Badge>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Koneksi Perangkat:</span> 
                <b className="text-slate-900 dark:text-slate-200 uppercase">{deviceInfo.connection}</b>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Periode Berjalan:</span> 
                <b className="text-slate-900 dark:text-slate-200 uppercase">{currentPeriod}</b>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
