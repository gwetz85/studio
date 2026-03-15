"use client"

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Info, Mail, MessageSquare, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat bg-fixed opacity-10 dark:opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('https://picsum.photos/seed/net1/1920/1080')" }}
        data-ai-hint="network technology"
      />
      
      {isLoginPage ? (
        children
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
            <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4 bg-white/60 backdrop-blur-xl dark:bg-slate-900/60 sticky top-0 z-10">
              <SidebarTrigger className="-ml-1 h-8 w-8" />
              <div className="flex-1" />
              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                  <span className="text-[9px] md:text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-tighter">Real-time Online</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-primary/5 hover:bg-primary/10 text-primary"
                  onClick={() => setIsAboutOpen(true)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 p-3 md:p-8 overflow-x-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}

      {/* About Application Dialog */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="bg-primary p-6 text-white text-center">
            <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight">Tentang MTNET SYSTEM</DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] md:text-xs uppercase font-bold tracking-widest">Informasi Aplikasi</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Selamat datang di <b>MTNET SYSTEM</b>. Aplikasi ini dibuat dan dikembangkan guna mempermudah dalam pengecekkan status pelanggan, pemasangan baru dan penanganan gangguan.
              </p>
              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
                Aplikasi ini masih dalam pengembangan dan akan terus dikembangkan mengikuti kebutuhan Usaha.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kritik & Saran</h4>
              <p className="text-xs text-slate-500">Kritik dan saran sangat diharapkan guna mempermudah dalam perbaikkan. Hubungi kami melalui:</p>
              
              <div className="grid grid-cols-1 gap-2">
                <a 
                  href="mailto:agussuriyadipunya@gmail.com" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border hover:border-primary transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Email</p>
                    <p className="text-xs font-semibold truncate">agussuriyadipunya@gmail.com</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-primary" />
                </a>

                <a 
                  href="https://wa.me/62817319885" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border hover:border-emerald-500 transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">WhatsApp</p>
                    <p className="text-xs font-semibold">0817319885</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-emerald-500" />
                </a>
              </div>
            </div>

            <Separator />

            <div className="pt-2 text-center space-y-1">
              <p className="text-sm font-black text-primary uppercase">MT NET</p>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>No.TDPSE : <span className="font-mono font-bold text-slate-700 dark:text-slate-300">016650.01/DJAI.PSE/12/2024</span></p>
                <p>Tanggal : <span className="font-bold text-slate-700 dark:text-slate-300">13-12-2024</span></p>
              </div>
            </div>

            <Button onClick={() => setIsAboutOpen(false)} className="w-full h-11 text-xs font-bold shadow-lg mt-4">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedSidebarColor = localStorage.getItem("sidebar_color") || "blue";

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.documentElement.setAttribute("data-sidebar-color", savedSidebarColor);
  }, []);

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <title>MTNET SYSTEM APLIKASI</title>
      </head>
      <body className="antialiased transition-colors duration-300 relative min-h-screen text-slate-900 dark:text-slate-100">
        <FirebaseClientProvider>
          <MainLayoutContent>
            {children}
          </MainLayoutContent>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
