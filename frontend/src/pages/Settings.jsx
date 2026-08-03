import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { changeMyPassword } from "../services/userService";
import { toast } from "react-toastify";
import { Settings as SettingsIcon, User, ShieldCheck, Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

export default function Settings() {
    const { user, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    async function handleChangePassword(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        setSaving(true);
        try {
            await changeMyPassword(user.username, currentPassword, newPassword);
            toast.success("Password changed successfully! Please login again.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => logout(), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <SettingsIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                            Account Settings
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Manage user credentials, security keys, and active session
                        </p>
                    </div>
                </div>

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <User className="h-5 w-5 text-amber-500" />
                            <span>Profile Summary</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold text-2xl font-display shadow-lg shadow-amber-500/20">
                                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.full_name || "—"}</h2>
                                <p className="text-sm font-mono text-slate-400">@{user?.username}</p>
                                <Badge variant="warning" className="mt-1">
                                    {user?.role || "User"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Username</span>
                                <span className="text-sm font-mono font-bold">@{user?.username}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">System ID</span>
                                <span className="text-sm font-bold">#{user?.id}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-amber-500" />
                            <span>Security & Credentials</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Password</label>
                                <div className="relative">
                                    <Input
                                        type={showCurrent ? "text" : "password"}
                                        required
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        required minLength={6}
                                        placeholder="Minimum 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        required
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" variant="gradient" disabled={saving} className="w-full text-slate-950 font-bold">
                                {saving ? "Updating Security..." : "Change Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Session Card */}
                <Card className="border-red-500/20">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-red-500 flex items-center gap-2">
                            <LogOut className="h-5 w-5" />
                            <span>Sign Out Session</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-slate-500">End your active session on this device.</p>
                        <Button variant="destructive" onClick={logout} className="w-full">
                            Sign Out Account
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
