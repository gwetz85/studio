
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser, useAuth as useFirebaseAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

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
        
        // Default role
        let userRole: UserRole = "user";

        // Hardcoded ADMIN override for owner account
        if (user.email === 'agus@mtnet.com' || user.email?.startsWith('admin@')) {
          userRole = "admin";
          
          // Sync database role if it's currently 'user'
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role !== 'admin') {
              updateDoc(doc(db, "users", user.uid), { role: 'admin' });
            }
          } catch (e) {
            console.warn("Auto-sync role failed");
          }
        } else {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              userRole = userDoc.data().role as UserRole;
            }
          } catch (e) {
            console.warn("Could not fetch user role from Firestore.");
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
    
    // Force admin role for 'agus' during registration
    const finalRole = cleanUsername === 'agus' ? 'admin' : userRole;
    
    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@mtnet.com`
    
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass)
    await updateProfile(userCredential.user, { displayName: cleanUsername })

    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: cleanUsername,
      email: email,
      role: finalRole,
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
