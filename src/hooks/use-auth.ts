
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
    async function checkRole() {
      if (!isUserLoading && user) {
        setUsername(user.displayName || user.email?.split('@')[0] || "User")
        
        // Cek role dari Firestore users collection
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        let userRole: UserRole = "user";
        if (!querySnapshot.empty) {
          userRole = querySnapshot.docs[0].data().role as UserRole;
        } else {
          // Fallback untuk akun pertama atau jika belum terdaftar di Firestore
          // Jika email mengandung 'admin', berikan akses admin (untuk setup awal)
          if (user.email?.startsWith('admin')) {
            userRole = "admin";
          }
        }
        
        setRole(userRole)

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
