
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
    if (!user) {
      setRole(null)
      setUsername(null)
    }
  }, [user])

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      if (!isUserLoading && user) {
        const currentUsername = user.displayName || user.email?.split('@')[0] || "User";
        if (isMounted) setUsername(currentUsername);
        
        const isAgus = user.email === 'agus@mtnet.com' || user.uid === 'EdUhRV3odgO5TTzVMPSBAsMFaNP2';

        // Immediate role assignment for Agus to avoid permission errors
        if (isAgus && isMounted) {
          setRole('admin');
        }

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          let finalRole: UserRole = isAgus ? "admin" : "user";

          if (userDoc.exists()) {
            const userData = userDoc.data();
            finalRole = isAgus ? "admin" : (userData.role as UserRole || "user");

            if (isAgus && userData.role !== 'admin') {
              updateDoc(userDocRef, { role: 'admin' });
            }
          } else {
            await setDoc(userDocRef, {
              username: currentUsername,
              email: user.email,
              role: finalRole,
              createdAt: Date.now()
            });
          }

          if (isMounted) setRole(finalRole);

          if (finalRole === "user" && (pathname === "/settings" || pathname === "/users")) {
            router.push("/");
          }
        } catch (e) {
          // If Firestore fails, but it's Agus, ensure Admin role is set anyway
          if (isMounted && isAgus) setRole('admin');
        }
      } else if (!isUserLoading && !user && pathname !== "/login") {
        router.push("/login");
      }
    }
    
    checkRole();

    return () => { isMounted = false; };
  }, [user, isUserLoading, pathname, router, db]);

  const login = async (email: string, pass: string) => {
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
      createdAt: Date.now()
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
    isLoading: isUserLoading || (!!user && !role)
  }
}
