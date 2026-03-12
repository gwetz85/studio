
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, updateDoc, addDoc, query, where } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, CreditCard, CheckCircle2, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function IsolatedPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();
  const isAfterCutoff = currentDay > 8;

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "customers"), where("status", "==", "active"));
  }, [db, user]);
  const { data: allCustomers } = useCollection(customersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod));
  }, [db, currentPeriod, user]);
  const { data: currentPayments } = useCollection(invoicesQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const isolatedCustomers = React.useMemo(() => {
    if (!isAfterCutoff || !allCustomers || !currentPayments) return [];
    return allCustomers.filter(customer => {
      const payment = currentPayments.find(p => p.customerId === customer.id);
      return !payment || payment.status !== 'paid';
    });
  }, [allCustomers, currentPayments, isAfterCutoff]);

  const handleQuickPay = async (customer: any) => {
    const pkg = packages?.find(p => p.id === customer.packageId);
    const existingPayment = currentPayments?.find(p => p.customerId === customer.id);

    try {
      if (existingPayment) {
        await updateDoc(doc(db, "invoices", existingPayment.id!), { status: 'paid', paymentDate: Date.now() });
      } else {
        await addDoc(collection(db, "invoices"), {
          customerId: customer.id,
          amount: pkg?.price || 0,
          billingPeriod: currentPeriod,
          status: 'paid',
          paymentDate: Date.now()
        });
      }
      toast({ title: "Pelanggan Aktif Kembali" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal" });
    }
  };

  const handleDeactivate = async (customer: any) => {
    if (confirm("Nonaktifkan layanan?")) {
      try {
        await updateDoc(doc(db, "customers", customer.id), { status: 'inactive', deactivationDate: Date.now() });
        toast({ title: "Berhasil" });
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal" });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-600" />
        <h1 className="text-3xl font-bold">User Terisolir</h1>
      </div>

      {!isAfterCutoff ? (
        <Card className="p-12 text-center bg-amber-50">Belum Memasuki Masa Isolasi (Setelah tanggal 8).</Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-6">Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right px-6">Ubah Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isolatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="px-6 font-semibold">{customer.name}</TableCell>
                    <TableCell><Badge className="bg-rose-600">TERISOLIR</Badge></TableCell>
                    <TableCell className="text-right px-6">
                       <Button size="sm" variant="outline" onClick={() => handleQuickPay(customer)} className="mr-2">Bayar & Aktifkan</Button>
                       <Button size="icon" variant="ghost" onClick={() => handleDeactivate(customer)} className="text-rose-500"><UserX /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
