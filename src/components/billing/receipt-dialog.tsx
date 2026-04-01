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
import { id } from "date-fns/locale"

interface ReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  invoice: any
  customer: any
  packageName: string
}

export function ReceiptDialog({ 
  isOpen, 
  onOpenChange, 
  invoice, 
  customer, 
  packageName 
}: ReceiptDialogProps) {
  if (!invoice || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-white print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Pratinjau Kwitansi Pembayaran
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white p-8 md:p-12 space-y-8 print:p-0 print:m-0" id="receipt-content">
          {/* Receipt Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">MTNET</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">System Aplikasi Online</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase text-slate-900">Kwitansi</h2>
              <p className="text-sm font-mono text-slate-500">#{invoice.id?.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Receipt Info Section */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Diterima Dari:</p>
                <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{customer.address}</p>
                <p className="text-xs text-slate-500">{customer.phone}</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tanggal Bayar:</p>
                <p className="text-sm font-bold text-slate-900">
                  {invoice.paymentDate ? format(new Date(invoice.paymentDate), "dd MMMM yyyy", { locale: id }) : "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Periode Layanan:</p>
                <p className="text-sm font-bold text-slate-900">{invoice.billingPeriod}</p>
              </div>
            </div>
          </div>

          {/* Item Table */}
          <div className="border-t-2 border-slate-100 pt-6">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="text-left py-3">Deskripsi Layanan</th>
                  <th className="text-right py-3">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                <tr className="border-t-2 border-slate-900">
                  <td className="py-4">
                    <p className="text-sm font-black uppercase text-slate-900">Total Pembayaran</p>
                  </td>
                  <td className="py-4 text-right">
                    <p className="text-xl font-black text-primary">Rp {(invoice.amount || 0).toLocaleString('id-ID')}</p>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Status Badge (Watermark style) */}
          <div className="flex justify-center pt-4">
            <div className="border-4 border-emerald-500/30 rounded-full px-8 py-2 rotate-[-5deg]">
              <p className="text-2xl font-black text-emerald-500 uppercase tracking-[0.2em] opacity-40">LUNAS</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-8 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic">
              Terima kasih telah menggunakan layanan MTNET. Simpan kwitansi ini sebagai bukti pembayaran yang sah.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex gap-2 print:hidden">
          <Button onClick={handlePrint} className="flex-1 font-bold">
            <Printer className="mr-2 h-4 w-4" /> Cetak Sekarang
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 font-bold">
            Tutup
          </Button>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #receipt-content, #receipt-content * {
              visibility: visible;
            }
            #receipt-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            @page {
              size: auto;
              margin: 1cm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
