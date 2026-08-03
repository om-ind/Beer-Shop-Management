import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/api";
import { toast } from "react-toastify";
import { BookOpen, Search, Edit3, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

const LIQUOR_TYPES = ["Beer", "IMFL", "Wine", "Country Liquor", "Foreign Liquor"];

export default function BrandRegister() {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        const params = filter ? `?liquor_type=${encodeURIComponent(filter)}` : "";
        api.get(`/excise/brand-register${params}`)
            .then(r => setProducts(r.data))
            .catch(() => toast.error("Failed to load brand register"))
            .finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    function startEdit(p) {
        setEditing({
            id: p.id,
            excise_code: p.excise_code || "",
            pack_size_ml: p.pack_size_ml || "",
            liquor_type: p.liquor_type || "",
        });
    }

    async function saveEdit() {
        setSaving(true);
        try {
            await api.put(`/excise/brand-register/${editing.id}`, {
                excise_code: editing.excise_code,
                pack_size_ml: editing.pack_size_ml || null,
                liquor_type: editing.liquor_type || null,
            });
            toast.success("Excise details updated");
            setEditing(null);
            load();
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    }

    const visible = products.filter(p =>
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.excise_code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Excise Brand Register
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Government-mandated brand codes, sizes, and liquor classifications
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search brand code or name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 w-60"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                        >
                            <option value="">All Liquor Types</option>
                            {LIQUOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-sm font-medium">Fetching excise brand master...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Brand & Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Excise Code</TableHead>
                                        <TableHead>Pack Size (ml)</TableHead>
                                        <TableHead>Liquor Type</TableHead>
                                        <TableHead className="text-right">Current Stock</TableHead>
                                        <TableHead className="text-right">MRP (₹)</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visible.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                                <BookOpen className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No brand entries matching filter</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        visible.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                    <div>{p.name}</div>
                                                    <div className="text-xs text-slate-400 font-normal">{p.brand}</div>
                                                </TableCell>
                                                <TableCell>{p.category || "—"}</TableCell>
                                                <TableCell className="font-mono text-xs text-slate-500">
                                                    {p.excise_code ? (
                                                        <Badge variant="outline" className="font-mono">{p.excise_code}</Badge>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{p.pack_size_ml ? `${p.pack_size_ml} ml` : "—"}</TableCell>
                                                <TableCell>
                                                    {p.liquor_type ? (
                                                        <Badge variant="secondary">{p.liquor_type}</Badge>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">{p.stock}</TableCell>
                                                <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                                    ₹{p.selling_price?.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => startEdit(p)}
                                                        className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog
                    isOpen={!!editing}
                    onClose={() => setEditing(null)}
                    title="Edit Excise Master Details"
                >
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Excise Brand Code</label>
                            <Input
                                placeholder="e.g. MH-BEER-0042"
                                value={editing?.excise_code || ""}
                                onChange={e => setEditing(v => ({ ...v, excise_code: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pack Size (ml)</label>
                            <Input
                                type="number"
                                placeholder="e.g. 650"
                                value={editing?.pack_size_ml || ""}
                                onChange={e => setEditing(v => ({ ...v, pack_size_ml: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Liquor Classification</label>
                            <select
                                value={editing?.liquor_type || ""}
                                onChange={e => setEditing(v => ({ ...v, liquor_type: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                            >
                                <option value="">— Select Type —</option>
                                {LIQUOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end pt-3">
                            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button variant="gradient" disabled={saving} onClick={saveEdit} className="text-slate-950 font-bold">
                                {saving ? "Saving..." : "Save Excise Details"}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
