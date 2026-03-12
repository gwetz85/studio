
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Wifi, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function PackagesPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<any | null>(null);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      speed: formData.get("speed") as string,
      description: formData.get("description") as string,
    };

    try {
      if (editingPackage?.id) {
        await updateDoc(doc(db, "servicePackages", editingPackage.id), data);
        toast({ title: "Paket diperbarui" });
      } else {
        await addDoc(collection(db, "servicePackages"), data);
        toast({ title: "Paket baru ditambahkan" });
      }
      setIsDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan" });
    }
  };

  const deletePackage = async (id: string) => {
    if (confirm("Hapus paket layanan ini? Pelanggan yang menggunakan paket ini mungkin terdampak.")) {
      try {
        await deleteDoc(doc(db, "servicePackages", id));
        toast({ title: "Paket telah dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Paket Layanan</h1>
          <p className="text-slate-500">Atur paket internet dan skema harga untuk pelanggan Anda.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={() => setEditingPackage(null)}>
              <Plus className="mr-2 h-4 w-4" /> Buat Paket Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                {editingPackage ? "Konfigurasi Paket" : "Tambah Paket Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket</Label>
                <Input id="name" name="name" defaultValue={editingPackage?.name} required placeholder="Contoh: Home Ultra 50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Bulanan)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingPackage?.price} required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Kecepatan</Label>
                  <Input id="speed" name="speed" defaultValue={editingPackage?.speed} required placeholder="Contoh: 50 Mbps" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <Input id="description" name="description" defaultValue={editingPackage?.description} placeholder="Contoh: Cocok untuk keluarga 4 orang" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">
                  {editingPackage ? "Perbarui Paket" : "Simpan Paket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 px-6">Nama Paket</TableHead>
                  <TableHead>Kecepatan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="max-w-xs">Deskripsi</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.map((pkg) => (
                  <TableRow key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6 font-semibold text-slate-900">{pkg.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-primary border-primary/20 bg-primary/5">
                        <Zap className="h-3 w-3 mr-1" /> {pkg.speed}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-700">Rp {pkg.price.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-slate-500 max-w-xs truncate">{pkg.description || "-"}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingPackage(pkg);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-rose-600"
                          onClick={() => deletePackage(pkg.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  )
}
