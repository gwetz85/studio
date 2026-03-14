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
  UsersRound
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
    {/* Base 3D Hexagon Shape */}
    <path d="M20 2L38 11V29L20 38L2 29V11L20 2Z" fill="currentColor" fillOpacity="0.1" />
    {/* Top Face */}
    <path d="M20 2L38 11L20 20L2 11L20 2Z" fill="currentColor" fillOpacity="0.9" />
    {/* Left Face */}
    <path d="M2 11V29L20 38V20L2 11Z" fill="currentColor" fillOpacity="0.7" />
    {/* Right Face */}
    <path d="M38 11V29L20 38V20L38 11Z" fill="currentColor" fillOpacity="0.5" />
    {/* Inner 3D Detail (M-shape stylization) */}
    <path d="M12 18V28L20 32V22L12 18Z" fill="white" fillOpacity="0.8" />
    <path d="M28 18V28L20 32V22L28 18Z" fill="white" fillOpacity="0.6" />
    <path d="M20 14L30 19V21L20 16L10 21V19L20 14Z" fill="white" />
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
          <div className="flex flex-col items-center gap-0.5 leading-none overflow-hidden mx-auto w-full">
            <span className="font-black text-[15px] sm:text-[16px] tracking-tighter uppercase text-white whitespace-nowrap w-full">MTNET SYSTEM APLIKASI</span>
            <span className="text-[9px] font-bold text-white/40 tracking-[0.2em] uppercase">Online System</span>
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
                  (role === 'teknisi' && (item.url === '/' || item.url === '/customers' || item.url === '/technician'));

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
