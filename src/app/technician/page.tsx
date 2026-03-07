"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, Gauge, Cpu, Globe, ExternalLink, Info, Terminal, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const commonGatewayIps = [
  { label: "Modem Umum (192.168.1.1)", ip: "http://192.168.1.1" },
  { label: "Modem ZTE/Huawei (192.168.100.1)", ip: "http://192.168.100.1" },
  { label: "Modem FiberHome (192.168.1.254)", ip: "http://192.168.1.254" },
  { label: "Modem TP-Link (192.168.0.1)", ip: "http://192.168.0.1" },
];

export default function TechnicianPage() {
  const openExternal = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menu Teknisi</h1>
        <p className="text-slate-500">Alat bantu lapangan untuk pengecekan jaringan dan konfigurasi modem.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Speedtest Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
          <CardHeader className="bg-primary p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gauge className="h-6 w-6" />
              </div>
              <Badge className="bg-white/20 text-white border-none">Online Tool</Badge>
            </div>
            <CardTitle className="mt-4 text-xl">Uji Kecepatan</CardTitle>
            <CardDescription className="text-primary-foreground/80">Cek kualitas bandwidth pelanggan.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-6">
              Gunakan layanan Speedtest resmi Centralnet untuk memastikan pelanggan mendapatkan kecepatan sesuai paket.
            </p>
            <Button 
              className="w-full group-hover:scale-[1.02] transition-transform" 
              onClick={() => openExternal('https://centralnet.speedtestcustom.com/')}
            >
              Buka Speedtest <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Modem Configuration Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 col-span-1 md:col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-primary">
                <Settings2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Konfigurasi Modem</CardTitle>
                <CardDescription>Akses cepat ke halaman admin perangkat pelanggan.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {commonGatewayIps.map((item) => (
                <div 
                  key={item.ip} 
                  className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</span>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-primary font-bold">{item.ip.replace('http://', '')}</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-primary" 
                      onClick={() => openExternal(item.ip)}
                    >
                      Buka <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Catatan Penting:</strong> Pastikan perangkat Anda (Laptop/HP) sudah terhubung ke jaringan Wi-Fi modem yang bersangkutan sebelum mengakses alamat IP di atas. Jika IP tidak standar, teknisi harus mengecek <i>Default Gateway</i> melalui menu pengaturan jaringan perangkat.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" /> Diagnosa Cepat
              </h3>
              <p className="text-slate-400 text-sm max-w-md">
                Gunakan perintah <code className="bg-slate-800 px-1.5 py-0.5 rounded text-primary">ping google.com -t</code> pada CMD untuk melihat kestabilan latensi secara <i>real-time</i> saat melakukan pengecekan kabel atau interferensi sinyal.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Status Jaringan</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-semibold">MTNET Node Jakarta: OK</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
