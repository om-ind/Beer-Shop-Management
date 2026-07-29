import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

export default function ExciseStatement() {
    const now   = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year,  setYear]  = useState(now.getFullYear());
    const [data,  setData]  = useState(null);
    const [loading, setLoading]   = useState(false);
    const [exporting, setExporting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/excise/monthly-statement?month=${month}&year=${year}`)
            .then(r => setData(r.data))
            .catch(() => toast.error("Failed to load statement"))
            .finally(() => setLoading(false));
    }, [month, year]);

    useEffect(() => { load(); }, [load]);

    async function exportCSV() {
        setExporting(true);
        try {
            const res = await api.get(
                `/excise/monthly-statement/export?month=${month}&year=${year}`,
                { responseType: "blob" }
            );
            const url  = URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href  = url;
            link.download = `excise_statement_${year}_${String(month).padStart(2,"0")}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    }

    const rows    = data?.rows    || [];
    const totals  = data?.totals  || {};

    const YEARS = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) YEARS.push(y);

    return (
        <div className="p-6 space-y-6 print:p-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-white">Monthly Excise Statement</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Monthly stock movement report for excise department submission</p>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                    <select
                        value={month}
                        onChange={e => setMonth(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors"
                    >🖨 Print</button>
                    <button
                        onClick={exportCSV}
                        disabled={exporting || rows.length === 0}
                        className="px-4 py-2 text-sm bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-600/40 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >{exporting ? "Exporting…" : "⬇ Export CSV"}</button>
                </div>
            </div>

            {/* Print header */}
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold">Monthly Excise Statement</h1>
                <p className="text-sm font-semibold">{MONTHS[month - 1]} {year}</p>
                <p className="text-xs mt-1">Statement of stock received, sold, and balance</p>
            </div>

            {/* Summary cards */}
            {data && !loading && (
                <div className="grid grid-cols-3 gap-4 print:hidden">
                    {[
                        { label: "Total Brands", value: rows.length, color: "text-blue-400" },
                        { label: "Total Sold (Bottles)", value: totals.total_sold?.toLocaleString() || 0, color: "text-orange-400" },
                        { label: "Total Sale Value", value: `₹${Number(totals.sale_value || 0).toFixed(2)}`, color: "text-green-400" },
                    ].map(c => (
                        <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide">{c.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-slate-400 text-center py-20">Loading…</div>
            ) : rows.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="text-slate-400">No data for {MONTHS[month - 1]} {year}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700 print:border-black">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 print:bg-gray-200 text-slate-400 print:text-black text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Sr</th>
                                <th className="px-4 py-3 text-left">Brand / Product</th>
                                <th className="px-4 py-3 text-left">Excise Code</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-right">Pack (ml)</th>
                                <th className="px-4 py-3 text-right bg-blue-900/20 print:bg-blue-50">Opening Stock</th>
                                <th className="px-4 py-3 text-right bg-green-900/20 print:bg-green-50">Purchased</th>
                                <th className="px-4 py-3 text-right bg-orange-900/20 print:bg-orange-50">Sold</th>
                                <th className="px-4 py-3 text-right bg-blue-900/20 print:bg-blue-50">Closing Stock</th>
                                <th className="px-4 py-3 text-right">MRP (₹)</th>
                                <th className="px-4 py-3 text-right bg-green-900/20 print:bg-green-50">Sale Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 print:divide-gray-300">
                            {rows.map((r, i) => (
                                <tr key={r.product_id} className="bg-slate-900 print:bg-white hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-white print:text-black font-medium">{r.name}</p>
                                        <p className="text-slate-400 print:text-gray-500 text-xs">{r.brand} · {r.category}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.excise_code
                                            ? <span className="font-mono text-xs bg-slate-700 print:bg-gray-100 px-2 py-0.5 rounded text-blue-300 print:text-blue-800">{r.excise_code}</span>
                                            : <span className="text-slate-500 text-xs">—</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-slate-300 print:text-gray-700 text-xs">{r.liquor_type || "—"}</td>
                                    <td className="px-4 py-3 text-right text-slate-300 print:text-gray-700">{r.pack_size_ml || "—"}</td>
                                    <td className="px-4 py-3 text-right text-blue-300 print:text-blue-800 bg-blue-900/10 print:bg-blue-50">{r.opening_stock}</td>
                                    <td className="px-4 py-3 text-right text-green-400 print:text-green-800 bg-green-900/10 print:bg-green-50">{r.total_purchased}</td>
                                    <td className="px-4 py-3 text-right text-orange-400 print:text-orange-800 bg-orange-900/10 print:bg-orange-50 font-semibold">{r.total_sold}</td>
                                    <td className="px-4 py-3 text-right text-blue-300 print:text-blue-800 bg-blue-900/10 print:bg-blue-50 font-semibold">{r.closing_stock}</td>
                                    <td className="px-4 py-3 text-right text-slate-300 print:text-gray-700">₹{r.selling_price?.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-green-400 print:text-green-800 bg-green-900/10 print:bg-green-50 font-medium">₹{r.sale_value?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-800/80 print:bg-gray-100 text-white print:text-black font-bold text-sm border-t-2 border-slate-600 print:border-black">
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-slate-400 print:text-gray-600 font-normal uppercase text-xs tracking-wide">TOTAL</td>
                                <td className="px-4 py-3 text-right bg-blue-900/20 print:bg-blue-50">—</td>
                                <td className="px-4 py-3 text-right text-green-400 print:text-green-800 bg-green-900/20 print:bg-green-50">{totals.total_purchased}</td>
                                <td className="px-4 py-3 text-right text-orange-400 print:text-orange-800 bg-orange-900/20 print:bg-orange-50">{totals.total_sold}</td>
                                <td className="px-4 py-3 bg-blue-900/20 print:bg-blue-50">—</td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3 text-right text-green-400 print:text-green-800 bg-green-900/20 print:bg-green-50">₹{Number(totals.sale_value || 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Print footer */}
            <div className="hidden print:flex justify-between mt-10 text-sm border-t pt-4">
                <div>Date of Preparation: {new Date().toLocaleDateString("en-IN")}</div>
                <div>Authorised Signatory / Shop Owner</div>
            </div>
        </div>
    );
}
