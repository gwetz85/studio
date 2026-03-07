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
        toast({ title: "Package updated successfully" });
      } else {
        await db.packages.add(data);
        toast({ title: "Package added successfully" });
      }
      setIsDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save package" });
    }
  };

  const deletePackage = async (id: number) => {
    if (confirm("Are you sure you want to delete this package?")) {
      await db.packages.delete(id);
      toast({ title: "Package deleted" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Service Packages</h1>
          <p className="text-muted-foreground">Manage your internet plan offerings.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditingPackage(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input id="name" name="name" defaultValue={editingPackage?.name} required placeholder="e.g. Basic Home" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Monthly)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingPackage?.price} required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed</Label>
                  <Input id="speed" name="speed" defaultValue={editingPackage?.speed} required placeholder="e.g. 20 Mbps" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={editingPackage?.description} placeholder="Short plan details" />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/80">
                  {editingPackage ? "Update Package" : "Save Package"}
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
                <TableHead>Name</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    No packages defined yet. Add your first service package to get started.
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