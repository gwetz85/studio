"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, CreditCard, AlertCircle } from "lucide-react"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"

export default function Dashboard() {
  const stats = useLiveQuery(async () => {
    const customerCount = await db.customers.count();
    const packageCount = await db.packages.count();
    const pendingPayments = await db.payments.where('status').equals('pending').count();
    const overduePayments = await db.payments.where('status').equals('overdue').count();
    
    return {
      customers: customerCount,
      packages: packageCount,
      pending: pendingPayments,
      overdue: overduePayments,
    }
  }, []);

  if (!stats) return null;

  const dashboardItems = [
    {
      title: "Total Pelanggan",
      value: stats.customers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Paket Aktif",
      value: stats.packages,
      icon: Package,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Pembayaran Menunggu",
      value: stats.pending,
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Peringatan Terlambat",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Informasi</h1>
        <p className="text-muted-foreground">Selamat datang di NetInvoice Luring. Berikut adalah ringkasan layanan internet Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2 rounded-lg`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Panduan Mulai Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-secondary">
              <h3 className="font-semibold text-primary mb-1">Langkah 1: Tentukan Paket</h3>
              <p className="text-sm text-muted-foreground">Buka Paket Layanan untuk mengatur rencana internet dan harga Anda.</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-secondary">
              <h3 className="font-semibold text-primary mb-1">Langkah 2: Tambah Pelanggan</h3>
              <p className="text-sm text-muted-foreground">Daftarkan pelanggan Anda dan tetapkan paket di tab Pelanggan.</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-secondary">
              <h3 className="font-semibold text-primary mb-1">Langkah 3: Pantau Pembayaran</h3>
              <p className="text-sm text-muted-foreground">Catat pembayaran bulanan dan tangani pengingat tunggakan menggunakan alat AI kami.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Kesehatan Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status Penyimpanan</span>
                <span className="text-sm font-bold text-green-600">Sinkron (Lokal)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Basis Data</span>
                <span className="text-sm font-bold">IndexedDB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cadangan Terakhir</span>
                <span className="text-sm font-bold text-muted-foreground">Belum Pernah</span>
              </div>
              <p className="text-xs text-muted-foreground pt-4 border-t">
                Data Anda disimpan dengan aman di basis data peramban ini. Data tetap tersedia meskipun Anda sedang luring.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
