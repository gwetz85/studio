"use client"

import * as React from "react"
import { LayoutDashboard, Users, Package, CreditCard, Settings, Wifi, ShieldAlert, LogOut } from "lucide-react"
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

const items = [
  {
    title: "Informasi",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Pelanggan",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Terisolir",
    url: "/isolated",
    icon: ShieldAlert,
  },
  {
    title: "Paket Layanan",
    url: "/packages",
    icon: Package,
  },
  {
    title: "Pembayaran",
    url: "/payments",
    icon: CreditCard,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { role, username, logout } = useAuth()

  // Hide sidebar if on login page
  if (pathname === "/login") return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/30">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Wifi className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-lg">MTNET Billing</span>
            <span className="text-xs opacity-80">Manajer Luring</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/30 p-2 space-y-2">
        <div className="px-2 py-2 mb-2">
          <div className="text-xs font-semibold opacity-60 uppercase tracking-wider mb-1">Pengguna</div>
          <div className="text-sm font-medium truncate">{username}</div>
          <div className="text-[10px] opacity-70 uppercase">{role === 'admin' ? 'Administrator' : 'Staff'}</div>
        </div>
        
        <SidebarMenu>
          {role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === "/settings"} 
                tooltip="Pengaturan"
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
              className="text-rose-200 hover:text-white hover:bg-rose-600/20"
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
