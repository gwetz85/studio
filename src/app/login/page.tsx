
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User as UserIcon, AlertCircle, UserPlus, LogIn } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MTLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 32V10L20 22L34 10V32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 22V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 36H28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="34" cy="10" r="2.5" fill="currentColor"/>
    <circle cx="20" cy="22" r="2.5" fill="currentColor"/>
  </svg>
)

export default function LoginPage() {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRegisterMode, setIsRegisterMode] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    try {
      if (isRegisterMode) {
        await register(username, password, "user")
        toast({ title: "Registrasi Berhasil", description: "Akun Anda telah dibuat dan Anda telah masuk." })
      } else {
        const email = username.includes("@") ? username : `${username}@mtnet.com`
        await login(email, password)
        toast({ title: "Login Berhasil", description: "Selamat datang di MTNET Online." })
      }
    } catch (err: any) {
      console.error(err)
      if (isRegisterMode) {
        setError("Gagal mendaftar. Username mungkin sudah ada atau password terlalu lemah.")
      } else {
        setError("Username atau password salah. Pastikan akun sudah terdaftar.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-8 text-white text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-2">
            <MTLogo className="size-8" />
          </div>
          <CardTitle className="text-2xl font-bold">MTNET SYSTEM</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {isRegisterMode ? "Pendaftaran Akun Baru" : "Sistem Manajemen Online Real-time"}
          </CardDescription>
        </div>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="username" name="username" placeholder="Masukkan username" className="pl-10" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex flex-col gap-4">
            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
              {isLoading ? "Memproses..." : (isRegisterMode ? "Daftar Sekarang" : "Masuk ke Sistem")}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="text-xs text-slate-500" 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode ? (
                <><LogIn className="mr-2 h-3 w-3" /> Sudah punya akun? Masuk</>
              ) : (
                <><UserPlus className="mr-2 h-3 w-3" /> Belum punya akun? Daftar</>
              )}
            </Button>

            <p className="text-center text-[10px] text-slate-400">
              Akses sinkronisasi real-time cloud aktif.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
