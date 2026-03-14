"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  UserPlus, 
  UserX, 
  Wrench,
  UsersRound,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

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
} from "@/components/ui/sidebar"

const MTLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 32V10L20 22L34 10V32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 22V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 36H28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="34" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="20" cy="22" r="2.5" fill="currentColor"/>
  </svg>
)

const navItems = [
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
    title: "Laporan Gangguan",
    url: "/issues",
    icon: AlertCircle,
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

  if (pathname === "/login") return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-white/10 bg-black/10 backdrop-blur-md p-6">
        <div className="flex flex-col items-center justify-center gap-3 w-full text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20 text-white mx-auto">
            <MTLogo className="size-8" />
          </div>
          <div className="flex flex-col items-center gap-0.5 leading-none overflow-hidden mx-auto">
            <span className="font-black text-xl tracking-tighter uppercase text-white whitespace-pre-wrap">MTNET SYSTEM APLIKASI</span>
            <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Online System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 mb-2">Navigasi Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                // Check permissions
                const isAllowed = 
                  role === 'admin' || 
                  (role === 'staff' && item.url !== '/technician' && item.url !== '/users') ||
                  (role === 'teknisi' && (item.url === '/' || item.url === '/customers' || item.url === '/technician' || item.url === '/issues'));

                if (!isAllowed) return null;

                return (
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
                );
              })}
              
              {role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/users"}
                    tooltip="Manajemen User"
                  >
                    <Link href="/users" className="flex items-center gap-3 transition-all duration-300">
                      <UsersRound className={pathname === "/users" ? "scale-110 text-white" : "opacity-70"} />
                      <span className={pathname === "/users" ? "text-white" : "text-white/80"}>Manajemen User</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4 space-y-4 bg-black/10 backdrop-blur-md">
        <div className="px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Mode Online Aktif</span>
          </div>
          <div className="text-sm font-bold truncate text-white">{username}</div>
          <div className="text-[10px] font-medium text-white/60 uppercase">{role === 'admin' ? 'Administrator' : (role === 'staff' ? 'Staff' : 'Teknisi')}</div>
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
