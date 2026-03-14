
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser as useFirebaseUser } from "@/firebase"
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, UserPlus, UsersRound, ShieldCheck, AlertCircle, Edit2, Shield, Unlock, UserCircle } from "lucide-react"
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
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser || currentUserRole !== 'admin') return null;
    return query(collection(db, "users"), orderBy("username", "asc"));
  }, [db, currentUser, currentUserRole]);
  
  const { data: users } = useCollection(usersQuery);

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

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const formData = new FormData(e.currentTarget);
    const newRole = formData.get("role") as UserRole;
    const newUsername = formData.get("username") as string;

    try {
      await updateDoc(doc(db, "users", editingUser.id), { 
        role: newRole,
        username: newUsername,
        updatedAt: Date.now()
      });
      toast({ title: "Data User Diperbarui" });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal memperbarui user" });
    }
  };

  const resetDeviceId = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { deviceId: null });
      toast({ title: "Akses Perangkat Direset", description: "User sekarang dapat login dari perangkat baru." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal reset perangkat" });
    }
  }

  const deleteUser = async (id: string) => {
    if (confirm("Hapus akses user ini? Tindakan ini permanen.")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast({ title: "Data user dihapus" });
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal menghapus" });
      }
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-96 items-center justify-center animate-pulse text-slate-500 font-medium">Sinkronisasi Keamanan Cloud...</div>;
  }

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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen User</h1>
          <p className="text-slate-500">Kelola akun, role, dan hak akses perangkat tim MTNET.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" /> Registrasi User Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <UsersRound className="h-5 w-5 text-primary" />
                Registrasi Akun Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Alert className="bg-amber-50 border-amber-100 text-amber-800 py-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-[10px]">
                  PENTING: Mendaftarkan user baru dari perangkat ini akan menutup sesi login Anda saat ini secara otomatis.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-900 font-bold">Username</Label>
                <Input id="username" name="username" required placeholder="Contoh: agus_teknisi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900 font-bold">Katasandi</Label>
                <Input id="password" name="password" type="password" required placeholder="Minimal 6 karakter" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-900 font-bold">Role Hak Akses</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator (Akses Penuh)</SelectItem>
                    <SelectItem value="staff">Staff (Operasional)</SelectItem>
                    <SelectItem value="teknisi">Teknisi (Lapangan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-11" disabled={isRegistering}>
                  {isRegistering ? "Memproses Registrasi..." : "Buat Akun Sekarang"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DIALOG EDIT USER (USERNAME & ROLE) */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Profil: {editingUser?.username}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="text-slate-900 font-bold">Ubah Username</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="edit-username" name="username" defaultValue={editingUser?.username} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-slate-900 font-bold">Ubah Role Hak Akses</Label>
              <Select name="role" defaultValue={editingUser?.role || "user"}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator (Akses Penuh)</SelectItem>
                  <SelectItem value="staff">Staff (Operasional)</SelectItem>
                  <SelectItem value="teknisi">Teknisi (Lapangan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-11">Simpan Perubahan Data</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-md overflow-hidden bg-white/60 backdrop-blur-md">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 px-6 text-slate-900 font-bold">Username</TableHead>
                <TableHead className="text-slate-900 font-bold">Role</TableHead>
                <TableHead className="text-slate-900 font-bold">Status Perangkat</TableHead>
                <TableHead className="text-right px-6 text-slate-900 font-bold">Aksi Kelola</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => {
                const isAgus = u.username === 'agus' || u.email === 'agus@mtnet.com' || u.id === 'EdUhRV3odgO5TTzVMPSBAsMFaNP2';
                const currentRole = (u.role as string).toUpperCase();

                return (
                  <TableRow key={u.id} className="hover:bg-slate-50/40 transition-colors">
                    <TableCell className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {isAgus && <Shield className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        {u.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={currentRole === 'ADMIN' ? "default" : "secondary"} className={
                        currentRole === 'ADMIN' ? "bg-primary" : 
                        currentRole === 'STAFF' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }>
                        {currentRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currentRole === 'ADMIN' ? (
                        <span className="text-[10px] text-slate-400 italic">Bypass (Tanpa Kunci)</span>
                      ) : (
                        <Badge variant="outline" className={u.deviceId ? "text-emerald-600 border-emerald-100 bg-emerald-50/50" : "text-slate-400"}>
                          {u.deviceId ? "Perangkat Tertaut" : "Belum Ada Tautan"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        {!isAgus && (
                          <>
                            {u.deviceId && currentRole !== 'ADMIN' && (
                              <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50" title="Reset Tautan Perangkat" onClick={() => resetDeviceId(u.id!)}>
                                <Unlock className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5" title="Edit Data User" onClick={() => { setEditingUser(u); setIsEditUserDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-rose-600 hover:bg-rose-50" title="Hapus User Permanen" onClick={() => deleteUser(u.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isAgus && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3">System Root</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400">Belum ada user terdaftar selain super-admin.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )
}
