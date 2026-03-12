
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Package, CreditCard, ShieldAlert, Wifi, Laptop, Smartphone, Cpu as CpuIcon, Network, HardDrive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

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
  const db = useFirestore();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [deviceInfo, setDeviceInfo] = React.useState({ 
    os: "Mendeteksi...", type: "Desktop", name: "PC", connection: "Checking...", storage: "...", memory: "..." 
  });

  const customersQuery = useMemoFirebase(() => collection(db, "customers"), [db]);
  const { data: customers } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => collection(db, "servicePackages"), [db]);
  const { data: packages } = useCollection(packagesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    return query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod));
  }, [db, currentPeriod]);
  const { data: invoices } = useCollection(invoicesQuery);

  React.useEffect(() => {
    const welcomeShown = sessionStorage.getItem("mtnet_welcome_shown");
    if (!welcomeShown) {
      setShowWelcome(true);
      sessionStorage.setItem("mtnet_welcome_shown", "true");
    }

    // Mock tech detection
    const detect = async () => {
      const conn = (navigator as any).connection?.effectiveType || "Wi-Fi";
      const mem = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "N/A";
      setDeviceInfo(prev => ({ ...prev, connection: conn, memory: mem }));
    };
    detect();
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
            <DialogTitle className="text-xl font-black">MTNET ONLINE</DialogTitle>
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
          <CardHeader><CardTitle className="text-lg">Info Sistem</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
               <span className="text-xs font-bold text-green-700">CLOUD DATABASE</span>
               <Badge className="bg-green-600">CONNECTED</Badge>
            </div>
            <div className="p-3 border rounded-xl space-y-2">
              <div className="flex justify-between text-xs"><span>OS:</span> <b>{deviceInfo.os}</b></div>
              <div className="flex justify-between text-xs"><span>Koneksi:</span> <b>{deviceInfo.connection}</b></div>
              <div className="flex justify-between text-xs"><span>Periode:</span> <b>{currentPeriod}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
