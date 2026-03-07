"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Customer, type Payment } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, Phone, MapPin, CreditCard, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function IsolatedPage() {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const isAfterCutoff = currentDay > 9;

  const isolatedCustomers = useLiveQuery(async () => {
    if (!isAfterCutoff) return [];

    const allCustomers = await db.customers.where('status').equals('active').toArray();
    const currentPayments = await db.payments.where('billingPeriod').equals(currentPeriod).toArray();
    
    // Pelanggan terisolir adalah mereka yang:
    // 1. Status Aktif
    // 2. Belum melakukan pembayaran 'paid' untuk periode ini
    return allCustomers.filter(customer => {
      const payment = currentPayments.find(p => p.customerId === customer.id);
      return !payment || payment.status !== 'paid';
    });
  }, [currentPeriod, isAfterCutoff]);

  const packages = useLiveQuery(() => db.packages.toArray());

  const getPackageName = (id: number) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Terisolir</h1>
        </div>
        <p className="text-slate-500">
          Daftar pelanggan aktif yang belum melunasi tagihan periode <strong>{currentPeriod}</strong> setelah melewati batas tanggal 9.
        </p>
      </div>

      {!isAfterCutoff ? (
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="pt-6 text-center space-y-2">
            <Clock className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="font-semibold text-amber-900">Belum Memasuki Masa Isolasi</h3>
            <p className="text-sm text-amber-700">
              Isolasi otomatis akan aktif setelah tanggal 9 setiap bulannya. Saat ini tanggal {currentDay}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <ScrollArea className="w-full">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-4 px-6">Pelanggan</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right px-6">Status Akses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isolatedCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-rose-50/30 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          {getPackageName(customer.packageId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[200px] truncate">
                          <MapPin className="h-3 w-3" /> {customer.address}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Badge className="bg-rose-600 hover:bg-rose-700">TERISOLIR</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {isolatedCustomers && isolatedCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard className="h-8 w-8 opacity-20" />
                          <p>Tidak ada pelanggan yang terisolir untuk periode ini.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
