"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, CreditCard, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  const stats = useLiveQuery(async () => {
    const customerCount = await db.customers.count();
    const packageCount = await db.packages.count();
    const pendingPayments = await db.payments.where('status').equals('pending').count();
    
    // Hitung Terisolir (Setelah tgl 9)
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
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Paket Aktif",
      value: stats.packages,
      icon: Package,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      title: "Pembayaran Menunggu",
      value: stats.pending,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pelanggan Terisolir",
      value: stats.isolated,
      icon: ShieldAlert,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Informasi</h1>
        <p className="text-slate-500">Ringkasan operasional layanan internet Anda hari ini.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2.5 rounded-xl`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-slate-100">
            <CardTitle className="text-lg">Aturan Masa Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm font-bold">9</div>
              <div>
                <h3 className="font-semibold text-rose-900">Batas Tanggal Pembayaran</h3>
                <p className="text-sm text-rose-700">Seluruh paket berakhir setiap tanggal 9. Pelanggan yang belum membayar setelah tanggal ini akan otomatis masuk daftar terisolir.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm font-bold">!</div>
              <div>
                <h3 className="font-semibold text-slate-900">Status Saat Ini</h3>
                <p className="text-sm text-slate-500">
                  Hari ini tanggal <strong>{currentDay}</strong>. {currentDay > 9 ? "Masa isolasi sedang berlangsung." : "Masih dalam masa tenggang pembayaran."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-slate-100">
            <CardTitle className="text-lg">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Database Lokal</span>
                </div>
                <Badge className="bg-green-600">Aktif</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 text-center">
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Periode</p>
                  <p className="font-bold text-slate-900">{currentPeriod}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 text-center">
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Mode</p>
                  <p className="font-bold text-slate-900">Penyaringan 9/Blm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
