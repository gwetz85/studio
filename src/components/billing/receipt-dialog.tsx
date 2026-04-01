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
import { terbilang, formatRupiah, formatBillingPeriod } from "@/lib/format"

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
  const paymentDate = invoice.paymentDate ? format(new Date(invoice.paymentDate), "dd MMMM yyyy", { locale: localeId }) : "-";
  
  return (
    <div className="bg-white p-8 md:p-10 space-y-6 print:p-0 print:m-0 print:block print:break-after-page text-slate-800">
      {/* Header Perusahaan */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">
              {(company?.name || "MTNET").charAt(0)}
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">{company?.name || "MTNET"}</h1>
          </div>
          <div className="text-[11px] font-medium text-slate-500 space-y-0.5">
            <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {company?.address || "Jl. Raya Lintas Sumatera, Bandar Jaya, Lampung"}</p>
            <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {company?.phone || "0812-7000-XXXX"} | <Globe className="h-3 w-3" /> www.mtnet.id</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
            {isPaid ? 'Kwitansi Pembayaran' : 'Tagihan Layanan'}
          </h2>
          <div className="bg-slate-100 px-3 py-1.5 rounded-md inline-block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Nomor Dokumen</p>
            <p className="text-sm font-mono font-bold text-slate-800">#{docNumber}</p>
          </div>
        </div>
      </div>

      {/* Info Pelanggan & Dokumen */}
      <div className="grid grid-cols-2 gap-8 py-2">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <p className="text-[10px] font-black uppercase text-slate-400">ID Pelanggan</p>
            <p className="text-sm font-bold col-span-2 text-slate-900">: {String(customer?.id || "").substring(0, 10).toUpperCase()}</p>
            
            <p className="text-[10px] font-black uppercase text-slate-400">Nama Pelanggan</p>
            <p className="text-sm font-bold col-span-2 text-slate-900">: {customer?.name || "N/A"}</p>
            
            <p className="text-[10px] font-black uppercase text-slate-400">Alamat</p>
            <p className="text-[11px] font-medium col-span-2 leading-relaxed text-slate-600">: {customer?.address || "-"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <p className="text-[10px] font-black uppercase text-slate-400">Tanggal</p>
            <p className="text-sm font-bold col-span-2 text-slate-900 text-right">{isPaid ? paymentDate : currentDate}</p>
            
            <p className="text-[10px] font-black uppercase text-slate-400">Periode</p>
            <p className="text-sm font-bold col-span-2 text-slate-900 text-right">{formatBillingPeriod(invoice.billingPeriod)}</p>
            
            <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
            <p className={cn(
              "text-xs font-black col-span-2 text-right uppercase tracking-widest",
              isPaid ? "text-emerald-600" : "text-amber-600"
            )}>
              {isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Item Layanan */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="py-3 px-4 text-left w-12">No</th>
              <th className="py-3 px-4 text-left">Deskripsi Layanan</th>
              <th className="py-3 px-4 text-center">Periode</th>
              <th className="py-3 px-4 text-center w-20">Qty</th>
              <th className="py-3 px-4 text-right">Harga Satuan</th>
              <th className="py-3 px-4 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr>
              <td className="py-4 px-4 text-center">1</td>
              <td className="py-4 px-4">
                <p className="font-bold text-slate-900">Paket Internet {packageName}</p>
                <p className="text-[10px] text-slate-400 italic font-medium">Layanan Broadband High Speed Internet</p>
              </td>
              <td className="py-4 px-4 text-center text-xs">{formatBillingPeriod(invoice.billingPeriod)}</td>
              <td className="py-4 px-4 text-center">1</td>
              <td className="py-4 px-4 text-right">{formatRupiah(Number(invoice.amount || 0))}</td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">{formatRupiah(Number(invoice.amount || 0))}</td>
            </tr>
          </tbody>
          <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
            <tr>
              <td colSpan={5} className="py-3 px-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtotal</td>
              <td className="py-3 px-4 text-right font-bold">{formatRupiah(Number(invoice.amount || 0))}</td>
            </tr>
            <tr>
              <td colSpan={5} className="py-1 px-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">PPN (0%)</td>
              <td className="py-1 px-4 text-right font-bold text-xs">{formatRupiah(0)}</td>
            </tr>
            <tr className="bg-slate-900 text-white">
              <td colSpan={5} className="py-3 px-4 text-right text-xs font-black uppercase tracking-widest">Total Bayar</td>
              <td className="py-3 px-4 text-right text-lg font-black">{formatRupiah(Number(invoice.amount || 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terbilang */}
      <div className="bg-slate-50 border-l-4 border-slate-900 p-4 rounded-r-lg italic">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Terbilang:</p>
        <p className="text-sm font-bold text-slate-800 capitalize"># {terbilang(Number(invoice.amount || 0))} #</p>
      </div>

      {/* Footer & Tanda Tangan */}
      <div className="grid grid-cols-3 gap-8 pt-4">
        <div className="col-span-2 space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Catatan & Cara Pembayaran:</p>
            <ul className="text-[10px] text-slate-500 space-y-1 font-medium leading-relaxed">
              <li>1. Pembayaran dapat melalui transfer Bank BCA: 123456789 A/N MTNET.</li>
              <li>2. Harap simpan kwitansi ini sebagai bukti pembayaran yang sah.</li>
              <li>3. Layanan akan otomatis aktif/diperpanjang setelah pembayaran dikonfirmasi.</li>
              <li>4. Pertanyaan lebih lanjut hubungi Support MTNET di 0812-7000-XXXX.</li>
            </ul>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200 inline-flex">
            <QrCode className="h-12 w-12 text-slate-400" />
            <div>
              <p className="text-[8px] font-black uppercase text-slate-500">Scan Verifikasi</p>
              <p className="text-[10px] font-bold text-slate-400">Verifikasi dokumen online melalui aplikasi MTNET</p>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-12">
          <div className="relative">
            <p className="text-sm font-bold text-slate-800 mb-1">Lampung, {currentDate}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Petugas Kasir,</p>
            
            {isPaid && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 -rotate-12 opacity-50 pointer-events-none">
                 <div className="border-4 border-emerald-500 rounded-full px-6 py-2 flex flex-col items-center justify-center">
                    <p className="text-emerald-500 font-black text-xl leading-none">LUNAS</p>
                    <p className="text-emerald-500 font-bold text-[8px] tracking-[0.3em] mt-1 uppercase">{docNumber}</p>
                 </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 border-b border-slate-900 inline-block px-4">MTNET BILLING SYSTEM</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1">E-Signature Authorized</p>
          </div>
        </div>
      </div>
      
      <div className="text-[9px] text-center text-slate-400 pt-6 border-t border-slate-100">
        Dokumen ini diterbitkan secara elektronik oleh Sistem Billing MTNET dan tidak memerlukan tanda tangan basah.
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
          <div className="max-w-2xl mx-auto space-y-8">
            {invoices.map((inv, idx) => {
              const cust = typeof customer === 'function' ? customer(inv.customerId) : customer;
              const pkgName = typeof packageName === 'function' ? packageName(inv.customerId) : packageName;
              
              return (
                <div key={inv.id || idx} className="bg-white shadow-xl rounded-sm overflow-hidden print:shadow-none print:rounded-none">
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
