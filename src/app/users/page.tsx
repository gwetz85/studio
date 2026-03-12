
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser as useFirebaseUser } from "@/firebase"
import { collection, doc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, UserPlus, UsersRound, ShieldCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/use-auth"

export default function UsersManagementPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: currentUser } = useFirebaseUser();
  const { role: currentUserRole } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "users"), orderBy("username", "asc"));
  }, [db, currentUser]);
  const { data: users } = useCollection(usersQuery);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const role = formData.get("role") as string;
    
    // Note: This only creates a record in Firestore for role mapping.
    // In a real app, you'd use a cloud function to create the actual Auth user.
    const data = {
      username,
      role,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "users"), data);
      toast({ 
        title: "User Berhasil Ditambahkan", 
        description: `Akun ${username} siap digunakan dengan role ${role}.` 
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal menyimpan user" });
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akses user ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast({ title: "User dihapus" });
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
                Registrasi Akun Staf
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required placeholder="Contoh: agus_teknisi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Katasandi</Label>
                <Input id="password" name="password" type="password" required placeholder="••••••••" />
                <p className="text-[10px] text-slate-400">Gunakan kombinasi huruf dan angka.</p>
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
                <Button type="submit" className="w-full">Daftarkan User</Button>
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
