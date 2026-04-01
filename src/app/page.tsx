"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
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

function DigitalClock() {
  const [time, setTime] = React.useState<{ time: string; date: string } | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime({
        time: format(now, "HH:mm:ss", { locale: localeId }),
        date: format(now, "EEEE, dd MMMM yyyy", { locale: localeId })
      });
    }, 1000);
    
    // Set initial value
    const now = new Date();
    setTime({
      time: format(now, "HH:mm:ss", { locale: localeId }),
      date: format(now, "EEEE, dd MMMM yyyy", { locale: localeId })
    });

    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-8 animate-pulse bg-slate-800 rounded mt-2" />;

  return (
    <>
      <div className="text-lg md:text-2xl font-black font-mono tracking-tighter tabular-nums text-primary">
        {time.time}
      </div>
      <div className="text-[8px] md:text-[10px] font-medium text-slate-400">
        {time.date}
      </div>
    </>
  );
}

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [deviceInfo, setDeviceInfo] = React.useState({ 
    os: "Mendeteksi...", type: "Desktop", connection: "Checking...", memory: "..." 
  });

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "customers"), limit(1000));
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "invoices"), 
      where("billingPeriod", "==", currentPeriod),
      limit(1000)
    );
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
  }, []);

  const stats = React.useMemo(() => {
    if (!customers || !invoices) return null;
    
    // Create an invoice map by customerId for O(1) lookup
    const invoiceMap = new Map();
    invoices.forEach(inv => invoiceMap.set(inv.customerId, inv));

    const active = customers.filter(c => c.status === 'active');
    const isolated = currentDay > 8 ? active.filter(c => {
      const inv = invoiceMap.get(c.id);
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

  if (!stats) return <div className="flex h-96 items-center justify-center animate-pulse text-xs">Memuat Data Cloud...</div>;

  const chartData = React.useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Aktif", value: stats.active, fill: "hsl(var(--primary))" },
      { name: "Pasif", value: stats.passive, fill: "hsl(var(--accent))" },
      { name: "Non-Aktif", value: stats.inactive, fill: "hsl(var(--destructive))" },
    ];
  }, [stats]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="w-[90vw] sm:max-w-md p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="bg-primary p-6 md:p-8 text-white text-center">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight">MTNET SYSTEM APLIKASI</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] md:text-xs">Sistem Manajemen Real-time Cloud</DialogDescription>
          </DialogHeader>
          <div className="p-6 md:p-8">
            <p className="text-[10px] sm:text-xs text-center mb-6 italic text-slate-500 leading-relaxed">
              Akses database online aktif. Semua perubahan yang Anda buat akan langsung disinkronkan ke seluruh tim lapangan secara real-time.
            </p>
            <Button onClick={() => setShowWelcome(false)} className="w-full h-11 text-xs sm:text-sm font-bold shadow-lg">Masuk Ke Dasbor</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Pelanggan", val: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Paket Layanan", val: stats.packages, icon: Package, color: "text-cyan-600", bg: "bg-cyan-50" },
          { title: "Tagihan Pending", val: stats.pending, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "User Terisolir", val: stats.isolated, icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((item) => (
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3">
              <CardTitle className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-1 sm:p-1.5 rounded-md`}><item.icon className="h-3 w-3" /></div>
            </CardHeader>
            <CardContent className="p-3 pt-0"><div className="text-base sm:text-lg md:text-2xl font-black">{item.val}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="p-4"><CardTitle className="text-sm md:text-lg">Statistik Status</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px] sm:h-[200px] md:h-[300px]">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
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
          <CardHeader className="p-4">
            <CardTitle className="text-sm md:text-lg flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Info Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {/* Status Server */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
               <span className="text-[8px] md:text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider">Status Server</span>
               <Badge className="bg-green-600 hover:bg-green-600 shadow-sm border-none text-[8px] px-2 h-5">CONNECTED</Badge>
            </div>

            {/* Real-time Clock & Date */}
            <div className="p-3 rounded-xl bg-slate-900 dark:bg-black text-white space-y-1 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Server Time</span>
                <Clock className="h-3 w-3 text-primary animate-pulse" />
              </div>
              <DigitalClock />
            </div>

            {/* Info Details */}
            <div className="p-3 border rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center text-[9px] md:text-[11px]">
                <span className="text-slate-500 font-medium">Batas Bayar:</span>
                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[8px] md:text-[10px] font-black h-5">
                  Tgl 8 / Bln
                </Badge>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between text-[9px] md:text-[11px] text-slate-500">
                <span>Koneksi:</span> 
                <b className="text-slate-900 dark:text-slate-200 uppercase">{deviceInfo.connection}</b>
              </div>
              <div className="flex justify-between text-[9px] md:text-[11px] text-slate-500">
                <span>Periode:</span> 
                <b className="text-slate-900 dark:text-slate-200 uppercase">{currentPeriod}</b>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
