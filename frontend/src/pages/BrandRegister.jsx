import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

const LIQUOR_TYPES = ["Beer", "IMFL", "Wine", "Country Liquor", "Foreign Liquor"];

const TYPE_COLOR = {
    "Beer":           "bg-amber-400/20 text-amber-300 border-amber-400/30",
    "IMFL":           "bg-blue-400/20 text-blue-300 border-blue-400/30",
    "Wine":           "bg-purple-400/20 text-purple-300 border-purple-400/30",
    "Country Liquor": "bg-orange-400/20 text-orange-300 border-orange-400/30",
    "Foreign Liquor": "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
};

export default function BrandRegister() {
    const [products, setProducts] = useState([]);
    const [filter, setFilter]     = useState("");
    const [search, setSearch]     = useState("");
    const [editing, setEditing]   = useState(null); // { id, excise_code, pack_size_ml, liquor_type }
    const [saving, setSaving]     = useState(false);
    const [loading, setLoading]   = useState(true);

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
            id:           p.id,
            excise_code:  p.excise_code  || "",
            pack_size_ml: p.pack_size_ml || "",
            liquor_type:  p.liquor_type  || "",
        });
    }

    async function saveEdit() {
        setSaving(true);
        try {
            await api.put(`/excise/brand-register/${editing.id}`, {
                excise_code:  editing.excise_code,
                pack_size_ml: editing.pack_size_ml || null,
                liquor_type:  editing.liquor_type  || null,
            });
            toast.success("Saved");
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

    const grouped = LIQUOR_TYPES.reduce((acc, t) => {
        const items = visible.filter(p => p.liquor_type === t);
        if (items.length) acc[t] = items;
        return acc;
    }, {});
    const ungrouped = visible.filter(p => !p.liquor_type);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Brand Register</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Excise-mandated brand master with codes and pack sizes</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <input
                        className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search brand / name / code…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {LIQUOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-slate-400 text-center py-20">Loading…</div>
            ) : (
                <div className="space-y-6">
                    {[...Object.entries(grouped), ...(ungrouped.length ? [["Uncategorised", ungrouped]] : [])].map(([type, items]) => (
                        <div key={type}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${TYPE_COLOR[type] || "bg-slate-700 text-slate-300 border-slate-600"}`}>
                                    {type}
                                </span>
                                <span className="text-slate-500 text-xs">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-slate-700">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Brand / Name</th>
                                            <th className="px-4 py-3 text-left">Category</th>
                                            <th className="px-4 py-3 text-left">Excise Code</th>
                                            <th className="px-4 py-3 text-left">Pack Size (ml)</th>
                                            <th className="px-4 py-3 text-left">Liquor Type</th>
                                            <th className="px-4 py-3 text-right">Stock</th>
                                            <th className="px-4 py-3 text-right">MRP (₹)</th>
                                            <th className="px-4 py-3 text-center">Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {items.map(p => (
                                            <tr key={p.id} className="bg-slate-900 hover:bg-slate-800/60 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="text-white font-medium">{p.name}</p>
                                                    <p className="text-slate-400 text-xs">{p.brand}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{p.category || "—"}</td>
                                                <td className="px-4 py-3">
                                                    {p.excise_code
                                                        ? <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-blue-300 text-xs">{p.excise_code}</span>
                                                        : <span className="text-slate-500 text-xs italic">Not set</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{p.pack_size_ml ? `${p.pack_size_ml} ml` : "—"}</td>
                                                <td className="px-4 py-3">
                                                    {p.liquor_type
                                                        ? <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOR[p.liquor_type] || ""}`}>{p.liquor_type}</span>
                                                        : <span className="text-slate-500 text-xs italic">Not set</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-300">{p.stock}</td>
                                                <td className="px-4 py-3 text-right text-slate-300">₹{p.selling_price?.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => startEdit(p)}
                                                        className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-1.5 rounded-lg transition-colors border border-blue-600/30"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {visible.length === 0 && (
                        <div className="text-center py-20 text-slate-500">No products found</div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-white font-bold text-lg mb-5">Update Excise Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Excise Brand Code</label>
                                <input
                                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    placeholder="e.g. MH-BEER-0042"
                                    value={editing.excise_code}
                                    onChange={e => setEditing(v => ({ ...v, excise_code: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Pack Size (ml)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 650"
                                    value={editing.pack_size_ml}
                                    onChange={e => setEditing(v => ({ ...v, pack_size_ml: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 text-xs uppercase tracking-wide block mb-1.5">Liquor Type</label>
                                <select
                                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editing.liquor_type}
                                    onChange={e => setEditing(v => ({ ...v, liquor_type: e.target.value }))}
                                >
                                    <option value="">— Select —</option>
                                    {LIQUOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditing(null)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
                            >Cancel</button>
                            <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >{saving ? "Saving…" : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
