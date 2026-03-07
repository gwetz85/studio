"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, User, Phone, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function CustomersPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  const customers = useLiveQuery(() => {
    if (!search) return db.customers.toArray();
    const s = search.toLowerCase();
    return db.customers
      .filter(c => 
        (c.name?.toLowerCase().includes(s) || false) || 
        (c.email?.toLowerCase().includes(s) || false) ||
        (c.phone?.includes(s) || false)
      )
      .toArray();
  }, [search]);

  const packages = useLiveQuery(() => db.packages.toArray());

  const handleOpenAddDialog = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as 'active' | 'passive' | 'inactive';
    
    // Logika deactivationDate: set jika status berubah menjadi Non-Aktif
    let deactivationDate = editingCustomer?.deactivationDate;
    if (newStatus === 'inactive' && editingCustomer?.status !== 'inactive') {
      deactivationDate = Date.now();
    } else if (newStatus !== 'inactive') {
      deactivationDate = undefined;
    }

    const data: Customer = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      packageId: Number(formData.get("packageId")),
      status: newStatus,
      createdAt: editingCustomer?.createdAt || Date.now(),
      deactivationDate: deactivationDate
    };

    try {
      if (editingCustomer?.id) {
        await db.customers.update(editingCustomer.id, data);
        toast({ title: "Profil diperbarui", description: "Data pelanggan telah berhasil disimpan." });
      } else {
        await db.customers.add(data);
        toast({ title: "Pelanggan baru terdaftar", description: "Pelanggan telah ditambahkan ke database." });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan data", description: "Terjadi kesalahan pada database lokal." });
    }
  };

  const deleteCustomer = async (id: number) => {
    if (confirm("Hapus pelanggan ini secara permanen? Seluruh riwayat tagihan akan ikut terhapus.")) {
      try {
        await db.transaction('rw', db.customers, db.payments, async () => {
          await db.customers.delete(id);
          await db.payments.where('customerId').equals(id).delete();
        });
        toast({ title: "Pelanggan dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus", description: "Terjadi kesalahan pada database." });
      }
    }
  };

  const getPackageName = (id: number) => {
    return packages?.find(p => p.id === id)?.name || "N/A";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daftar Pelanggan</h1>
          <p className="text-slate-500">Kelola data pelanggan dan status layanan mereka.</p>
        </div>
        <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {editingCustomer ? "Edit Profil Pelanggan" : "Registrasi Pelanggan Baru"}
            </DialogTitle>
          </DialogHeader>
          <form key={editingCustomer?.id || "new"} onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" name="name" defaultValue={editingCustomer?.name} placeholder="Contoh: Budi Santoso" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} placeholder="budi@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon / WA</Label>
                <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} placeholder="0812..." required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input id="address" name="address" defaultValue={editingCustomer?.address} placeholder="Jl. Merdeka No. 10..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageId">Pilih Paket Internet</Label>
                <Select name="packageId" defaultValue={editingCustomer?.packageId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id!.toString()}>
                        {pkg.name} (Rp {pkg.price.toLocaleString('id-ID')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Layanan</Label>
                <Select name="status" defaultValue={editingCustomer?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="passive">Pasif</SelectItem>
                    <SelectItem value="inactive">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingCustomer?.status === 'inactive' && editingCustomer.deactivationDate && (
              <p className="text-[10px] text-rose-500 italic">
                * Pelanggan ini akan dihapus otomatis pada tanggal {new Date(editingCustomer.deactivationDate + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}.
              </p>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingCustomer ? "Simpan Perubahan" : "Daftarkan Sekarang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari berdasarkan nama, email, atau nomor telepon..." 
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
                  <TableHead className="py-4 px-6">Identitas Pelanggan</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kontak & Alamat</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {customer.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{customer.name}</span>
                          <span className="text-xs text-slate-500">{customer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600">
                        {getPackageName(customer.packageId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          customer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 
                          customer.status === 'passive' ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' :
                          'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                        }
                      >
                        {customer.status === 'active' ? 'Aktif' : 
                         customer.status === 'passive' ? 'Pasif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {customer.phone}</div>
                        <div className="flex items-center gap-1.5 max-w-[200px] truncate"><MapPin className="h-3 w-3" /> {customer.address}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:text-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDialog(customer);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:text-rose-600" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (customer.id) deleteCustomer(customer.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!customers?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>{search ? "Pencarian tidak ditemukan." : "Database pelanggan masih kosong."}</p>
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
