"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { Printer, CheckCircle2, QrCode, Phone, MapPin, Globe } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { terbilang, formatRupiah, formatBillingPeriod, safeDate } from "@/lib/format"

interface ReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  invoice: any | any[]
  customer: any | ((id: string) => any)
  packageName: string | ((id: string) => string)
}

interface ReceiptProps {
  invoice: any
  customer: any
  packageName: string
  company: any
}

const Receipt = ({ invoice, customer, packageName, company }: ReceiptProps) => {
  const isPaid = invoice?.status === 'paid';
  const docNumber = String(invoice.id || "").substring(0, 8).toUpperCase();
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: localeId });
  
  return (
    <div className="bg-white px-16 py-6 print:px-16 print:py-6 print:m-0 print:h-[148.5mm] print:flex print:flex-col print:justify-between text-slate-800 border-b border-dashed border-slate-200 last:border-b-0 print:border-slate-300 overflow-visible">
      <div className="space-y-4">
        {/* Header - Modern & Clean */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-black text-2xl border-2 border-slate-900">
              M
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">MT NETWORK</h1>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> JALAN GUDANG MINYAK , TANJUNGPINANG
              </p>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3" /> 0817319885 | <Globe className="h-3 w-3" /> www.mtnet.id
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight leading-none mb-1">TAGIHAN LAYANAN</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NOMOR DOKUMEN</p>
            <p className="text-sm font-black text-blue-600">#{docNumber}</p>
          </div>
        </div>

        <div className="h-1 bg-slate-900 w-full mb-6"></div>

        {/* Info Pelanggan & Dokumen */}
        <div className="grid grid-cols-2 gap-12 text-[11px]">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 font-bold text-slate-500 uppercase">ID PELANGGAN</span>
              <span className="font-black text-slate-900">: {String(customer?.id || "").substring(0, 10).toUpperCase()}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-500 uppercase">NAMA PELANGGAN</span>
              <span className="font-black text-slate-900">: {customer?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-500 uppercase">ALAMAT</span>
              <span className="font-medium text-slate-600 flex-1">: {customer?.address || "-"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase">TANGGAL</span>
              <span className="font-black text-slate-900 uppercase">{currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase">PERIODE</span>
              <span className="font-black text-slate-900 uppercase">{formatBillingPeriod(invoice.billingPeriod)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500 uppercase">STATUS</span>
              <span className={cn(
                "font-black uppercase tracking-wider text-xs",
                isPaid ? "text-emerald-600" : "text-amber-600"
              )}>
                {isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Layanan - Styled as Card */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 bg-white">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                <th className="py-4 px-3 w-10">NO</th>
                <th className="py-4 px-4 text-left">DESKRIPSI LAYANAN</th>
                <th className="py-4 px-3">PERIODE</th>
                <th className="py-4 px-3 w-12">QTY</th>
                <th className="py-4 px-4 text-right">HARGA SATUAN</th>
                <th className="py-4 px-4 text-right">JUMLAH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="text-slate-700">
                <td className="py-4 px-3 text-center align-top font-bold text-xs">1</td>
                <td className="py-4 px-4 align-top">
                  <p className="font-black text-slate-900 text-sm mb-0.5 leading-tight">Paket Internet {packageName}</p>
                  <p className="text-[10px] text-slate-400 italic">Layanan Broadband High Speed Internet</p>
                </td>
                <td className="py-4 px-3 text-center align-top whitespace-nowrap text-xs">{formatBillingPeriod(invoice.billingPeriod)}</td>
                <td className="py-4 px-3 text-center align-top text-xs">1</td>
                <td className="py-4 px-4 text-right align-top font-medium text-xs">{formatRupiah(Number(invoice.amount || 0))}</td>
                <td className="py-4 px-4 text-right align-top font-black text-slate-900 text-xs">{formatRupiah(Number(invoice.amount || 0))}</td>
              </tr>
            </tbody>
          </table>
          <div className="bg-slate-50/50 p-4 flex flex-col items-end space-y-1.5 border-t border-slate-100">
            <div className="flex justify-between w-full max-w-[240px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>SUBTOTAL</span>
              <span className="text-slate-900 font-black">{formatRupiah(Number(invoice.amount || 0))}</span>
            </div>
            <div className="flex justify-between w-full max-w-[240px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>PPN (0%)</span>
              <span className="text-slate-900 font-black">Rp 0</span>
            </div>
            <div className="flex justify-between w-full max-w-[240px] items-center pt-2 mt-2 border-t border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL BAYAR</span>
              <span className="text-xl font-black text-[#8b8b8b]">{formatRupiah(Number(invoice.amount || 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terbilang & Footer Section */}
      <div className="mt-auto pt-6">
        <div className="border-l-[3px] border-slate-900 pl-4 py-1 italic mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">TERBILANG:</p>
          <p className="text-sm font-black text-slate-800"># {terbilang(Number(invoice.amount || 0))} #</p>
        </div>
      </div>
    </div>
  );
};

export function ReceiptDialog({ 
  isOpen, 
  onOpenChange, 
  invoice, // can be single object or array
  customer, // can be single object or function map 
  packageName // can be string or function map
}: ReceiptDialogProps) {
  if (!invoice) return null;

  const invoices = Array.isArray(invoice) ? invoice : [invoice];
  const db = useFirestore();
  const { data: companyProfile } = useDoc(doc(db, "settings", "company_profile"));
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[95vh] bg-slate-900">
        <DialogHeader className="p-6 bg-slate-900 text-white print:hidden flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Printer className="h-6 w-6 text-primary" />
            {invoices.length > 1 ? `Cetak Massal (${invoices.length} Dokumen)` : 'Pratinjau Dokumen'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-slate-100 p-4 md:p-8 print:p-0">
          <div className="max-w-[210mm] mx-auto print:max-w-none print:w-[210mm] print:min-h-[297mm] print:bg-white flex flex-col bg-slate-100">
            {invoices.map((inv, idx) => {
              const cust = typeof customer === 'function' ? customer(inv.customerId) : customer;
              const pkgName = typeof packageName === 'function' ? packageName(inv.customerId) : packageName;
              
              return (
                <div key={inv.id || idx} className="bg-white shadow-xl rounded-sm overflow-hidden print:shadow-none print:rounded-none mb-8 print:mb-0 print:h-[148.5mm]">
                  <Receipt 
                    invoice={inv}
                    customer={cust}
                    packageName={pkgName}
                    company={companyProfile}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-6 bg-slate-900 border-t border-slate-800 flex gap-4 print:hidden flex-shrink-0">
          <Button onClick={handlePrint} className="flex-1 h-12 text-lg font-black bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all">
            <Printer className="mr-2 h-5 w-5" /> CETAK SEKARANG
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 h-12 font-bold text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
