
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser as useFirebaseUser } from "@/firebase"
import { collection, doc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, UserPlus, UsersRound, ShieldCheck, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth, UserRole } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UsersManagementPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: currentUser } = useFirebaseUser();
  const { role: currentUserRole, register } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "users"), orderBy("username", "asc"));
  }, [db, currentUser]);
  const { data: users } = useCollection(usersQuery);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as UserRole;
    
    try {
      await register(username, password, role);
      toast({ 
        title: "User Berhasil Didaftarkan", 
        description: `Akun ${username} telah dibuat di sistem Auth.` 
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Gagal mendaftarkan user",
        description: "Pastikan password minimal 6 karakter atau username belum terdaftar."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akses user ini dari database Firestore? (Catatan: Akun Auth harus dihapus manual di Console)")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast({ title: "Data user dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <ShieldCheck className="h-16 w-16 text-rose-500 opacity-20" />
        <h2 className="text-xl font-bold">Akses Dibatasi</h2>
        <p className="text-slate-500">Hanya Administrator yang dapat mengelola pengguna sistem.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen User</h1>
          <p className="text-slate-500">Kelola akun staf dan administrator sistem.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah User Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Registrasi Akun Staf (Auth Online)
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Alert className="bg-amber-50 border-amber-100 text-amber-800 py-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-[10px]">
                  PENTING: Menambahkan user baru akan membuat Anda otomatis LOGOUT dari sesi ini untuk memproses pendaftaran akun baru.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required placeholder="Contoh: agus_teknisi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Katasandi</Label>
                <Input id="password" name="password" type="password" required placeholder="Min. 6 Karakter" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role User</Label>
                <Select name="role" defaultValue="staff">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff / Teknisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Mendaftarkan..." : "Daftarkan User Sekarang"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4 px-6">Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="py-4 px-6 font-semibold">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? "default" : "secondary"}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => deleteUser(u.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                    Belum ada user yang terdaftar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
