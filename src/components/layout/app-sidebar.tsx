
"use client"

import * as React from "react"
import { LayoutDashboard, Users, Package, CreditCard, Settings, Wifi, ShieldAlert, LogOut, Database, Clock, UserPlus, UserX, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// Custom MTnet Logo Component
const MTLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stylized M and T Path */}
    <path d="M6 32V10L20 22L34 10V32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 22V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 36H28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Network Nodes for Tech Feel */}
    <circle cx="6" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="34" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="20" cy="22" r="2.5" fill="currentColor"/>
  </svg>
)

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Paket Layanan",
    url: "/packages",
    icon: Package,
  },
  {
    title: "PSB",
    url: "/psb",
    icon: UserPlus,
  },
  {
    title: "Pelanggan",
    url: "/customers",
    icon: Users,
  },
  {
    title: "User Terisolir",
    url: "/isolated",
    icon: ShieldAlert,
  },
  {
    title: "User Nonaktif",
    url: "/inactive",
    icon: UserX,
  },
  {
    title: "Pembayaran",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Menu Teknisi",
    url: "/technician",
    icon: Wrench,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { role, username, logout } = useAuth()
  const [lastBackup, setLastBackup] = React.useState<string | null>(null)
  const [currentTime, setCurrentTime] = React.useState<string | null>(null)

  const updateBackupTime = React.useCallback(() => {
    const time = localStorage.getItem("mtnet_last_backup_time")
    if (time) {
      setLastBackup(format(new Date(parseInt(time)), "HH:mm", { locale: localeId }))
    }
  }, [])

  React.useEffect(() => {
    updateBackupTime()
    window.addEventListener('mtnet-backup-updated', updateBackupTime)
    
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), "HH:mm:ss", { locale: localeId }))
    }, 1000)
    
    setCurrentTime(format(new Date(), "HH:mm:ss", { locale: localeId }))

    return () => {
      window.removeEventListener('mtnet-backup-updated', updateBackupTime)
      clearInterval(timer)
    }
  }, [updateBackupTime])

  if (pathname === "/login") return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md shadow-lg border border-white/20 text-white">
            <MTLogo className="size-7" />
          </div>
          <div className="flex flex-col gap-1 leading-none overflow-hidden">
            <span className="font-extrabold text-xl truncate tracking-tight uppercase">MTNET</span>
            <div className="flex flex-col gap-0.5">
              {currentTime && (
                <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-mono">
                  <Clock className="size-3 shrink-0" />
                  <span className="truncate">{currentTime}</span>
                </div>
              )}
              {lastBackup && (
                <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-medium">
                  <Database className="size-2.5 shrink-0" />
                  <span className="truncate">Backup: {lastBackup}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator className="mx-4 bg-white/10" />

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 mb-2">Navigasi Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="flex items-center gap-3 transition-all duration-300">
                      <item.icon className={pathname === item.url ? "scale-110 text-white" : "opacity-70"} />
                      <span className={pathname === item.url ? "text-white" : ""}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4 space-y-4 bg-black/10 backdrop-blur-md">
        <div className="px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Sistem Luring</span>
          </div>
          <div className="text-sm font-bold truncate text-white">{username}</div>
          <div className="text-[10px] font-medium text-white/60 uppercase">{role === 'admin' ? 'Administrator' : 'Staff'}</div>
        </div>
        
        <SidebarMenu>
          {role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === "/settings"} 
                tooltip="Pengaturan"
                className="hover:bg-white/10"
              >
                <Link href="/settings">
                  <Settings />
                  <span>Pengaturan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              tooltip="Keluar"
              className="text-rose-200 hover:text-white hover:bg-rose-600/40 transition-colors"
            >
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
