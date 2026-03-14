"use client"

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

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
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                <span className="text-[9px] md:text-xs font-bold text-muted-foreground dark:text-slate-300 uppercase tracking-tighter">Real-time Online</span>
              </div>
            </header>
            <main className="flex-1 p-3 md:p-8 overflow-x-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
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
