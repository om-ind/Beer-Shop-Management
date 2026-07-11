import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import {
    FaWallet, FaMoneyBillWave, FaUniversity, FaPlus, FaTrash,
    FaArrowUp, FaArrowDown, FaFilter, FaTimes, FaCalendarAlt
} from "react-icons/fa";
import {
    getCashSummary, getCashEntries, addCashEntry, deleteCashEntry
} from "../services/cashRegisterService";

const today = () => new Date().toISOString().slice(0, 10);

const TYPE_CONFIG = {
    cash_in:  { label: "Cash In",  color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500", icon: <FaArrowUp /> },
    cash_out: { label: "Cash Out", color: "text-red-500",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500",     icon: <FaArrowDown /> },
    bank_in:  { label: "Bank In",  color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200",    dot: "bg-blue-500",    icon: <FaArrowUp /> },
    bank_out: { label: "Bank Out", color: "text-orange-500",  bg: "bg-orange-50",   border: "border-orange-200",  dot: "bg-orange-500",  icon: <FaArrowDown /> },
};

const CATEGORIES = [
    { value: "daily_sales",  label: "Daily Sales" },
    { value: "bill_payment", label: "Bill Payment" },
    { value: "expense",      label: "Expense" },
    { value: "salary",       label: "Salary" },
    { value: "transfer",     label: "Cash ↔ Bank Transfer" },
    { value: "other",        label: "Other" },
];

function BalanceCard({ title, value, subtitle, icon, gradient, iconBg, positive }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
                    <p className={`text-2xl font-bold ${positive === false ? "text-red-200" : ""}`}>
                        ₹{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-white text-xl flex-shrink-0`}>
                    {icon}
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        </div>
    );
}

const ENTRY_TYPES = [
    { value: "cash_in",  label: "Cash In" },
    { value: "cash_out", label: "Cash Out" },
    { value: "bank_in",  label: "Bank In" },
    { value: "bank_out", label: "Bank Out" },
];

export default function CashRegister() {
    const [summary, setSummary] = useState({ cash_balance: 0, bank_balance: 0, total_balance: 0, today_in: 0, today_out: 0 });
    const [entries, setEntries] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Form state
    const [form, setForm] = useState({
        entry_type: "cash_in",
        category: "daily_sales",
        amount: "",
        description: "",
        entry_date: today(),
    });
    const [saving, setSaving] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [sumData, entriesData] = await Promise.all([
                getCashSummary(),
                getCashEntries({ page, perPage: 25, type: filterType, from: filterFrom, to: filterTo }),
            ]);
            setSummary(sumData);
            setEntries(entriesData.entries);
            setPagination({ total: entriesData.total, page: entriesData.page, pages: entriesData.pages });
        } catch (err) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterFrom, filterTo]);

    useEffect(() => { load(); }, [load]);

    async function handleSave(e) {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) { toast.warning("Enter a valid amount"); return; }
        try {
            setSaving(true);
            await addCashEntry({ ...form, amount: Number(form.amount) });
            toast.success("Entry added!");
            setForm({ entry_type: "cash_in", category: "daily_sales", amount: "", description: "", entry_date: today() });
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to add entry");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteConfirm) return;
        try {
            await deleteCashEntry(deleteConfirm.id);
            toast.success("Entry removed");
            setDeleteConfirm(null);
            load();
        } catch {
            toast.error("Delete failed");
        }
    }

    function clearFilters() {
        setFilterType(""); setFilterFrom(""); setFilterTo(""); setPage(1);
    }

    return (
        <AdminLayout>
            <Navbar />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                        <FaWallet />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Cash Register</h1>
                        <p className="text-sm text-slate-500">Track your cash & bank balances</p>
                    </div>
                </div>
                <button
                    id="add-entry-btn"
                    onClick={() => setShowForm(v => !v)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all ${
                        showForm
                            ? "bg-slate-200 text-slate-700"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30"
                    }`}
                >
                    {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Entry</>}
                </button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <BalanceCard
                    title="Total Balance"
                    value={summary.total_balance}
                    subtitle="Cash + Bank combined"
                    icon={<FaWallet />}
                    gradient="bg-gradient-to-br from-slate-700 to-slate-900"
                    iconBg="bg-white/20"
                />
                <BalanceCard
                    title="Cash in Hand"
                    value={summary.cash_balance}
                    subtitle="Physical cash"
                    icon={<FaMoneyBillWave />}
                    gradient={summary.cash_balance >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-rose-600"}
                    iconBg="bg-white/20"
                    positive={summary.cash_balance >= 0}
                />
                <BalanceCard
                    title="Bank / UPI"
                    value={summary.bank_balance}
                    subtitle="Account balance"
                    icon={<FaUniversity />}
                    gradient={summary.bank_balance >= 0 ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-red-500 to-rose-600"}
                    iconBg="bg-white/20"
                    positive={summary.bank_balance >= 0}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Today's Activity</p>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <FaArrowUp className="text-xs" />
                            <span className="text-sm font-medium">In</span>
                        </div>
                        <span className="font-bold text-emerald-600">₹{Number(summary.today_in).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-red-500">
                            <FaArrowDown className="text-xs" />
                            <span className="text-sm font-medium">Out</span>
                        </div>
                        <span className="font-bold text-red-500">₹{Number(summary.today_out).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-100 mb-3" />
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Net today</span>
                        <span className={`font-bold text-sm ${summary.today_in - summary.today_out >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            ₹{(Number(summary.today_in) - Number(summary.today_out)).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Add Entry Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FaPlus className="text-emerald-500 text-sm" /> New Entry
                    </h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Entry type selector */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Transaction Type</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ENTRY_TYPES.map(t => {
                                    const cfg = TYPE_CONFIG[t.value];
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            id={`type-${t.value}`}
                                            onClick={() => setForm(f => ({ ...f, entry_type: t.value }))}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                form.entry_type === t.value
                                                    ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                                                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className={form.entry_type === t.value ? cfg.color : "text-slate-400"}>{cfg.icon}</span>
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                                >
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Amount (₹)</label>
                                <input
                                    id="entry-amount"
                                    type="number" step="0.01" min="0.01"
                                    value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1 block">
                                    <FaCalendarAlt className="text-slate-400 text-xs" /> Date
                                </label>
                                <input
                                    id="entry-date"
                                    type="date"
                                    value={form.entry_date}
                                    onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Description (optional)</label>
                            <input
                                id="entry-desc"
                                type="text"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder={
                                    form.category === "daily_sales"  ? "e.g. Cash sales July 11" :
                                    form.category === "bill_payment" ? "e.g. Paid Kingfisher bill #123" :
                                    form.category === "expense"      ? "e.g. Electricity bill" :
                                    "Additional details..."
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-60">
                                {saving ? "Saving..." : `Save ${TYPE_CONFIG[form.entry_type]?.label}`}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">Type</label>
                        <select
                            value={filterType}
                            onChange={e => { setFilterType(e.target.value); setPage(1); }}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                            <option value="">All Types</option>
                            {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">From</label>
                        <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">To</label>
                        <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setPage(1); }}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    {(filterType || filterFrom || filterTo) && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition">
                            <FaTimes /> Clear
                        </button>
                    )}
                    <div className="ml-auto text-sm text-slate-400">{pagination.total} entries</div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <FaWallet className="mx-auto text-5xl mb-3 opacity-25" />
                        <p className="font-medium">No entries yet</p>
                        <p className="text-sm mt-1">Click "Add Entry" to record your first transaction</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {entries.map(entry => {
                                    const cfg = TYPE_CONFIG[entry.entry_type] || TYPE_CONFIG.cash_in;
                                    const isOut = entry.entry_type.includes("out");
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-5 py-3.5 text-sm text-slate-500">
                                                {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500 capitalize">
                                                {(entry.category || "other").replace("_", " ")}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-600 max-w-xs truncate">
                                                {entry.description || "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`font-bold ${isOut ? "text-red-500" : "text-emerald-600"}`}>
                                                    {isOut ? "−" : "+"} ₹{Number(entry.amount).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    onClick={() => setDeleteConfirm(entry)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500">Page {page} of {pagination.pages}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition">
                                        ← Prev
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition">
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Entry?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Remove <strong>{TYPE_CONFIG[deleteConfirm.entry_type]?.label}</strong> of <strong>₹{Number(deleteConfirm.amount).toFixed(2)}</strong>?
                            <br /><span className="text-xs text-slate-400">This will affect your balance calculations.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition">
                                Cancel
                            </button>
                            <button onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
