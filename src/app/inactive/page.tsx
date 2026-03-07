"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, UserX, RotateCcw, Phone, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function InactiveUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");

  const inactiveCustomers = useLiveQuery(() => {
    const query = db.customers.where('status').equals('inactive');
    if (!search) return query.toArray();
    const s = search.toLowerCase();
    return query.filter(c => 
      (c.name?.toLowerCase().includes(s) || false) || 
      (c.phone?.includes(s) || false)
    ).toArray();
  }, [search]);

  const packages = useLiveQuery(() => db.packages.toArray());

  const getPackageName = (id: number) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  const handleRestore = async (customer: Customer) => {
    if (!customer.id) return;
    try {
      await db.customers.update(customer.id, { 
        status: 'active',
        deactivationDate: undefined 
      });
      toast({ 
        title: "Pelanggan Diaktifkan Kembali", 
        description: `${customer.name} kini kembali ke daftar Pelanggan Aktif.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mengaktifkan" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.transaction('rw', db.customers, db.payments, async () => {
        await db.customers.delete(id);
        await db.payments.where('customerId').equals(id).delete();
      });
      toast({ title: "Data Dihapus Permanen" });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menghapus" });
    }
  };

  const handleResetAll = async () => {
    const inactiveOnes = await db.customers.where('status').equals('inactive').toArray();
    if (inactiveOnes.length === 0) return;

    try {
      await db.transaction('rw', db.customers, db.payments, async () => {
        for (const customer of inactiveOnes) {
          if (customer.id) {
            await db.customers.delete(customer.id);
            await db.payments.where('customerId').equals(customer.id).delete();
          }
        }
      });
      toast({ title: "Semua Data Nonaktif Direset" });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mereset data" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Nonaktif</h1>
          <p className="text-slate-500">Daftar pelanggan yang telah dinonaktifkan dari sistem.</p>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!inactiveCustomers?.length}>
              <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Semua Data Nonaktif?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus seluruh pelanggan di daftar ini secara permanen dari database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll} className="bg-rose-600 hover:bg-rose-700">
                Ya, Reset Sekarang
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari berdasarkan nama atau nomor telepon..." 
          className="border-none shadow-none focus-visible:ring-0 text-slate-600 bg-transparent" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 px-6">Pelanggan</TableHead>
                  <TableHead>Paket Terakhir</TableHead>
                  <TableHead>Kontak & Alamat</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
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
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {customer.phone}</div>
                        <div className="flex items-center gap-1.5 max-w-[200px] truncate"><MapPin className="h-3 w-3" /> {customer.address}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs border-primary text-primary hover:bg-primary/5"
                          onClick={() => handleRestore(customer)}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" /> Aktifkan
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50" 
                          onClick={() => customer.id && handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!inactiveCustomers?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-8 w-8 opacity-20" />
                        <p>Tidak ada user nonaktif saat ini.</p>
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
    </div>
  )
}
