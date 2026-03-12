
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, RotateCcw, Eye, UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function InactiveUsersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [search, setSearch] = React.useState("");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [viewingCustomer, setViewingCustomer] = React.useState<any | null>(null);

  const inactiveQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "customers"), where("status", "==", "inactive"));
  }, [db, user]);
  const { data: inactiveCustomersRaw } = useCollection(inactiveQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const filteredInactive = React.useMemo(() => {
    if (!inactiveCustomersRaw) return [];
    if (!search) return inactiveCustomersRaw;
    const s = search.toLowerCase();
    return inactiveCustomersRaw.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s)
    );
  }, [inactiveCustomersRaw, search]);

  const handleRestore = async (customer: any) => {
    try {
      await updateDoc(doc(db, "customers", customer.id), { status: 'active', deactivationDate: null });
      toast({ title: "User Diaktifkan Kembali" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Nonaktif</h1>
          <p className="text-slate-500">Arsip pelanggan yang telah diputus.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input placeholder="Cari arsip..." className="border-none shadow-none focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-6">Identitas</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInactive.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="px-6 font-semibold">{customer.name}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleRestore(customer)} className="mr-2"><RotateCcw className="mr-1 h-3 w-3" /> Aktifkan</Button>
                    <Button variant="ghost" size="icon" className="text-rose-600" onClick={async () => {
                       if(confirm("Hapus Permanen?")) await deleteDoc(doc(db, "customers", customer.id));
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
