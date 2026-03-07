"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type PSBRequest, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, UserPlus, Phone, MapPin, Cpu } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export default function PSBPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPSB, setEditingPSB] = React.useState<PSBRequest | null>(null);

  const psbRequests = useLiveQuery(() => {
    if (!search) return db.psb.toArray();
    const s = search.toLowerCase();
    return db.psb
      .filter(p => 
        (p.name?.toLowerCase().includes(s) || false) || 
        (p.phone?.includes(s) || false) ||
        (p.modemSnMac?.toLowerCase().includes(s) || false)
      )
      .toArray();
  }, [search]);

  const packages = useLiveQuery(() => db.packages.toArray());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as 'pasif' | 'aktif';
    const data: PSBRequest = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      modemSnMac: formData.get("modemSnMac") as string,
      packageId: Number(formData.get("packageId")),
      status: status,
      createdAt: editingPSB?.createdAt || Date.now(),
    };

    try {
      if (status === 'aktif') {
        const customerData: Customer = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          modemSnMac: data.modemSnMac,
          packageId: data.packageId,
          status: 'active',
          createdAt: Date.now(),
        };
        await db.customers.add(customerData);
        
        if (editingPSB?.id) {
          await db.psb.delete(editingPSB.id);
        }
        toast({ title: "Aktivasi Berhasil", description: "Data telah dipindahkan ke daftar Pelanggan Aktif." });
      } else {
        if (editingPSB?.id) {
          await db.psb.update(editingPSB.id, data);
          toast({ title: "Data PSB Diperbarui" });
        } else {
          await db.psb.add(data);
          toast({ title: "Permintaan PSB Terdaftar", description: "Status saat ini: Pasif." });
        }
      }
      setIsDialogOpen(false);
      setEditingPSB(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan" });
    }
  };

  const deletePSB = async (id: number) => {
    if (confirm("Hapus permintaan PSB ini?")) {
      try {
        await db.psb.delete(id);
        toast({ title: "Data dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pasang Sambungan Baru (PSB)</h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola permintaan pemasangan internet baru.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={() => setEditingPSB(null)}>
              <Plus className="mr-2 h-4 w-4" /> Input PSB Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
            <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <DialogTitle className="text-xl flex items-center gap-2 dark:text-white">
                <UserPlus className="h-5 w-5 text-primary" />
                {editingPSB ? "Edit Permintaan PSB" : "Input Permintaan PSB"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="dark:text-slate-200">Nama Calon Pelanggan</Label>
                  <Input id="name" name="name" defaultValue={editingPSB?.name} placeholder="Nama Lengkap" required className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingPSB?.email} placeholder="email@contoh.com" required className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-slate-200">Nomor Telepon</Label>
                  <Input id="phone" name="phone" defaultValue={editingPSB?.phone} placeholder="0812..." required className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="modemSnMac" className="dark:text-slate-200">SN / MAC Modem</Label>
                  <Input id="modemSnMac" name="modemSnMac" defaultValue={editingPSB?.modemSnMac} placeholder="SN Modem / Alamat MAC" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="dark:text-slate-200">Alamat Pemasangan</Label>
                  <Input id="address" name="address" defaultValue={editingPSB?.address} placeholder="Alamat lengkap..." required className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageId" className="dark:text-slate-200">Paket Yang Diminta</Label>
                  <Select name="packageId" defaultValue={editingPSB?.packageId?.toString()}>
                    <SelectTrigger className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
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
                  <Label htmlFor="status" className="dark:text-slate-200">Status PSB</Label>
                  <Select name="status" defaultValue={editingPSB?.status || "pasif"}>
                    <SelectTrigger className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pasif">Pasif (Menunggu)</SelectItem>
                      <SelectItem value="aktif">Aktif (Pasang & Aktivasi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="dark:text-slate-400">Batal</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingPSB ? "Simpan Perubahan" : "Daftarkan PSB"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari berdasarkan nama, telepon, atau modem..." 
          className="border-none shadow-none focus-visible:ring-0 text-slate-600 dark:text-slate-300 bg-transparent" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900">
        <ScrollArea className="w-full">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="py-4 px-6 dark:text-slate-400">Calon Pelanggan</TableHead>
                  <TableHead className="dark:text-slate-400">Paket Diminta</TableHead>
                  <TableHead className="dark:text-slate-400">Status</TableHead>
                  <TableHead className="dark:text-slate-400">Modem & Alamat</TableHead>
                  <TableHead className="text-right px-6 dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {psbRequests?.map((request) => (
                  <TableRow key={request.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                    <TableCell className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-white">{request.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{request.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {getPackageName(request.packageId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">PASIF</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-mono"><Cpu className="h-3 w-3" /> {request.modemSnMac || "-"}</div>
                        <div className="flex items-center gap-1.5 max-w-[200px] truncate"><MapPin className="h-3 w-3" /> {request.address}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20" 
                          title="Edit & Aktivasi" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPSB(request);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                          title="Hapus" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (request.id) deletePSB(request.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!psbRequests?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <UserPlus className="h-8 w-8 opacity-20" />
                        <p>Tidak ada permintaan PSB yang menunggu.</p>
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