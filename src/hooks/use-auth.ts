
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser, useAuth as useFirebaseAuth } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"

export type UserRole = "admin" | "user"

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isUserLoading } = useUser()
  const authInstance = useFirebaseAuth()
  
  const [role, setRole] = useState<UserRole | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // Simple role check based on custom logic or email
        // Menambahkan 'agus@mtnet.com' ke dalam daftar admin
        const adminEmails = ["admin@mtnet.com", "agus@mtnet.com"];
        const userRole: UserRole = adminEmails.includes(user.email || "") ? "admin" : "user"
        setRole(userRole)
        setUsername(user.displayName || user.email)

        if (userRole === "user" && (pathname === "/settings" || pathname === "/users")) {
          router.push("/")
        }
      } else if (pathname !== "/login") {
        router.push("/login")
      }
    }
  }, [user, isUserLoading, pathname, router])

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(authInstance, email, pass)
    router.push("/")
  }

  const logout = async () => {
    await signOut(authInstance)
    router.push("/login")
  }

  return { 
    isLoggedIn: !!user, 
    role, 
    username, 
    logout, 
    login,
    isLoading: isUserLoading 
  }
}
