import { useEffect, useState } from "react";
import { getAllShops, createShop, updateShop, deactivateShop, getShopStats } from "../services/shopsService";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import {
    FaStore, FaPlus, FaEdit, FaTrash, FaCheckCircle,
    FaTimesCircle, FaTimes, FaUsers, FaRupeeSign, FaShoppingBag,
    FaPhone, FaMapMarkerAlt, FaUser, FaEye, FaChartBar
} from "react-icons/fa";

// ─────────────────────────────────
// Create Shop Modal
// ─────────────────────────────────
function CreateShopModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "", address: "", phone: "", owner_name: "",
        owner_username: "", owner_password: ""
    });
    const [saving, setSaving] = useState(false);

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await createShop(form);
            if (res.success) {
                toast.success(res.message);
                onCreated();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    const inputCls = "w-full bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500 transition";

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <FaStore className="text-purple-400" /> Create New Shop
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Shop Details</p>
                        <div className="space-y-3">
                            <input name="name" placeholder="Shop Name *" value={form.name} onChange={handleChange} className={inputCls} required />
                            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className={inputCls} />
                            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className={inputCls} />
                            <input name="owner_name" placeholder="Owner Full Name" value={form.owner_name} onChange={handleChange} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Owner Login Credentials</p>
                        <div className="space-y-3">
                            <input name="owner_username" placeholder="Owner Username *" value={form.owner_username} onChange={handleChange} className={inputCls} required />
                            <input name="owner_password" type="password" placeholder="Owner Password * (min 6 chars)" value={form.owner_password} onChange={handleChange} className={inputCls} required minLength={6} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition disabled:opacity-60">
                            {saving ? "Creating…" : "Create Shop"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────
// Edit Shop Modal
// ─────────────────────────────────
function EditShopModal({ shop, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: shop.name, address: shop.address || "", phone: shop.phone || "", owner_name: shop.owner_name || ""
    });
    const [saving, setSaving] = useState(false);

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateShop(shop.id, form);
            if (res.success) {
                toast.success("Shop updated");
                onSaved();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    const inputCls = "w-full bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500 transition";

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2"><FaEdit className="text-blue-400" /> Edit Shop</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    <input name="name" placeholder="Shop Name *" value={form.name} onChange={handleChange} className={inputCls} required />
                    <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className={inputCls} />
                    <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className={inputCls} />
                    <input name="owner_name" placeholder="Owner Name" value={form.owner_name} onChange={handleChange} className={inputCls} />
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────
// Shop Stats Drawer
// ─────────────────────────────────
function ShopStatsDrawer({ shop, onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getShopStats(shop.id)
            .then(setStats)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [shop.id]);

    const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <FaStore className="text-purple-400" /> {shop.name}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><FaTimes /></button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : (
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Products", value: stats?.total_products || 0, icon: <FaShoppingBag />, color: "text-blue-400" },
                                { label: "Customers", value: stats?.total_customers || 0, icon: <FaUsers />, color: "text-emerald-400" },
                                { label: "Total Revenue", value: fmt(stats?.total_revenue), icon: <FaRupeeSign />, color: "text-amber-400" },
                                { label: "Total Profit", value: fmt(stats?.total_profit), icon: <FaChartBar />, color: "text-purple-400" },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-700/50 rounded-xl p-4">
                                    <p className={`text-lg ${s.color}`}>{s.icon}</p>
                                    <p className="text-white font-bold text-lg mt-1">{s.value}</p>
                                    <p className="text-slate-400 text-xs">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Users</p>
                            <div className="space-y-2">
                                {(stats?.users || []).map(u => (
                                    <div key={u.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">
                                                {u.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{u.full_name || u.username}</p>
                                                <p className="text-slate-400 text-xs">@{u.username}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "Owner" ? "bg-yellow-500/20 text-yellow-400" : u.role === "Manager" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                                {!stats?.users?.length && <p className="text-slate-500 text-sm text-center py-2">No users found</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────
// Main Shops Page
// ─────────────────────────────────
export default function Shops() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editShop, setEditShop] = useState(null);
    const [viewShop, setViewShop] = useState(null);
    const [search, setSearch] = useState("");

    async function fetchShops() {
        setLoading(true);
        try {
            const data = await getAllShops();
            setShops(data);
        } catch {
            toast.error("Failed to load shops");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchShops(); }, []);

    async function handleToggleActive(shop) {
        const label = shop.is_active ? "deactivate" : "reactivate";
        if (!window.confirm(`Are you sure you want to ${label} "${shop.name}"?`)) return;

        try {
            let res;
            if (shop.is_active) {
                res = await deactivateShop(shop.id);
            } else {
                res = await updateShop(shop.id, { is_active: true });
            }
            if (res.success) {
                toast.success(`Shop ${label}d`);
                fetchShops();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Something went wrong");
        }
    }

    const filtered = shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.owner_name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
        <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FaStore className="text-purple-400" /> All Shops
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage all registered beer shops</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm shadow-lg shadow-purple-600/30 transition"
                >
                    <FaPlus /> New Shop
                </button>
            </div>

            {/* Search */}
            <div className="mb-5">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by shop name or owner…"
                    className="w-full max-w-sm bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                />
            </div>

            {/* Shops Grid */}
            {loading ? (
                <div className="text-center text-slate-400 py-20">Loading shops…</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(shop => (
                        <div key={shop.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col gap-4">

                            {/* Top Row */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 text-lg">
                                        🍺
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-base">{shop.name}</h3>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${shop.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                            {shop.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-slate-500 text-xs">#{shop.id}</span>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5">
                                {shop.owner_name && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <FaUser className="text-xs flex-shrink-0" /> {shop.owner_name}
                                    </div>
                                )}
                                {shop.phone && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <FaPhone className="text-xs flex-shrink-0" /> {shop.phone}
                                    </div>
                                )}
                                {shop.address && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <FaMapMarkerAlt className="text-xs flex-shrink-0" /> {shop.address}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <FaUsers className="text-xs flex-shrink-0" /> {shop.user_count} user{shop.user_count !== 1 ? "s" : ""}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => setViewShop(shop)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                                >
                                    <FaEye /> View Stats
                                </button>
                                <button
                                    onClick={() => setEditShop(shop)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition"
                                >
                                    <FaEdit /> Edit
                                </button>
                                <button
                                    onClick={() => handleToggleActive(shop)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${shop.is_active ? "bg-red-500/10 hover:bg-red-500/20 text-red-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"}`}
                                >
                                    {shop.is_active ? <><FaTimesCircle /> Deactivate</> : <><FaCheckCircle /> Reactivate</>}
                                </button>
                            </div>
                        </div>
                    ))}

                    {!filtered.length && !loading && (
                        <div className="col-span-3 text-center text-slate-500 py-20 text-sm">
                            {search ? "No shops match your search." : "No shops yet. Create your first shop!"}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {createOpen && (
                <CreateShopModal
                    onClose={() => setCreateOpen(false)}
                    onCreated={fetchShops}
                />
            )}

            {editShop && (
                <EditShopModal
                    shop={editShop}
                    onClose={() => setEditShop(null)}
                    onSaved={fetchShops}
                />
            )}

            {viewShop && (
                <ShopStatsDrawer
                    shop={viewShop}
                    onClose={() => setViewShop(null)}
                />
            )}
        </div>
        </AdminLayout>
    );
}
