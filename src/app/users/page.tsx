
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser as useFirebaseUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, UserPlus, UsersRound, ShieldCheck, AlertCircle, Edit2, Shield, Unlock } from "lucide-react"
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
  const { role: currentUserRole, register, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser || currentUserRole !== 'admin') return null;
    return query(collection(db, "users"), orderBy("username", "asc"));
  }, [db, currentUser, currentUserRole]);
  
  const { data: users, isLoading: isDataLoading } = useCollection(usersQuery);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as UserRole;
    
    try {
      await register(username, password, role);
      toast({ title: "User Berhasil Didaftarkan" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal mendaftarkan user", description: error.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const formData = new FormData(e.currentTarget);
    const newRole = formData.get("role") as UserRole;

    try {
      await updateDoc(doc(db, "users", editingUser.id), { role: newRole });
      toast({ title: "Role Diperbarui" });
      setIsRoleDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memperbarui role" });
    }
  };

  const handleResetDevice = async (userId: string, username: string) => {
    if (confirm(`Hapus kaitan perangkat untuk ${username}?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { deviceId: null });
        toast({ title: "Perangkat Berhasil Di-reset" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal me-reset perangkat" });
      }
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akses user ini?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast({ title: "Data user dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  if (isAuthLoading) return null;

  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <ShieldCheck className="h-16 w-16 text-rose-500 opacity-20" />
        <h2 className="text-xl font-bold">Akses Dibatasi</h2>
        <p className="text-slate-500">Hanya Administrator yang dapat mengelola pengguna.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen User</h1>
          <p className="text-slate-500">Kelola akun staf dan penguncian perangkat.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah User Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <UsersRound className="h-5 w-5 text-primary" />
                Registrasi Akun Staf
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Alert className="bg-amber-50 border-amber-100 text-amber-800 py-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-[10px]">
                  PENTING: Menambahkan user baru akan membuat sesi login Anda saat ini tertutup.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-900">Username</Label>
                <Input id="username" name="username" required placeholder="agus_teknisi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900">Katasandi</Label>
                <Input id="password" name="password" type="password" required placeholder="Min. 6 Karakter" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-900">Role User</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Staff / Teknisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isRegistering}>
                  {isRegistering ? "Mendaftarkan..." : "Daftarkan User Sekarang"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-primary" />
              Ubah Role: {editingUser?.username}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-900">Pilih Role Baru</Label>
              <Select name="role" defaultValue={editingUser?.role || "user"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="user">Staff / Teknisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">Simpan Perubahan Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4 px-6">Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status Device</TableHead>
                <TableHead className="text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => {
                const isPrimaryAdmin = u.username === 'agus' || u.email === 'agus@mtnet.com';
                const effectiveRole = isPrimaryAdmin ? 'admin' : u.role;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="py-4 px-6 font-semibold text-slate-900">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant={effectiveRole === 'admin' ? "default" : "secondary"}>
                        {effectiveRole === 'admin' ? 'ADMIN' : 'STAFF'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.deviceId ? (
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">TERKUNCI</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">TERBUKA</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        {!isPrimaryAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="text-amber-600" title="Reset Device" onClick={() => handleResetDevice(u.id!, u.username)}>
                              <Unlock className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-primary" onClick={() => { setEditingUser(u); setIsRoleDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => deleteUser(u.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
