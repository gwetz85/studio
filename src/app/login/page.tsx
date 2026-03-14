"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User as UserIcon, AlertCircle, UserPlus, LogIn, MonitorOff } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const MTLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Base 3D Hexagon Shape */}
    <path d="M20 2L38 11V29L20 38L2 29V11L20 2Z" fill="currentColor" fillOpacity="0.1" />
    {/* Top Face */}
    <path d="M20 2L38 11L20 20L2 11L20 2Z" fill="currentColor" fillOpacity="0.9" />
    {/* Left Face */}
    <path d="M2 11V29L20 38V20L2 11Z" fill="currentColor" fillOpacity="0.7" />
    {/* Right Face */}
    <path d="M38 11V29L20 38V20L38 11Z" fill="currentColor" fillOpacity="0.5" />
    {/* Inner 3D Detail (M-shape stylization) */}
    <path d="M12 18V28L20 32V22L12 18Z" fill="white" fillOpacity="0.8" />
    <path d="M28 18V28L20 32V22L28 18Z" fill="white" fillOpacity="0.6" />
    <path d="M20 14L30 19V21L20 16L10 21V19L20 14Z" fill="white" />
  </svg>
)

export default function LoginPage() {
  const { login, register, logout, deviceError } = useAuth()
  const { toast } = useToast()
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRegisterMode, setIsRegisterMode] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const rawUsername = formData.get("username") as string
    const username = rawUsername.trim().toLowerCase()
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
      if (err.code === 'auth/invalid-email') {
        setError("Format username tidak valid. Pastikan tidak ada spasi atau karakter khusus.")
      } else if (isRegisterMode) {
        setError("Gagal mendaftar. Username mungkin sudah ada atau password terlalu lemah.")
      } else {
        setError("Username atau password salah. Pastikan akun sudah terdaftar.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (deviceError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-rose-100 p-4 rounded-full w-fit">
              <MonitorOff className="h-8 w-8 text-rose-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-rose-600">Akses Diblokir</CardTitle>
            <CardDescription className="text-slate-600">
              {deviceError}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={logout} variant="outline" className="w-full">
              Kembali ke Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-8 text-white text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-2">
            <MTLogo className="size-8" />
          </div>
          <CardTitle className="text-2xl font-bold">MTNET SYSTEM APLIKASI</CardTitle>
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
