
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, Gauge, Cpu, Globe, ExternalLink, Info, Terminal as TerminalIcon, Settings2, Play, Trash2, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const commonGatewayIps = [
  { label: "Modem Umum (192.168.1.1)", ip: "http://192.168.1.1" },
  { label: "Modem ZTE/Huawei (192.168.100.1)", ip: "http://192.168.100.1" },
  { label: "Modem FiberHome (192.168.1.254)", ip: "http://192.168.1.254" },
  { label: "Modem TP-Link (192.168.0.1)", ip: "http://192.168.0.1" },
];

export default function TechnicianPage() {
  const [deviceInfo, setDeviceInfo] = React.useState({ os: "Unknown", type: "Desktop" });
  const [terminalLines, setTerminalLines] = React.useState<string[]>([
    "MTNET System [Version 2.0.1]",
    "(c) 2024 MTNET Corporation. All rights reserved.",
    "",
    "Ketik 'help' untuk daftar perintah.",
  ]);
  const [command, setCommand] = React.useState("");
  const [isPinging, setIsPinging] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Detect Device Info for "Real Data" Feel
    const ua = window.navigator.userAgent;
    let os = "Windows";
    let type = "Desktop";

    if (/Android/.test(ua)) { os = "Android"; type = "Smartphone"; }
    else if (/iPhone|iPad|iPod/.test(ua)) { os = "iOS"; type = "Smartphone"; }
    else if (/Macintosh/.test(ua)) { os = "macOS"; type = "Desktop"; }
    else if (/Linux/.test(ua)) { os = "Linux"; type = "Desktop"; }

    setDeviceInfo({ os, type });
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addLine = (line: string) => {
    setTerminalLines(prev => [...prev, line]);
  };

  const simulatePing = async (host: string) => {
    setIsPinging(true);
    addLine("");
    addLine(`Pinging ${host} with 32 bytes of data:`);
    
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const latency = Math.floor(Math.random() * 40) + 15;
      addLine(`Reply from ${host}: bytes=32 time=${latency}ms TTL=54`);
    }
    
    addLine("");
    addLine(`Ping statistics for ${host}:`);
    addLine(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
    addLine(`Approximate round trip times in milli-seconds:`);
    addLine(`    Minimum = 15ms, Maximum = 55ms, Average = 32ms`);
    setIsPinging(false);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toLowerCase();
    if (!cmd) return;

    addLine(`C:\\MTNET\\Technician> ${command}`);
    setCommand("");

    if (cmd === "help") {
      addLine("Daftar Perintah:");
      addLine("  ipconfig [/all] - Membaca konfigurasi IP perangkat");
      addLine("  ping [host]     - Melakukan pengetesan latensi jaringan");
      addLine("  clear           - Membersihkan layar terminal");
      addLine("  status          - Mengecek status node MTNET");
      addLine("  exit            - Menutup sesi bantuan");
    } else if (cmd.startsWith("ipconfig")) {
      addLine("");
      addLine(`${deviceInfo.os} IP Configuration`);
      
      if (cmd.includes("/all")) {
        addLine("");
        addLine(`Host Name . . . . . . . . . . . . : MTNET-${deviceInfo.os.toUpperCase()}-DEVICE`);
        addLine("Primary Dns Suffix  . . . . . . . : ");
        addLine(`Node Type . . . . . . . . . . . . : ${deviceInfo.type === 'Smartphone' ? 'Broadcast' : 'Hybrid'}`);
        addLine("IP Routing Enabled. . . . . . . . : No");
        addLine("WINS Proxy Enabled. . . . . . . . : No");
        
        addLine("");
        addLine(`${deviceInfo.os === 'Android' || deviceInfo.os === 'iOS' ? 'Mobile Network' : 'Wireless LAN'} adapter Connection:`);
        addLine("");
        addLine("   Connection-specific DNS Suffix  . : ");
        addLine(`   Description . . . . . . . . . . . : ${deviceInfo.os} Wireless Interface`);
        addLine(`   Physical Address. . . . . . . . . : ${deviceInfo.os === 'Windows' ? '28-CD-C1' : '00-AA-BB'}-00-FF-AA`);
        addLine("   DHCP Enabled. . . . . . . . . . . : Yes");
        addLine("   Autoconfiguration Enabled . . . . : Yes");
        addLine("   IPv4 Address. . . . . . . . . . . : 192.168.1.100(Preferred)");
        addLine("   Subnet Mask . . . . . . . . . . . : 255.255.255.0");
        addLine("   Lease Obtained. . . . . . . . . . : " + new Date().toLocaleDateString());
        addLine("   Default Gateway . . . . . . . . . : 192.168.1.1");
        addLine("   DHCP Server . . . . . . . . . . . : 192.168.1.1");
        addLine("   DNS Servers . . . . . . . . . . . : 8.8.8.8");
        addLine("                                       1.1.1.1");
        addLine("   NetBIOS over Tcpip. . . . . . . . : Enabled");
      } else {
        addLine("");
        addLine(`${deviceInfo.type} Connection:`);
        addLine("");
        addLine("   IPv4 Address. . . . . . . . . . . : 192.168.1.100");
        addLine("   Subnet Mask . . . . . . . . . . . : 255.255.255.0");
        addLine("   Default Gateway . . . . . . . . . : 192.168.1.1");
      }
    } else if (cmd.startsWith("ping")) {
      const parts = cmd.split(" ");
      const host = parts[1] || "google.com";
      simulatePing(host);
    } else if (cmd === "clear") {
      setTerminalLines([]);
    } else if (cmd === "status") {
      addLine("Checking MTNET Nodes...");
      addLine("Node Jakarta: ONLINE (Latency 12ms)");
      addLine("Node Singapore: ONLINE (Latency 34ms)");
      addLine("Main Database: CONNECTED (LOCAL)");
      addLine(`Device Detected: ${deviceInfo.os} (${deviceInfo.type})`);
    } else {
      addLine(`'${cmd}' is not recognized as an internal or external command.`);
    }
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Menu Teknisi</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Alat bantu lapangan untuk pengecekan jaringan dan konfigurasi modem.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-2xl bg-[#0c0c0c] text-[#00ff00] font-mono overflow-hidden rounded-2xl ring-1 ring-slate-800">
            <CardHeader className="bg-[#1a1a1a] border-b border-[#333] py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Command Prompt - MTNET_v2.0.1</span>
              </div>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-rose-900" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 h-[300px] md:h-[400px] overflow-hidden flex flex-col">
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-hide">
                  {terminalLines.map((line, i) => (
                    <p key={i} className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{line}</p>
                  ))}
                  {isPinging && <div className="animate-pulse text-xs md:text-sm">_</div>}
                </div>
                <form onSubmit={handleCommand} className="flex items-center gap-2 border-t border-[#333] pt-3">
                  <ChevronRight className="h-4 w-4 text-[#00ff00] shrink-0" />
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 text-xs md:text-sm font-mono text-[#00ff00] placeholder:text-[#00ff00]/30"
                    placeholder="Ketik perintah di sini..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={isPinging}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-[#00ff00]/50 hover:text-[#00ff00] hover:bg-[#00ff00]/10"
                      onClick={() => setTerminalLines([])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-7 w-7 bg-[#00ff00] text-black hover:bg-[#00ff00]/80"
                      disabled={isPinging || !command}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Settings2 className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg dark:text-white">Konfigurasi Modem</CardTitle>
                  <CardDescription className="text-xs md:text-sm dark:text-slate-400">Akses cepat ke halaman admin perangkat pelanggan.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
                {commonGatewayIps.map((item) => (
                  <div 
                    key={item.ip} 
                    className="flex flex-col p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">{item.label}</span>
                    <div className="flex items-center justify-between">
                      <code className="text-xs md:text-sm font-mono text-primary font-bold">{item.ip.replace('http://', '')}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 md:h-8 text-primary hover:bg-primary/5 text-xs" 
                        onClick={() => openExternal(item.ip)}
                      >
                        Buka <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group dark:bg-slate-900/40">
            <CardHeader className="bg-primary p-5 md:p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Gauge className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-none text-[10px]">External Tool</Badge>
              </div>
              <CardTitle className="mt-4 text-lg md:text-xl">Uji Kecepatan</CardTitle>
              <CardDescription className="text-xs md:text-sm text-primary-foreground/80">Cek kualitas bandwidth pelanggan.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Gunakan layanan Speedtest resmi Centralnet untuk memastikan pelanggan mendapatkan kecepatan sesuai paket.
              </p>
              <Button 
                className="w-full group-hover:scale-[1.02] transition-transform shadow-lg h-10 md:h-11 text-sm" 
                onClick={() => openExternal('https://centralnet.speedtestcustom.com/')}
              >
                Buka Speedtest <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm flex items-center gap-2 dark:text-white">
                <div className="h-4 w-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Info className="h-3 w-3 text-amber-500" />
                </div>
                Tips Teknisi
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-[10px] md:text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong>Ping Stabil:</strong> Latensi di bawah 30ms adalah ideal untuk game online. Jika di atas 100ms, periksa redaman kabel fiber.
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[10px] md:text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                <strong>Info Perangkat:</strong> Terminal secara otomatis mendeteksi bahwa Anda menggunakan <strong>{deviceInfo.os}</strong> ({deviceInfo.type}).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
