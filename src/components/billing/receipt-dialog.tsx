"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Download, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

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
}

const Receipt = ({ invoice, customer, packageName }: ReceiptProps) => {
  const isPaid = invoice?.status === 'paid';
  
  return (
    <div className="bg-white p-8 md:p-12 space-y-8 print:p-0 print:m-0 print:block print:break-after-page">
      {/* Receipt Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 print:border-slate-900">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">MTNET</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">System Aplikasi Online</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase text-slate-900">{isPaid ? 'Kwitansi' : 'Tagihan'}</h2>
          <p className="text-sm font-mono text-slate-500">#{String(invoice.id || "").substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Receipt Info Section */}
      <div className="grid grid-cols-2 gap-12">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Diterima Dari:</p>
            <p className="text-sm font-bold text-slate-900">{customer?.name || "N/A"}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{customer?.address || "-"}</p>
            <p className="text-xs text-slate-500">{customer?.phone || "-"}</p>
          </div>
        </div>
        <div className="space-y-4 text-right">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{isPaid ? 'Tanggal Bayar:' : 'Tanggal Tagihan:'}</p>
            <p className="text-sm font-bold text-slate-900">
              {isPaid 
                ? (invoice.paymentDate ? format(new Date(invoice.paymentDate), "dd MMMM yyyy", { locale: localeId }) : "-")
                : (invoice.createdAt ? format(new Date(invoice.createdAt), "dd MMMM yyyy", { locale: localeId }) : "-")
              }
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Periode Layanan:</p>
            <p className="text-sm font-bold text-slate-900">{invoice.billingPeriod}</p>
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div className="border-t-2 border-slate-100 pt-6 print:border-slate-100">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 print:border-slate-100">
              <th className="text-left py-3">Deskripsi Layanan</th>
              <th className="text-right py-3">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-100">
            <tr>
              <td className="py-4">
                <p className="text-sm font-bold text-slate-900">Paket Internet {packageName}</p>
                <p className="text-[10px] text-slate-500 italic">Biaya langganan bulanan</p>
              </td>
              <td className="py-4 text-right">
                <p className="text-sm font-bold text-slate-900">Rp {(invoice.amount || 0).toLocaleString('id-ID')}</p>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 print:border-slate-900">
              <td className="py-4">
                <p className="text-sm font-black uppercase text-slate-900">Total {isPaid ? 'Pembayaran' : 'Tagihan'}</p>
              </td>
              <td className="py-4 text-right">
                <p className={cn(
                  "text-xl font-black print:text-primary",
                  isPaid ? "text-primary" : "text-amber-600"
                )}>
                  Rp {(invoice.amount || 0).toLocaleString('id-ID')}
                </p>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status Badge (Watermark style) */}
      <div className="flex justify-center pt-4">
        <div className={cn(
          "border-4 rounded-full px-8 py-2 rotate-[-5deg]",
          isPaid ? "border-emerald-500/30 print:border-emerald-500/30" : "border-amber-500/30 print:border-amber-500/30"
        )}>
          <p className={cn(
            "text-2xl font-black uppercase tracking-[0.2em] opacity-40",
            isPaid ? "text-emerald-500" : "text-amber-500"
          )}>
            {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
          </p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-8 text-center border-t border-slate-100 print:border-slate-100">
        <p className="text-[10px] text-slate-400 italic">
          Terima kasih telah menggunakan layanan MTNET. Simpan {isPaid ? 'kwitansi' : 'tagihan'} ini sebagai bukti yang sah.
        </p>
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
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-primary text-white print:hidden flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {invoices.length > 1 ? `Cetak Massal (${invoices.length} Tagihan)` : 'Pratinjau Tagihan / Kwitansi'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-white">
          <div className="divide-y-2 divide-dashed divide-slate-200">
            {invoices.map((inv, idx) => {
              const cust = typeof customer === 'function' ? customer(inv.customerId) : customer;
              const pkgName = typeof packageName === 'function' ? packageName(inv.customerId) : packageName;
              
              return (
                <Receipt 
                  key={inv.id || idx}
                  invoice={inv}
                  customer={cust}
                  packageName={pkgName}
                />
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 bg-slate-50 border-t flex gap-2 print:hidden flex-shrink-0">
          <Button onClick={handlePrint} className="flex-1 font-bold">
            <Printer className="mr-2 h-4 w-4" /> Cetak Sekarang
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 font-bold">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
