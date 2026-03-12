
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, UserPlus, Eye, FileText, Printer, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"

export default function PSBPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { role } = useAuth();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [editingPSB, setEditingPSB] = React.useState<any | null>(null);
  const [viewingPSB, setViewingPSB] = React.useState<any | null>(null);
  const [showContract, setShowContract] = React.useState(false);
  const [activeContractData, setActiveContractData] = React.useState<any>(null);

  const psbQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "psbRequests");
  }, [db, user]);
  const { data: psbRequestsRaw } = useCollection(psbQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const psbRequests = React.useMemo(() => {
    if (!psbRequestsRaw) return [];
    if (!search) return psbRequestsRaw;
    const s = search.toLowerCase();
    return psbRequestsRaw.filter(p => 
      p.name?.toLowerCase().includes(s) || 
      p.phone?.includes(s) ||
      p.modemSnMac?.toLowerCase().includes(s)
    );
  }, [psbRequestsRaw, search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as string;
    const pkgId = formData.get("packageId") as string;
    const pkg = packages?.find(p => p.id === pkgId);

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      modemSnMac: formData.get("modemSnMac") as string,
      packageId: pkgId,
      status: status,
      updatedAt: Date.now()
    };

    try {
      if (status === 'aktif') {
        if (role !== 'admin') {
          toast({ variant: "destructive", title: "Hanya Admin yang dapat melakukan Aktivasi" });
          return;
        }
        const customerData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          modemSnMac: data.modemSnMac,
          packageId: data.packageId,
          status: 'active',
          createdAt: Date.now(),
        };
        
        const docRef = await addDoc(collection(db, "customers"), customerData);
        if (editingPSB?.id) await deleteDoc(doc(db, "psbRequests", editingPSB.id));

        setActiveContractData({
          ...customerData,
          id: docRef.id,
          packageName: pkg?.name,
          packageSpeed: pkg?.speed,
          packagePrice: pkg?.price
        });

        toast({ title: "Aktivasi Berhasil" });
        setIsDialogOpen(false);
        setTimeout(() => setShowContract(true), 500);
      } else {
        if (editingPSB?.id) {
          if (role !== 'admin') {
            toast({ variant: "destructive", title: "Hanya Admin yang dapat mengubah data" });
            return;
          }
          await updateDoc(doc(db, "psbRequests", editingPSB.id), data);
        } else {
          await addDoc(collection(db, "psbRequests"), { ...data, createdAt: Date.now() });
          toast({ title: "Permintaan PSB Berhasil Dikirim" });
        }
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan" });
    }
  };

  const getPackageName = (id: string) => packages?.find(p => p.id === id)?.name || "N/A";

  const handlePrintContract = () => {
    const printContent = document.getElementById('contract-print-area');
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pasang Sambungan Baru (PSB)</h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola permintaan pemasangan internet baru.</p>
        </div>
        <Button onClick={() => { setEditingPSB(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Input PSB Baru
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800 border-b">
            <DialogTitle>{editingPSB ? "Edit & Aktivasi PSB" : "Input Permintaan PSB"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" defaultValue={editingPSB?.name} placeholder="Nama" required className="sm:col-span-2" />
                <Input name="email" type="email" defaultValue={editingPSB?.email} placeholder="Email" required />
                <Input name="phone" defaultValue={editingPSB?.phone} placeholder="Telepon" required />
                <Input name="modemSnMac" defaultValue={editingPSB?.modemSnMac} placeholder="SN/MAC Modem" className="sm:col-span-2" />
                <Input name="address" defaultValue={editingPSB?.address} placeholder="Alamat" required className="sm:col-span-2" />
                <Select name="packageId" defaultValue={editingPSB?.packageId}>
                  <SelectTrigger><SelectValue placeholder="Pilih Paket" /></SelectTrigger>
                  <SelectContent>
                    {packages?.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select name="status" defaultValue={editingPSB?.status || "pasif"} disabled={role !== 'admin'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasif">Pasif</SelectItem>
                    <SelectItem value="aktif">Aktif & Aktivasi</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="px-6">Calon Pelanggan</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {psbRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="px-6">
                    <div className="font-bold">{request.name}</div>
                    <div className="text-xs text-slate-500">{request.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{getPackageName(request.packageId)}</Badge></TableCell>
                  <TableCell><Badge className="bg-amber-100 text-amber-700">PASIF</Badge></TableCell>
                  <TableCell className="text-right px-6">
                    {role === 'admin' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPSB(request); setIsDialogOpen(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-rose-600" onClick={async () => {
                          if(confirm("Hapus?")) await deleteDoc(doc(db, "psbRequests", request.id));
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={showContract} onOpenChange={setShowContract}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 bg-slate-100 flex flex-row justify-between no-print">
            <DialogTitle>Kontrak Berlangganan</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePrintContract}><Printer className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setShowContract(false)}><X className="h-4 w-4" /></Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div id="contract-print-area" className="p-12 text-sm leading-relaxed">
               {activeContractData && (
                 <div className="space-y-6">
                    <h1 className="text-center text-xl font-bold uppercase underline">Surat Perjanjian Berlangganan</h1>
                    <p>Nama: {activeContractData.name}</p>
                    <p>Alamat: {activeContractData.address}</p>
                    <p>Layanan: {activeContractData.packageName}</p>
                    <p>Harga: Rp {activeContractData.packagePrice?.toLocaleString('id-ID')}</p>
                    <div className="pt-8 grid grid-cols-2 text-center">
                       <div>PENYEDIA</div>
                       <div>PELANGGAN</div>
                    </div>
                 </div>
               )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
