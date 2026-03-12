
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser, useAuth as useFirebaseAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"

export type UserRole = "admin" | "user"

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const authInstance = useFirebaseAuth()
  
  const [role, setRole] = useState<UserRole | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // Simple role check based on email
        const adminEmails = ["admin@mtnet.com", "agus@mtnet.com"];
        const userEmail = (user.email || "").toLowerCase().trim();
        const userRole: UserRole = adminEmails.includes(userEmail) ? "admin" : "user"
        setRole(userRole)
        setUsername(user.displayName || user.email?.split('@')[0] || "User")

        if (userRole === "user" && (pathname === "/settings" || pathname === "/users")) {
          router.push("/")
        }
      } else if (pathname !== "/login") {
        router.push("/login")
      }
    }
  }, [user, isUserLoading, pathname, router])

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    await signInWithEmailAndPassword(authInstance, cleanEmail, pass)
    router.push("/")
  }

  const register = async (username: string, pass: string, userRole: UserRole = "user") => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) throw new Error("Username tidak boleh kosong");
    if (cleanUsername.includes(" ")) throw new Error("Username tidak boleh mengandung spasi");
    
    // Pastikan format email valid, hindari double domain jika user mengetik email lengkap
    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@mtnet.com`
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass)
    
    // 2. Update display name
    await updateProfile(userCredential.user, { displayName: cleanUsername })

    // 3. Save role to Firestore for management visibility
    await addDoc(collection(db, "users"), {
      username: cleanUsername,
      email: email,
      role: userRole,
      createdAt: Date.now()
    })

    return userCredential.user
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
    register,
    isLoading: isUserLoading 
  }
}
