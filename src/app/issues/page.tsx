
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, addDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, AlertTriangle, CheckCircle2, Loader2, MessageSquareText, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function IssuesPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const issuesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "issues"), orderBy("createdAt", "desc"));
  }, [db, user]);
  const { data: issues } = useCollection(issuesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customers");
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  const filteredIssues = React.useMemo(() => {
    if (!issues) return [];
    if (!search) return issues;
    const s = search.toLowerCase();
    return issues.filter(issue => {
      const customer = customers?.find(c => c.id === issue.customerId);
      return customer?.name?.toLowerCase().includes(s) || issue.description?.toLowerCase().includes(s);
    });
  }, [issues, customers, search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: formData.get("customerId") as string,
      description: formData.get("description") as string,
      status: "pending",
      createdAt: Date.now(),
    };

    try {
      await addDoc(collection(db, "issues"), data);
      toast({ title: "Laporan Gangguan Diterima" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal mengirim laporan" });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'solved') updateData.solvedAt = Date.now();
      await updateDoc(doc(db, "issues", id), updateData);
      toast({ title: "Status Gangguan Diperbarui" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal perbarui status" });
    }
  };

  const deleteIssue = async (id: string) => {
    if (confirm("Hapus laporan gangguan ini?")) {
      try {
        await deleteDoc(doc(db, "issues", id));
        toast({ title: "Laporan dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.name || "N/A";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Laporan Gangguan</h1>
          <p className="text-slate-500">Kelola tiket keluhan dan gangguan teknis pelanggan.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Input Gangguan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-rose-50 border-b border-rose-100">
              <DialogTitle className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                Laporan Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Pilih Pelanggan</Label>
                <Select name="customerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Cari pelanggan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Detail Gangguan</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  required 
                  placeholder="Contoh: Lampu LOS merah, Internet lambat, dll."
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">Kirim Laporan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border">
        <Search className="h-4 w-4 text-slate-400 ml-3" />
        <Input 
          placeholder="Cari berdasarkan pelanggan atau masalah..." 
          className="border-none shadow-none focus-visible:ring-0" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4 px-6">Pelanggan</TableHead>
                <TableHead>Masalah</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues?.map((issue) => (
                <TableRow key={issue.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 px-6 font-bold text-slate-900">
                    {getCustomerName(issue.customerId)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-start gap-2">
                      <MessageSquareText className="h-3.5 w-3.5 text-slate-400 mt-1 shrink-0" />
                      <span className="text-sm text-slate-600 line-clamp-2">{issue.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-500 font-mono">
                    {new Date(issue.createdAt).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      issue.status === 'solved' ? 'bg-emerald-500' : 
                      issue.status === 'process' ? 'bg-blue-500 animate-pulse' : 
                      'bg-rose-500'
                    )}>
                      {issue.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {issue.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => updateStatus(issue.id!, 'process')}>Proses</Button>
                      )}
                      {issue.status === 'process' && (
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-emerald-50 text-emerald-600 border-emerald-100" onClick={() => updateStatus(issue.id!, 'solved')}>Selesai</Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-600"
                        onClick={() => deleteIssue(issue.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredIssues?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      <p className="text-sm font-medium">Tidak ada laporan gangguan aktif.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
