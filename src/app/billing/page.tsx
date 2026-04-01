"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, updateDoc, addDoc, query, orderBy, getDocs, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Printer, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Undo2, 
  MessageCircle, 
  ChevronRight,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/use-auth"
import { ReceiptDialog } from "@/components/billing/receipt-dialog"
import { cn } from "@/lib/utils"

export default function BillingPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { role } = useAuth();
  
  const [search, setSearch] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  
  // Receipt State
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [activeInvoice, setActiveInvoice] = React.useState<any | null>(null);

  // Queries
  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "invoices"), orderBy("billingPeriod", "desc"));
  }, [db, user]);
  const { data: invoices } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "customers");
  }, [db, user]);
  const { data: customers } = useCollection(customersQuery);

  const packagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "servicePackages");
  }, [db, user]);
  const { data: packages } = useCollection(packagesQuery);

  const filteredInvoices = React.useMemo(() => {
    if (!invoices || !customers) return [];
    let filtered = invoices;

    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(inv => {
        const customer = customers.find(c => c.id === inv.customerId);
        return customer?.name?.toLowerCase().includes(s) || inv.billingPeriod?.includes(s);
      });
    }

    return filtered;
  }, [invoices, customers, search, statusFilter]);

  const handleGenerateMonthlyBills = async () => {
    if (role !== 'admin') return;
    
    const now = new Date();
    const currentPeriod = now.toISOString().slice(0, 7); // YYYY-MM
    
    if (!confirm(`Terbitkan tagihan baru untuk periode ${currentPeriod}?`)) return;
    
    setIsGenerating(true);
    try {
      const activeCustomers = customers?.filter(c => c.status === 'active') || [];
      const existingInvoicesSnapshot = await getDocs(
        query(collection(db, "invoices"), where("billingPeriod", "==", currentPeriod))
      );
      const existingCustomerIds = new Set(existingInvoicesSnapshot.docs.map(doc => doc.data().customerId));
      
      let createdCount = 0;
      for (const customer of activeCustomers) {
        if (!existingCustomerIds.has(customer.id)) {
          const pkg = packages?.find(p => p.id === customer.packageId);
          if (pkg) {
            await addDoc(collection(db, "invoices"), {
              customerId: customer.id,
              amount: pkg.price,
              billingPeriod: currentPeriod,
              status: 'pending',
              paymentDate: null,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            createdCount++;
          }
        }
      }
      
      toast({ 
        title: "Pembuatan Tagihan Selesai", 
        description: `${createdCount} tagihan baru berhasil diterbitkan untuk periode ${currentPeriod}.` 
      });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Gagal menerbitkan tagihan" });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (role !== 'admin') return;
    try {
      await updateDoc(doc(db, "invoices", id), { 
        status, 
        paymentDate: status === 'paid' ? Date.now() : null,
        updatedAt: Date.now()
      });
      toast({ title: "Status tagihan diperbarui" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal update status" });
    }
  };

  const openReceipt = (invoice: any) => {
    setActiveInvoice(invoice);
    setIsReceiptOpen(true);
  };

  const currentCustomer = React.useMemo(() => {
    if (!activeInvoice || !customers) return null;
    return customers.find(c => c.id === activeInvoice.customerId);
  }, [activeInvoice, customers]);

  const currentPackageName = React.useMemo(() => {
    if (!currentCustomer || !packages) return "N/A";
    return packages.find(p => p.id === currentCustomer.packageId)?.name || "N/A";
  }, [currentCustomer, packages]);

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.name || "N/A";

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    return cleaned;
  };

  const handleWhatsAppReminder = (invoice: any) => {
    const customer = customers?.find(c => c.id === invoice.customerId);
    if (!customer) return;
    const message = `Halo ${customer.name}, tagihan internet Rp ${(invoice.amount || 0).toLocaleString('id-ID')} periode ${invoice.billingPeriod} belum lunas. Mohon segera dibayar. Terima kasih.`;
    window.open(`https://wa.me/${formatWhatsAppNumber(customer.phone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <FileText className="h-6 w-6" />
            </div>
            Daftar Tagihan
          </h1>
          <p className="text-slate-500 font-medium ml-1">Manajemen tagihan layanan internet pelanggan aktif.</p>
        </div>
        
        {role === 'admin' && (
          <Button 
            onClick={handleGenerateMonthlyBills} 
            disabled={isGenerating}
            className="h-12 px-6 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5" />
            )}
            Terbitkan Tagihan Bulanan (Massal)
          </Button>
        )}
      </div>

      {/* Stats & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tagihan", value: invoices?.length || 0, color: "bg-slate-100 text-slate-600", border: "border-slate-200" },
          { label: "Menunggu", value: invoices?.filter(i => i.status === 'pending').length || 0, color: "bg-amber-100 text-amber-600", border: "border-amber-200" },
          { label: "Lunas", value: invoices?.filter(i => i.status === 'paid').length || 0, color: "bg-emerald-100 text-emerald-600", border: "border-emerald-200" },
          { label: "Terlambat", value: invoices?.filter(i => i.status === 'overdue').length || 0, color: "bg-rose-100 text-rose-600", border: "border-rose-200" },
        ].map((stat, i) => (
          <Card key={i} className={cn("border shadow-sm rounded-2xl", stat.border)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold", stat.color)}>
                {stat.label.charAt(0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white/60 backdrop-blur-xl border rounded-2xl flex items-center px-4 shadow-sm group focus-within:ring-2 ring-primary/20 transition-all">
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Cari nama pelanggan atau periode..." 
            className="border-none shadow-none focus-visible:ring-0 text-sm font-medium h-12" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl border">
          {["all", "pending", "paid", "overdue"].map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-xl px-4 text-xs font-bold uppercase tracking-wider h-10",
                statusFilter === f ? "shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-white"
              )}
            >
              {f === 'all' ? 'Semua' : f.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/40 backdrop-blur-md">
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow className="h-14 hover:bg-transparent">
                <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest">Pelanggan</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Periode</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Nominal</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-slate-50/80 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {getCustomerName(inv.customerId).charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{getCustomerName(inv.customerId)}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter italic leading-none">Sub ID: {String(inv.customerId || "").substring(0,6) || "N/A"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-slate-600">
                    {inv.billingPeriod}
                  </TableCell>
                  <TableCell className="text-center font-black text-slate-900">
                    Rp {(inv.amount || 0).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none",
                      inv.status === 'paid' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 
                      inv.status === 'overdue' ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 
                      'bg-amber-500 shadow-lg shadow-amber-500/20'
                    )}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                       {inv.status !== 'paid' && role === 'admin' && (
                         <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 rounded-xl font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                              onClick={() => updateStatus(inv.id!, 'paid')}
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> LUNAS
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl hover:bg-green-50 text-emerald-600"
                              onClick={() => handleWhatsAppReminder(inv)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                         </>
                       )}
                       
                       {inv.status === 'paid' && (
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-black transition-all shadow-lg"
                            onClick={() => openReceipt(inv)}
                          >
                            <Printer className="mr-1.5 h-3.5 w-3.5" /> KWITANSI
                          </Button>
                       )}

                       {inv.status === 'paid' && role === 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500"
                            onClick={() => updateStatus(inv.id!, 'pending')}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredInvoices?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 grayscale scale-90">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Tidak Ada Tagihan Ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <ReceiptDialog 
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        invoice={activeInvoice}
        customer={currentCustomer}
        packageName={currentPackageName}
      />
    </div>
  )
}
