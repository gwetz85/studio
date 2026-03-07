"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Customer, type ServicePackage } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function CustomersPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  const customers = useLiveQuery(() => {
    if (!search) return db.customers.toArray();
    return db.customers
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
      .toArray();
  }, [search]);

  const packages = useLiveQuery(() => db.packages.toArray());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Customer = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      packageId: Number(formData.get("packageId")),
      status: formData.get("status") as 'active' | 'inactive',
      createdAt: editingCustomer?.createdAt || Date.now(),
    };

    try {
      if (editingCustomer?.id) {
        await db.customers.update(editingCustomer.id, data);
        toast({ title: "Customer updated" });
      } else {
        await db.customers.add(data);
        toast({ title: "Customer added" });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save customer" });
    }
  };

  const deleteCustomer = async (id: number) => {
    if (confirm("Delete this customer? This will not delete their payment history.")) {
      await db.customers.delete(id);
      toast({ title: "Customer removed" });
    }
  };

  const getPackageName = (id: number) => {
    return packages?.find(p => p.id === id)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Customers</h1>
          <p className="text-muted-foreground">Manage your subscriber base.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditingCustomer(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={editingCustomer?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Service Address</Label>
                <Input id="address" name="address" defaultValue={editingCustomer?.address} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageId">Internet Package</Label>
                <Select name="packageId" defaultValue={editingCustomer?.packageId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id!.toString()}>{pkg.name} (${pkg.price})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingCustomer?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="col-span-2 mt-4">
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/80">
                  {editingCustomer ? "Update Profile" : "Create Profile"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search by name or email..." 
          className="border-none shadow-none focus-visible:ring-0" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {getPackageName(customer.packageId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className={customer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{customer.phone}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(customer); setIsDialogOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCustomer(customer.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!customers?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    {search ? "No customers match your search." : "No customers registered yet."}
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