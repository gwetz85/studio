"use client"

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { db } from "@/lib/db";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  // Auto Backup Logic: Every 10 minutes
  useEffect(() => {
    if (!isLoggedIn) return;

    const performAutoBackup = async () => {
      try {
        const customers = await db.customers.toArray();
        const packages = await db.packages.toArray();
        const payments = await db.payments.toArray();
        
        const backupData = {
          version: "1.0.0",
          timestamp: Date.now(),
          data: { customers, packages, payments }
        };

        localStorage.setItem("mtnet_auto_backup", JSON.stringify(backupData));
        localStorage.setItem("mtnet_last_backup_time", backupData.timestamp.toString());
        
        // Dispatch custom event to update sidebar UI
        window.dispatchEvent(new Event('mtnet-backup-updated'));
        
        console.log("Auto Backup performed at:", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto Backup failed:", error);
      }
    };

    // Run once on load
    performAutoBackup();

    // Set interval for 10 minutes (600,000 ms)
    const interval = setInterval(performAutoBackup, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (isLoading) {
    return (
      <html lang="id">
        <body className="font-body bg-slate-50 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </body>
      </html>
    );
  }

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>MTNET Billing</title>
      </head>
      <body className="font-body antialiased">
        {isLoginPage ? (
          children
        ) : (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Siap Luring" />
                  <span className="text-xs font-medium text-muted-foreground">Mode Lokal</span>
                </div>
              </header>
              <main className="flex-1 p-6 md:p-8">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        )}
        <Toaster />
      </body>
    </html>
  );
}
