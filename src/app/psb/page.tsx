"use client"

import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type PSBRequest, type Customer } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Edit2, Search, UserPlus, Phone, MapPin, Cpu, Printer, FileText, Eye, User, Mail, Calendar, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default function PSBPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [editingPSB, setEditingPSB] = React.useState<PSBRequest | null>(null);
  const [viewingPSB, setViewingPSB] = React.useState<PSBRequest | null>(null);
  
  const [showContract, setShowContract] = React.useState(false);
  const [activeContractData, setActiveContractData] = React.useState<any>(null);

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

  const handleOpenView = (request: PSBRequest) => {
    setViewingPSB(request);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as 'pasif' | 'aktif';
    const pkgId = Number(formData.get("packageId"));
    const pkg = packages?.find(p => p.id === pkgId);

    const data: PSBRequest = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      modemSnMac: formData.get("modemSnMac") as string,
      packageId: pkgId,
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
        
        const newCustomerId = await db.customers.add(customerData);
        
        if (editingPSB?.id) {
          await db.psb.delete(editingPSB.id);
        }

        setActiveContractData({
          ...customerData,
          id: newCustomerId,
          packageName: pkg?.name,
          packageSpeed: pkg?.speed,
          packagePrice: pkg?.price
        });

        toast({ title: "Aktivasi Berhasil", description: "Pelanggan telah aktif. Menyiapkan surat kontrak..." });
        setIsDialogOpen(false);
        setEditingPSB(null);
        
        setTimeout(() => setShowContract(true), 500);
      } else {
        if (editingPSB?.id) {
          await db.psb.update(editingPSB.id, data);
          toast({ title: "Data PSB Diperbarui" });
        } else {
          await db.psb.add(data);
          toast({ title: "Permintaan PSB Terdaftar", description: "Status saat ini: Pasif." });
        }
        setIsDialogOpen(false);
        setEditingPSB(null);
      }
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

  const handlePrintContract = () => {
    const printContent = document.getElementById('contract-print-area');
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;
    
    document.body.innerHTML = printContents;
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto shadow-sm" onClick={() => setEditingPSB(null)}>
              <Plus className="mr-2 h-4 w-4" /> Input PSB Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800 border-b">
              <DialogTitle className="text-xl flex items-center gap-2 dark:text-white">
                <UserPlus className="h-5 w-5 text-primary" />
                {editingPSB ? "Edit & Aktivasi PSB" : "Input Permintaan PSB"}
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
                      <SelectItem value="aktif">Aktif (Aktivasi & Buat Kontrak)</SelectItem>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detail Data PSB
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {viewingPSB && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{viewingPSB.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3" /> {viewingPSB.email}
                    </p>
                  </div>
                </div>

                <Separator className="dark:bg-slate-800" />

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Kontak Person</Label>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="h-4 w-4 text-primary" /> {viewingPSB.phone}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Alamat Pemasangan</Label>
                    <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /> 
                      <span className="leading-relaxed">{viewingPSB.address}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Identitas Perangkat</Label>
                    <div className="flex items-center gap-2 text-primary font-mono font-bold">
                      <Cpu className="h-4 w-4" /> {viewingPSB.modemSnMac || "Belum ada SN/MAC"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Paket Diminta</Label>
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary w-fit">
                        {getPackageName(viewingPSB.packageId)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Status Antrian</Label>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 w-fit">
                        {viewingPSB.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <Label className="text-xs text-slate-500">Waktu Input</Label>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Calendar className="h-3.5 w-3.5" /> {format(new Date(viewingPSB.createdAt), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full">Tutup Pratinjau</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showContract} onOpenChange={setShowContract}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 bg-slate-100 dark:bg-slate-800 border-b flex flex-row items-center justify-between no-print">
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-primary" />
              Surat Perjanjian Berlangganan (Kontrak)
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowContract(false)}>
                <X className="h-4 w-4 mr-1" /> Tutup
              </Button>
              <Button size="sm" onClick={handlePrintContract}>
                <Printer className="h-4 w-4 mr-1" /> Cetak / PDF
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="h-[75vh]">
            <div id="contract-print-area" className="p-12 font-serif text-slate-900 bg-white leading-relaxed">
              {activeContractData && (
                <div className="max-w-3xl mx-auto space-y-6 text-justify">
                  <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-2xl font-bold uppercase underline">Surat Perjanjian Berlangganan Internet</h1>
                    <p className="text-sm font-bold">MTNET SYSTEM - SOLUSI INTERNET CEPAT & TERPERCAYA</p>
                    <p className="text-xs italic">Nomor Kontrak: MTNET/CONT/{activeContractData.id}/{format(new Date(), 'yyyyMM')}</p>
                  </div>

                  <p className="text-sm">
                    Pada hari ini, <strong>{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}</strong>, yang bertanda tangan di bawah ini:
                  </p>

                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Nama</span>
                      <span className="col-span-3">: {activeContractData.name}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Alamat</span>
                      <span className="col-span-3">: {activeContractData.address}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">No. Telepon</span>
                      <span className="col-span-3">: {activeContractData.phone}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span className="font-bold">Email</span>
                      <span className="col-span-3">: {activeContractData.email}</span>
                    </div>
                  </div>

                  <p className="text-sm">
                    Selanjutnya disebut sebagai <strong>"PELANGGAN"</strong>, dengan ini menyatakan setuju untuk berlangganan layanan internet dari <strong>MTNET SYSTEM</strong> (selanjutnya disebut "PENYEDIA") dengan ketentuan sebagai berikut:
                  </p>

                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold uppercase">Pasal 1: Lingkup Layanan</h4>
                      <p>PENYEDIA memberikan layanan akses internet kepada PELANGGAN dengan paket <strong>{activeContractData.packageName} ({activeContractData.packageSpeed})</strong> seharga <strong>Rp {activeContractData.packagePrice?.toLocaleString('id-ID')} /bulan</strong>.</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase">Pasal 2: Masa Kontrak & Pemutusan</h4>
                      <p><strong>2.1. Masa Minimal Berlangganan:</strong> PELANGGAN wajib berlangganan minimal selama <strong>6 (ENAM) BULAN</strong> sejak tanggal aktivasi.</p>
                      <p><strong>2.2. Denda Pemutusan Dini:</strong> Apabila PELANGGAN melakukan pemutusan layanan sebelum masa 6 bulan berakhir, maka PELANGGAN wajib membayar denda sebesar <strong>Rp 500.000 (Lima Ratus Ribu Rupiah)</strong>.</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase">Pasal 3: Biaya dan Pembayaran</h4>
                      <p>3.1. Tagihan diterbitkan setiap tanggal 1 setiap bulannya.</p>
                      <p>3.2. Batas waktu pembayaran adalah tanggal 8 setiap bulannya.</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase">Pasal 4: Peralatan</h4>
                      <p>Peralatan (Modem/ONT) dengan SN/MAC: <strong>{activeContractData.modemSnMac || "-"}</strong> adalah milik PENYEDIA yang dipinjamkan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-center pt-8 text-sm">
                    <div className="space-y-16">
                      <p>PENYEDIA (MTNET SYSTEM)</p>
                      <p className="font-bold underline">Admin MTNET</p>
                    </div>
                    <div className="space-y-16">
                      <p>PELANGGAN</p>
                      <p className="font-bold underline">{activeContractData.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <ScrollBar />
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
                  <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-800">
                    <TableCell className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">{request.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{request.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {getPackageName(request.packageId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">PASIF</Badge>
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
                          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-primary" 
                          title="Lihat Detail" 
                          onClick={() => handleOpenView(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/10" 
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
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50" 
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
                        <p>Belum ada antrian PSB.</p>
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

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-family: serif !important; }
          #contract-print-area { padding: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  )
}
