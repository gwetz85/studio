
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
  const [deviceError, setDeviceError] = useState<string | null>(null)

  const getDeviceId = () => {
    if (typeof window === "undefined") return null;
    let id = localStorage.getItem("mtnet_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("mtnet_device_id", id);
    }
    return id;
  }

  useEffect(() => {
    if (!user) {
      setRole(null)
      setUsername(null)
      setDeviceError(null)
    }
  }, [user])

  useEffect(() => {
    async function checkRole() {
      if (!isUserLoading && user) {
        setUsername(user.displayName || user.email?.split('@')[0] || "User")
        
        let userRole: UserRole = "user";
        const currentDeviceId = getDeviceId();
        const isAgus = user.email === 'agus@mtnet.com' || user.displayName === 'agus';

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            userRole = userData.role as UserRole;

            if (!isAgus) {
              if (userData.deviceId && userData.deviceId !== currentDeviceId) {
                setDeviceError("Akun terkunci di perangkat lain. Hubungi Admin untuk reset.");
                return;
              }
              if (!userData.deviceId && currentDeviceId) {
                await updateDoc(userDocRef, { deviceId: currentDeviceId });
              }
            }
          }

          if (isAgus || user.email?.startsWith('admin@')) {
            userRole = "admin";
            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                username: user.displayName || 'agus',
                email: user.email,
                role: 'admin',
                createdAt: Date.now(),
                deviceId: currentDeviceId
              });
            } else if (userDoc.data().role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
            }
          }
        } catch (e) {
          console.warn("Auth check failed", e);
        }
        
        setRole(userRole);

        if (userRole === "user" && (pathname === "/settings" || pathname === "/users")) {
          router.push("/");
        }
      } else if (!isUserLoading && !user && pathname !== "/login") {
        router.push("/login");
      }
    }
    
    checkRole();
  }, [user, isUserLoading, pathname, router, db])

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const finalEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@mtnet.com`;
    await signInWithEmailAndPassword(authInstance, finalEmail, pass);
    router.push("/");
  }

  const register = async (username: string, pass: string, userRole: UserRole = "user") => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) throw new Error("Username tidak boleh kosong");
    if (cleanUsername.includes(" ")) throw new Error("Username tidak boleh mengandung spasi");
    
    const isAgus = cleanUsername === 'agus';
    const finalRole = isAgus ? 'admin' : userRole;
    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@mtnet.com`
    
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass)
    await updateProfile(userCredential.user, { displayName: cleanUsername })

    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: cleanUsername,
      email: email,
      role: finalRole,
      createdAt: Date.now(),
      deviceId: isAgus ? null : getDeviceId()
    })

    return userCredential.user
  }

  const logout = async () => {
    setRole(null)
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
    deviceError,
    isLoading: isUserLoading || (!!user && !role && !deviceError)
  }
}
