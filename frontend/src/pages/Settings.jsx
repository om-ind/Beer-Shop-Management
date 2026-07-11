import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { changeMyPassword } from "../services/userService";
import { toast } from "react-toastify";
import {
    FaUser,
    FaShieldAlt,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaSignOutAlt,
} from "react-icons/fa";

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

    const ROLE_COLORS = {
        Owner: "bg-yellow-100 text-yellow-800",
        Manager: "bg-blue-100 text-blue-800",
        Cashier: "bg-green-100 text-green-800",
    };

    return (
        <AdminLayout>
            <Navbar />

            <div className="max-w-2xl mx-auto space-y-6 p-2">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account preferences</p>
                </div>

                {/* ── Profile Card ── */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <FaUser className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center text-2xl font-bold shadow">
                            {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                            <p className="text-xl font-bold text-gray-800">{user?.full_name || "—"}</p>
                            <p className="text-gray-500 font-mono text-sm">@{user?.username}</p>
                            <span className={`mt-1.5 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user?.role] || "bg-gray-100 text-gray-700"}`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">Username</p>
                            <p className="font-semibold text-gray-700 font-mono">@{user?.username}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-400 mb-1">User ID</p>
                            <p className="font-semibold text-gray-700">#{user?.id}</p>
                        </div>
                    </div>
                </div>

                {/* ── Change Password ── */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <FaShieldAlt className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">

                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    required
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrent ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                                <input
                                    type={showNew ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Minimum 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" size={14} />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full border rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${confirmPassword && confirmPassword !== newPassword
                                            ? "border-red-400 focus:ring-red-400"
                                            : "border-gray-300"}`}
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition shadow mt-2"
                        >
                            {saving ? "Saving..." : "Change Password"}
                        </button>
                    </form>
                </div>

                {/* ── Danger Zone ── */}
                <div className="bg-white rounded-2xl shadow p-6 border border-red-100">
                    <div className="flex items-center gap-3 mb-4">
                        <FaSignOutAlt className="text-red-500" size={18} />
                        <h2 className="text-lg font-bold text-gray-800">Session</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        You are currently signed in as <strong>@{user?.username}</strong>.
                        Signing out will clear your session.
                    </p>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-xl transition border border-red-200"
                    >
                        <FaSignOutAlt />
                        Sign Out
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
