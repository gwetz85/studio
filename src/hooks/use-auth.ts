
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser, useAuth as useFirebaseAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

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
    async function checkRole() {
      if (!isUserLoading && user) {
        setUsername(user.displayName || user.email?.split('@')[0] || "User")
        
        let userRole: UserRole = "user";

        // Fallback untuk akun admin utama
        if (user.email?.startsWith('admin') || user.email === 'agus@mtnet.com') {
          userRole = "admin";
        } else {
          try {
            // Ambil data user berdasarkan UID (lebih efisien dan aman)
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              userRole = userDoc.data().role as UserRole;
            }
          } catch (e) {
            console.warn("Could not fetch user role from Firestore, using fallback.");
          }
        }
        
        setRole(userRole)

        // Proteksi rute berdasarkan role
        if (userRole === "user" && (pathname === "/settings" || pathname === "/users")) {
          router.push("/")
        }
      } else if (!isUserLoading && !user && pathname !== "/login") {
        router.push("/login")
      }
    }
    
    checkRole();
  }, [user, isUserLoading, pathname, router, db])

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const finalEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@mtnet.com`;
    await signInWithEmailAndPassword(authInstance, finalEmail, pass)
    router.push("/")
  }

  const register = async (username: string, pass: string, userRole: UserRole = "user") => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) throw new Error("Username tidak boleh kosong");
    if (cleanUsername.includes(" ")) throw new Error("Username tidak boleh mengandung spasi");
    
    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@mtnet.com`
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass)
    
    // 2. Update display name
    await updateProfile(userCredential.user, { displayName: cleanUsername })

    // 3. Save role to Firestore with UID as Document ID
    await setDoc(doc(db, "users", userCredential.user.uid), {
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
