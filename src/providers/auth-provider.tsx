"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser, useAuth as useFirebaseAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

export type UserRole = "admin" | "staff" | "teknisi" | "user"

interface AuthContextType {
  isLoggedIn: boolean
  role: UserRole | null
  username: string | null
  isLoading: boolean
  deviceError: string | null
  login: (email: string, pass: string) => Promise<void>
  register: (username: string, pass: string, userRole?: UserRole) => Promise<any>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('mtnet_device_id');
  if (!id) {
    try {
      id = crypto.randomUUID();
    } catch (e) {
      id = 'dev-' + Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem('mtnet_device_id', id);
  }
  return id;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const authInstance = useFirebaseAuth()

  const [role, setRole] = useState<UserRole | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Clear data when user logs out
  useEffect(() => {
    if (!user && !isUserLoading) {
      setRole(null)
      setUsername(null)
      setDeviceError(null)
      setIsDataLoaded(true)
    }
  }, [user, isUserLoading])

  const fetchingRef = React.useRef(false);

  // Single source of truth for user profile data - Optimized
  useEffect(() => {
    let isMounted = true;
    async function fetchUserProfile() {
      if (!user || isDataLoaded || fetchingRef.current) return;
      
      fetchingRef.current = true;
      const currentUsername = user.displayName || user.email?.split('@')[0] || "User";
      const isAgus = user.email === 'agus@mtnet.com' || user.uid === 'EdUhRV3odgO5TTzVMPSBAsMFaNP2';

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        let finalRole: UserRole = isAgus ? "admin" : "user";

        if (userDoc.exists()) {
          const userData = userDoc.data();
          finalRole = isAgus ? "admin" : (userData.role as UserRole || "user");
          
          // Simplified: Save device ID on first login without blocking UI
          if (finalRole !== 'admin') {
            const currentDeviceId = getDeviceId();
            if (!userData.deviceId && currentDeviceId) {
              updateDoc(userDocRef, { deviceId: currentDeviceId }).catch(() => {});
            }
          }
        } else {
          const currentDeviceId = isAgus ? null : getDeviceId();
          setDoc(userDocRef, {
            username: currentUsername,
            email: user.email,
            role: finalRole,
            deviceId: currentDeviceId,
            createdAt: Date.now()
          }, { merge: true }).catch(() => {});
        }

        if (isMounted) {
          setRole(finalRole);
          setUsername(currentUsername);
          setDeviceError(null);
          setIsDataLoaded(true);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
        if (isMounted && isAgus) {
          setRole('admin');
          setUsername(currentUsername);
          setIsDataLoaded(true);
        }
      } finally {
        fetchingRef.current = false;
      }
    }

    if (user && !isUserLoading && !isDataLoaded) {
      fetchUserProfile();
    }
  }, [user, isUserLoading, db, isDataLoaded]);

  // Route Protection
  useEffect(() => {
    if (!isUserLoading && isDataLoaded) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && role === "user" && (pathname === "/settings" || pathname === "/users")) {
        router.push("/");
      }
    }
  }, [user, isUserLoading, isDataLoaded, role, pathname, router]);

  const login = async (email: string, pass: string) => {
    setIsDataLoaded(false);
    const cleanEmail = email.trim().toLowerCase();
    const finalEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@mtnet.com`;
    await signInWithEmailAndPassword(authInstance, finalEmail, pass);
    router.push("/");
  }

  const register = async (username: string, pass: string, userRole: UserRole = "user") => {
    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@mtnet.com`;
    const isAgus = cleanUsername === 'agus' || email === 'agus@mtnet.com';
    const finalRole = isAgus ? 'admin' : userRole;
    
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass)
    await updateProfile(userCredential.user, { displayName: cleanUsername })

    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: cleanUsername,
      email: email,
      role: finalRole,
      password: pass,
      createdAt: Date.now()
    })
    return userCredential.user
  }

  const logout = async () => {
    setIsDataLoaded(false);
    await signOut(authInstance);
    router.push("/login");
  }

  const value = {
    isLoggedIn: !!user,
    role,
    username,
    isLoading: isUserLoading || !isDataLoaded,
    deviceError,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
