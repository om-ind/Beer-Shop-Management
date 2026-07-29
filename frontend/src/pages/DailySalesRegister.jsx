import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function DailySalesRegister() {
    const [date, setDate]       = useState(today());
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [editRow, setEditRow] = useState(null); // row being edited inline
    const [saving, setSaving]   = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/excise/daily-register?date=${date}`)
            .then(r => setRows(r.data.rows || []))
            .catch(() => toast.error("Failed to load register"))
            .finally(() => setLoading(false));
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const isLocked = rows.length > 0 && rows.every(r => r.is_locked);

    async function saveRow(row) {
        setSaving(true);
        try {
            await api.post("/excise/daily-register/save", {
                sale_date:     date,
                product_id:    row.product_id,
                opening_stock: Number(row.opening_stock),
                qty_received:  Number(row.qty_received),
                qty_sold:      Number(row.qty_sold),
                sale_value:    Number(row.sale_value),
            });
            toast.success("Row saved");
            setEditRow(null);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function lockDay() {
        if (!window.confirm(`Lock the register for ${date}? This cannot be undone.`)) return;
        setLocking(true);
        try {
            await api.post("/excise/daily-register/lock", { date });
            toast.success(`Register locked for ${date}`);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Lock failed");
        } finally {
            setLocking(false);
        }
    }

    function printRegister() { window.print(); }

    const totals = rows.reduce((acc, r) => {
        acc.qty_received += Number(r.qty_received);
        acc.qty_sold     += Number(r.qty_sold);
        acc.sale_value   += Number(r.sale_value);
        return acc;
    }, { qty_received: 0, qty_sold: 0, sale_value: 0 });

    return (
        <div className="p-6 space-y-6 print:p-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-white">Daily Sales Register</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Statutory daily sales record for excise submission</p>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={printRegister}
                        className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors"
                    >🖨 Print</button>
                    {!isLocked && rows.length > 0 && (
                        <button
                            onClick={lockDay}
                            disabled={locking}
                            className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/40 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                        >{locking ? "Locking…" : "🔒 Lock Day"}</button>
                    )}
                    {isLocked && (
                        <span className="px-4 py-2 text-sm bg-green-600/20 text-green-300 border border-green-600/40 rounded-lg font-semibold">
                            ✅ Locked
                        </span>
                    )}
                </div>
            </div>

            {/* Print header (visible only in print) */}
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold">Daily Statutory Sales Register</h1>
                <p className="text-sm">Date: {date}</p>
            </div>

            {loading ? (
                <div className="text-slate-400 text-center py-20">Loading…</div>
            ) : rows.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-slate-400">No sales or purchases found for {date}</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-black">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 print:bg-gray-200 text-slate-400 print:text-black text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Sr</th>
                                    <th className="px-4 py-3 text-left">Brand / Product</th>
                                    <th className="px-4 py-3 text-left">Excise Code</th>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-right">Pack (ml)</th>
                                    <th className="px-4 py-3 text-right">Opening</th>
                                    <th className="px-4 py-3 text-right">Received</th>
                                    <th className="px-4 py-3 text-right">Sold</th>
                                    <th className="px-4 py-3 text-right">Closing</th>
                                    <th className="px-4 py-3 text-right">Sale Value (₹)</th>
                                    <th className="px-4 py-3 text-center print:hidden">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 print:divide-gray-300">
                                {rows.map((r, i) => {
                                    const isEditing = editRow?.product_id === r.product_id;
                                    const cur = isEditing ? editRow : r;
                                    const closing = Number(cur.opening_stock) + Number(cur.qty_received) - Number(cur.qty_sold);

                                    return (
                                        <tr key={r.product_id} className="bg-slate-900 print:bg-white hover:bg-slate-800/60 transition-colors">
                                            <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-white print:text-black font-medium">{r.name}</p>
                                                <p className="text-slate-400 print:text-gray-500 text-xs">{r.brand}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.excise_code
                                                    ? <span className="font-mono text-xs bg-slate-700 print:bg-gray-100 px-2 py-0.5 rounded text-blue-300 print:text-blue-800">{r.excise_code}</span>
                                                    : <span className="text-slate-500 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-slate-300 print:text-gray-700 text-xs">{r.liquor_type || "—"}</td>
                                            <td className="px-4 py-3 text-right text-slate-300 print:text-gray-700">{r.pack_size_ml || "—"}</td>

                                            {/* Editable cells */}
                                            {["opening_stock", "qty_received", "qty_sold"].map(field => (
                                                <td key={field} className="px-4 py-3 text-right">
                                                    {isEditing && !r.is_locked ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 bg-slate-700 border border-slate-500 text-white text-sm text-right px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            value={cur[field]}
                                                            onChange={e => setEditRow(v => ({ ...v, [field]: e.target.value }))}
                                                        />
                                                    ) : (
                                                        <span className="text-slate-200 print:text-black">{r[field]}</span>
                                                    )}
                                                </td>
                                            ))}

                                            <td className="px-4 py-3 text-right font-semibold text-white print:text-black">{closing}</td>
                                            <td className="px-4 py-3 text-right text-green-400 print:text-green-800 font-medium">
                                                ₹{Number(cur.sale_value).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center print:hidden">
                                                {r.is_locked ? (
                                                    <span className="text-xs text-green-400">🔒</span>
                                                ) : isEditing ? (
                                                    <div className="flex gap-1 justify-center">
                                                        <button
                                                            onClick={() => saveRow({ ...editRow, closing_stock: closing })}
                                                            disabled={saving}
                                                            className="text-xs bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-600/30 px-2 py-1 rounded transition-colors"
                                                        >Save</button>
                                                        <button
                                                            onClick={() => setEditRow(null)}
                                                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                                                        >Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditRow({ ...r })}
                                                        className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg transition-colors"
                                                    >Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-800/80 print:bg-gray-100 text-white print:text-black font-bold text-sm">
                                <tr>
                                    <td colSpan={6} className="px-4 py-3 text-slate-400 print:text-gray-600 font-normal">TOTALS</td>
                                    <td className="px-4 py-3 text-right">{totals.qty_received}</td>
                                    <td className="px-4 py-3 text-right">{totals.qty_sold}</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right text-green-400 print:text-green-800">₹{totals.sale_value.toFixed(2)}</td>
                                    <td className="print:hidden"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Print footer */}
                    <div className="hidden print:flex justify-between mt-8 text-sm">
                        <div>Prepared by: _______________</div>
                        <div>Shop Seal & Signature: _______________</div>
                    </div>
                </>
            )}
        </div>
    );
}
