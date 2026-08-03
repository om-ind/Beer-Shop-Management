import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { Shield, UserPlus, Edit3, Trash2, Key, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

const ROLE_OPTIONS = ["Owner", "Manager", "Cashier"];

export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);

    const [form, setForm] = useState({
        full_name: "",
        username: "",
        password: "",
        role: "Cashier",
    });
    const [newPass, setNewPass] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await getUsers();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                toast.error(data?.message || "Failed to load users");
            }
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    function handleOpenCreate() {
        setForm({ full_name: "", username: "", password: "", role: "Cashier" });
        setShowAddModal(true);
    }

    function handleOpenEdit(user) {
        setEditTarget(user);
        setForm({ full_name: user.full_name || "", username: user.username || "", password: "", role: user.role || "Cashier" });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!editTarget && form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setSaving(true);
        try {
            if (editTarget) {
                const res = await updateUser(editTarget.id, { full_name: form.full_name, role: form.role });
                if (res.success) {
                    toast.success("User updated");
                    setEditTarget(null);
                    loadUsers();
                } else {
                    toast.error(res.message || "Failed to update");
                }
            } else {
                const res = await createUser(form);
                if (res.success) {
                    toast.success("User created successfully!");
                    setShowAddModal(false);
                    loadUsers();
                } else {
                    toast.error(res.message || "Failed to create user");
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        if (newPass.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setSaving(true);
        try {
            const res = await resetUserPassword(resetTarget.id, newPass);
            if (res.success) {
                toast.success("Password reset successfully!");
                setResetTarget(null);
                setNewPass("");
            } else {
                toast.error(res.message || "Failed to reset password");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleActive(user) {
        try {
            const res = await updateUser(user.id, { is_active: !user.is_active });
            if (res.success) {
                toast.success(`User ${user.is_active ? "deactivated" : "activated"}`);
                loadUsers();
            } else {
                toast.error(res.message || "Failed to update status");
            }
        } catch {
            toast.error("Failed to update user status");
        }
    }

    async function handleDelete(user) {
        if (!window.confirm(`Delete user "@${user.username}"?`)) return;
        try {
            const res = await deleteUser(user.id);
            if (res.success) {
                toast.success("User deleted");
                loadUsers();
            } else {
                toast.error(res.message || "Failed to delete user");
            }
        } catch {
            toast.error("Failed to delete user");
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                User Control & Roles
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Manage staff credentials, permissions, and status
                            </p>
                        </div>
                    </div>

                    <Button variant="gradient" onClick={handleOpenCreate} className="text-slate-950 font-bold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span>Add New Staff</span>
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <p className="text-sm font-medium">Fetching registered users...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user, i) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                {user.full_name || "—"}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500">
                                                @{user.username}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_active ? (
                                                    <Badge variant="success" className="gap-1 text-[11px]">
                                                        <CheckCircle2 className="h-3 w-3" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="gap-1 text-[11px]">
                                                        <XCircle className="h-3 w-3" /> Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                                                        title="Edit User"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setResetTarget(user)}
                                                        className="h-8 w-8 text-purple-600 hover:bg-purple-500/10"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(user)}
                                                        className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Add / Edit Dialog */}
                <Dialog
                    isOpen={showAddModal || !!editTarget}
                    onClose={() => { setShowAddModal(false); setEditTarget(null); }}
                    title={editTarget ? "Edit User Permissions" : "Add New Staff Member"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                            <Input
                                type="text" required
                                placeholder="e.g. Ramesh Patel"
                                value={form.full_name}
                                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                            />
                        </div>

                        {!editTarget && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                                    <Input
                                        type="text" required
                                        placeholder="e.g. ramesh_cashier"
                                        value={form.username}
                                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                                    <Input
                                        type="password" required minLength={6}
                                        placeholder="Minimum 6 characters"
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                            <select
                                value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                            >
                                {ROLE_OPTIONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end pt-3">
                            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditTarget(null); }}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                {saving ? "Saving..." : editTarget ? "Update User" : "Create User"}
                            </Button>
                        </div>
                    </form>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog
                    isOpen={!!resetTarget}
                    onClose={() => setResetTarget(null)}
                    title={`Reset Password — @${resetTarget?.username}`}
                >
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                            <Input
                                type="password" required minLength={6}
                                placeholder="Enter new password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-3">
                            <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                {saving ? "Resetting..." : "Confirm Reset"}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </div>
        </AdminLayout>
    );
}