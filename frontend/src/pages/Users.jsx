import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
} from "../services/userService";
import {
    FaUserPlus,
    FaTrash,
    FaToggleOn,
    FaToggleOff,
    FaKey,
    FaTimes,
    FaCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ROLE_COLORS = {
    Owner: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    Manager: "bg-blue-100 text-blue-800 border border-blue-300",
    Cashier: "bg-green-100 text-green-800 border border-green-300",
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add User Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        password: "",
        role: "Cashier",
    });

    // Reset Password Modal
    const [resetTarget, setResetTarget] = useState(null);
    const [newPass, setNewPass] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddUser(e) {
        e.preventDefault();
        try {
            await createUser(form);
            toast.success("User created successfully!");
            setShowAddModal(false);
            setForm({ full_name: "", username: "", password: "", role: "Cashier" });
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create user");
        }
    }

    async function handleToggleActive(user) {
        try {
            await updateUser(user.id, { is_active: !user.is_active });
            toast.success(`User ${user.is_active ? "deactivated" : "activated"}`);
            loadUsers();
        } catch {
            toast.error("Failed to update user status");
        }
    }

    async function handleDelete(user) {
        if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
        try {
            await deleteUser(user.id);
            toast.success("User deleted");
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete user");
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        if (newPass.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        try {
            await resetUserPassword(resetTarget.id, newPass);
            toast.success("Password reset successfully!");
            setResetTarget(null);
            setNewPass("");
        } catch {
            toast.error("Failed to reset password");
        }
    }

    return (
        <AdminLayout>
            <Navbar />

            <div className="p-2">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-500 mt-1">Manage system users and their roles</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow"
                    >
                        <FaUserPlus />
                        Add User
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading users...</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">#</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Name</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Username</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Role</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Status</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Created</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user, i) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="py-4 px-6 text-gray-500 text-sm">{i + 1}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                                                    {user.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-800">
                                                    {user.full_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 font-mono text-sm">
                                            @{user.username}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.is_active ? (
                                                <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                                    <FaCheck size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                                                    <FaTimes size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-gray-500 text-sm">
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString("en-IN")
                                                : "—"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {/* Toggle Active */}
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    title={user.is_active ? "Deactivate" : "Activate"}
                                                    className={`p-2 rounded-lg transition ${user.is_active
                                                        ? "text-green-600 hover:bg-green-50"
                                                        : "text-gray-400 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    {user.is_active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                                </button>

                                                {/* Reset Password */}
                                                <button
                                                    onClick={() => { setResetTarget(user); setNewPass(""); }}
                                                    title="Reset Password"
                                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition"
                                                >
                                                    <FaKey size={15} />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    title="Delete User"
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400">
                                            No users found. Click "Add User" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ─── Add User Modal ─── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Om Bhanushali"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. om123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Cashier">Cashier</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Owner">Owner</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Reset Password Modal ─── */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                            <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-700">
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">
                                Resetting password for <strong>@{resetTarget.username}</strong>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setResetTarget(null)}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}