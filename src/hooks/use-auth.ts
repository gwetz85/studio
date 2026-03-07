"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "admin" | "user"

interface AuthState {
  isLoggedIn: boolean
  role: UserRole | null
  username: string | null
}

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    role: null,
    username: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedAuth = localStorage.getItem("mtnet_auth")
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth)
      setAuth(parsed)
      
      // Redirect if user tries to access settings but is not admin
      if (parsed.role === "user" && pathname === "/settings") {
        router.push("/")
      }
    } else if (pathname !== "/login") {
      router.push("/login")
    }
    setIsLoading(false)
  }, [pathname, router])

  const login = (role: UserRole, username: string) => {
    const newState = { isLoggedIn: true, role, username }
    localStorage.setItem("mtnet_auth", JSON.stringify(newState))
    setAuth(newState)
    router.push("/")
  }

  const logout = () => {
    localStorage.removeItem("mtnet_auth")
    setAuth({ isLoggedIn: false, role: null, username: null })
    router.push("/login")
  }

  return { ...auth, login, logout, isLoading }
}
