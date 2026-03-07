"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, Lock, User as UserIcon, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    // Admin Credentials
    if (username === "admin" && password === "@Agustus2") {
      login("admin", "Admin MTNET")
      toast({ title: "Selamat Datang, Admin", description: "Anda memiliki akses penuh ke sistem." })
    } 
    // User Credentials
    else if (username === "user" && password === "user") {
      login("user", "Staff User")
      toast({ title: "Login Berhasil", description: "Selamat bekerja." })
    } 
    else {
      setError("Username atau password salah. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-8 text-white text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-2">
            <Wifi className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">MTNET Billing</CardTitle>
          <CardDescription className="text-primary-foreground/80">Sistem Manajemen Internet Luring</CardDescription>
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
              {isLoading ? "Memproses..." : "Masuk ke Sistem"}
            </Button>
            <p className="text-center text-xs text-slate-400">
              Lupa password? Hubungi administrator teknis.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
