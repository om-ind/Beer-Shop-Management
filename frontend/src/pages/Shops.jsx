import { useEffect, useState } from "react";
import { getAllShops, createShop, updateShop, deactivateShop, getShopStats } from "../services/shopsService";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Building2, Plus, Edit3, CheckCircle2, XCircle, Eye, Users, Phone, MapPin, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Dialog } from "../components/ui/dialog";

export default function Shops() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editShop, setEditShop] = useState(null);
    const [viewShop, setViewShop] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: "", address: "", phone: "", owner_name: "",
        owner_username: "", owner_password: ""
    });

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

    function handleOpenCreate() {
        setForm({ name: "", address: "", phone: "", owner_name: "", owner_username: "", owner_password: "" });
        setCreateOpen(true);
    }

    function handleOpenEdit(shop) {
        setEditShop(shop);
        setForm({ name: shop.name, address: shop.address || "", phone: shop.phone || "", owner_name: shop.owner_name || "", owner_username: "", owner_password: "" });
    }

    async function handleOpenView(shop) {
        setViewShop(shop);
        setStatsLoading(true);
        try {
            const res = await getShopStats(shop.id);
            setStats(res);
        } catch {
            toast.error("Failed to load shop stats");
        } finally {
            setStatsLoading(false);
        }
    }

    async function handleCreateSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await createShop(form);
            if (res.success) {
                toast.success(res.message);
                setCreateOpen(false);
                fetchShops();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Creation failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateShop(editShop.id, form);
            if (res.success) {
                toast.success("Shop updated");
                setEditShop(null);
                fetchShops();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    }

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
            toast.error("Operation failed");
        }
    }

    const filtered = shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.owner_name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
                                Shops Directory
                            </h1>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Multi-tenant beer shop account management
                            </p>
                        </div>
                    </div>

                    <Button variant="gradient" onClick={handleOpenCreate} className="text-slate-950 font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add New Shop</span>
                    </Button>
                </div>

                {/* Search */}
                <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-4">
                        <Input
                            placeholder="Filter shops by name or owner name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white"
                        />
                    </CardContent>
                </Card>

                {/* Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        <p className="text-sm font-medium">Fetching registered shops...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(shop => (
                            <Card key={shop.id} className="border-slate-800 bg-slate-900 text-white flex flex-col justify-between">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-white">{shop.name}</CardTitle>
                                        <p className="text-xs text-slate-400">ID #{shop.id}</p>
                                    </div>
                                    {shop.is_active ? (
                                        <Badge variant="success" className="gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="gap-1">
                                            <XCircle className="h-3 w-3" /> Inactive
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5 text-xs text-slate-300">
                                        {shop.owner_name && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5 text-slate-500" />
                                                <span>Owner: {shop.owner_name}</span>
                                            </div>
                                        )}
                                        {shop.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-500" />
                                                <span>{shop.phone}</span>
                                            </div>
                                        )}
                                        {shop.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="truncate">{shop.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenView(shop)} className="flex-1 text-xs">
                                            <Eye className="h-3.5 w-3.5 mr-1" /> Stats
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(shop)} className="flex-1 text-xs">
                                            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={shop.is_active ? "destructive" : "default"}
                                            onClick={() => handleToggleActive(shop)}
                                            className="flex-1 text-xs"
                                        >
                                            {shop.is_active ? "Disable" : "Enable"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                <Dialog isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Register New Shop Tenant">
                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shop Name</label>
                            <Input required placeholder="e.g. Royal Beer Shop" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
                            <Input placeholder="Shop address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
                            <Input placeholder="Mobile number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Owner Full Name</label>
                            <Input placeholder="Owner full name" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Owner Username</label>
                                <Input required placeholder="Login username" value={form.owner_username} onChange={e => setForm(f => ({ ...f, owner_username: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Owner Password</label>
                                <Input required minLength={6} type="password" placeholder="Min 6 chars" value={form.owner_password} onChange={e => setForm(f => ({ ...f, owner_password: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-3">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                {saving ? "Creating..." : "Create Tenant"}
                            </Button>
                        </div>
                    </form>
                </Dialog>

                {/* Edit Modal */}
                <Dialog isOpen={!!editShop} onClose={() => setEditShop(null)} title={`Edit Shop — ${editShop?.name}`}>
                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shop Name</label>
                            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
                            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
                            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 justify-end pt-3">
                            <Button type="button" variant="outline" onClick={() => setEditShop(null)}>Cancel</Button>
                            <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Dialog>

                {/* Stats Dialog */}
                <Dialog isOpen={!!viewShop} onClose={() => setViewShop(null)} title={`Shop Analytics — ${viewShop?.name}`}>
                    <div className="space-y-4 pt-2">
                        {statsLoading ? (
                            <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                                <span>Computing tenant analytics...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                    <span className="text-slate-400 font-bold uppercase block">Products</span>
                                    <span className="text-lg font-bold">{stats?.total_products || 0}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                    <span className="text-slate-400 font-bold uppercase block">Customers</span>
                                    <span className="text-lg font-bold">{stats?.total_customers || 0}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                    <span className="text-slate-400 font-bold uppercase block">Revenue</span>
                                    <span className="text-lg font-bold text-emerald-600">₹{Number(stats?.total_revenue || 0).toFixed(2)}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900">
                                    <span className="text-slate-400 font-bold uppercase block">Profit</span>
                                    <span className="text-lg font-bold text-purple-600">₹{Number(stats?.total_profit || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={() => setViewShop(null)}>Close</Button>
                        </div>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
