"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type ServicePackage } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Wifi } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function PackagesPage() {
  const { toast } = useToast();
  const packages = useLiveQuery(() => db.packages.toArray());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState<ServicePackage | null>(null);

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
        await db.packages.update(editingPackage.id, data);
        toast({ title: "Paket berhasil diperbarui" });
      } else {
        await db.packages.add(data);
        toast({ title: "Paket berhasil ditambahkan" });
      }
      setIsDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan paket" });
    }
  };

  const deletePackage = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus paket ini?")) {
      await db.packages.delete(id);
      toast({ title: "Paket dihapus" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Paket Layanan</h1>
          <p className="text-muted-foreground">Kelola penawaran rencana internet Anda.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditingPackage(null)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Paket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Edit Paket" : "Tambah Paket Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket</Label>
                <Input id="name" name="name" defaultValue={editingPackage?.name} required placeholder="misal: Home Basic" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Bulanan)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingPackage?.price} required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Kecepatan</Label>
                  <Input id="speed" name="speed" defaultValue={editingPackage?.speed} required placeholder="misal: 20 Mbps" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" name="description" defaultValue={editingPackage?.description} placeholder="Detail singkat paket" />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/80">
                  {editingPackage ? "Perbarui Paket" : "Simpan Paket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kecepatan</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages?.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.speed}</TableCell>
                  <TableCell>${pkg.price.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{pkg.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPackage(pkg); setIsDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePackage(pkg.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!packages?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Belum ada paket yang ditentukan. Tambahkan paket layanan pertama Anda untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
