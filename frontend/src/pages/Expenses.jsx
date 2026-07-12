import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
} from "../services/expenseService";
import {
    FaReceipt,
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaWallet,
    FaBolt,
    FaHome,
    FaUsers,
    FaTruck,
    FaTools,
    FaEllipsisH,
} from "react-icons/fa";

const CATEGORIES = ["Electricity", "Rent", "Salary", "Transport", "Maintenance", "Misc"];

const CAT_CONFIG = {
    Electricity: { icon: <FaBolt />, color: "from-yellow-400 to-amber-500", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    Rent:        { icon: <FaHome />, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    Salary:      { icon: <FaUsers />, color: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    Transport:   { icon: <FaTruck />, color: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    Maintenance: { icon: <FaTools />, color: "from-slate-500 to-gray-600", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    Misc:        { icon: <FaEllipsisH />, color: "from-pink-500 to-rose-500", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
};

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

const today = new Date();
const DEFAULT_MONTH = today.getMonth() + 1;
const DEFAULT_YEAR  = today.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => DEFAULT_YEAR - i);

function ExpenseModal({ expense, onClose, onSaved }) {
    const [form, setForm] = useState({
        category: expense?.category || "Misc",
        description: expense?.description || "",
        amount: expense?.amount || "",
        expense_date: expense?.expense_date || today.toISOString().slice(0, 10),
    });
    const [saving, setSaving] = useState(false);

    function handleChange(field, value) {
        setForm(f => ({ ...f, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            toast.warning("Amount must be greater than 0");
            return;
        }
        setSaving(true);
        try {
            if (expense?.id) {
                await updateExpense(expense.id, form);
                toast.success("Expense updated!");
            } else {
                await addExpense(form);
                toast.success("Expense added!");
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to save expense");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                            <FaReceipt />
                        </div>
                        <h2 className="font-bold text-slate-800">
                            {expense?.id ? "Edit Expense" : "Add Expense"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Category */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => {
                                const cfg = CAT_CONFIG[cat];
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => handleChange("category", cat)}
                                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                            form.category === cat
                                                ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span className="text-base">{cfg.icon}</span>
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Description (optional)
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            placeholder="e.g. Monthly electricity bill"
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-700 text-sm"
                        />
                    </div>

                    {/* Amount + Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={form.amount}
                                onChange={e => handleChange("amount", e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-700 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                                Date
                            </label>
                            <input
                                type="date"
                                required
                                value={form.expense_date}
                                onChange={e => handleChange("expense_date", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 text-slate-700 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm transition shadow-lg shadow-rose-500/20 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : expense?.id ? "Update Expense" : "Add Expense"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(DEFAULT_MONTH);
    const [year, setYear] = useState(DEFAULT_YEAR);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        loadAll();
    }, [month, year]);

    async function loadAll() {
        setLoading(true);
        try {
            const [exp, sum] = await Promise.all([
                getExpenses(month, year),
                getExpenseSummary(month, year),
            ]);
            setExpenses(exp);
            setSummary(sum);
        } catch (err) {
            toast.error("Failed to load expenses");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await deleteExpense(id);
            toast.success("Expense deleted");
            loadAll();
        } catch {
            toast.error("Failed to delete");
        }
    }

    const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    return (
        <AdminLayout>
            <Navbar />

            <div className="space-y-6 p-2">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                                <FaReceipt size={18} />
                            </span>
                            Expenses
                        </h1>
                        <p className="text-gray-500 mt-1 ml-[52px]">Track shop expenses to calculate net profit</p>
                    </div>

                    {/* Month/Year Filter + Add Button */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 text-slate-700"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 text-slate-700"
                        >
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => { setEditing(null); setShowModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow hover:from-rose-600 hover:to-pink-700 transition"
                        >
                            <FaPlus />
                            Add Expense
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Grand Total */}
                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl"><FaWallet /></div>
                            <p className="text-white/80 text-sm font-medium mb-1">Total This Month</p>
                            <p className="text-2xl font-bold">{fmt(summary.grand_total)}</p>
                            <p className="text-white/70 text-xs mt-1">{MONTHS[month - 1]} {year}</p>
                        </div>

                        {/* By Category */}
                        {summary.by_category.slice(0, 3).map(cat => {
                            const cfg = CAT_CONFIG[cat.category] || CAT_CONFIG["Misc"];
                            return (
                                <div key={cat.category} className={`bg-gradient-to-br ${cfg.color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
                                    <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">{cfg.icon}</div>
                                    <p className="text-white/80 text-sm font-medium mb-1">{cat.category}</p>
                                    <p className="text-2xl font-bold">{fmt(cat.total)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Expenses Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-700">
                            {MONTHS[month - 1]} {year} — Expense Log
                        </h2>
                        <span className="text-sm text-slate-400">{expenses.length} entries</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-20">
                            <FaReceipt className="mx-auto text-5xl text-slate-300 mb-4" />
                            <p className="text-lg font-semibold text-slate-500">No expenses this month</p>
                            <p className="text-slate-400 text-sm mt-1">Click "Add Expense" to record one</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {expenses.map(exp => {
                                    const cfg = CAT_CONFIG[exp.category] || CAT_CONFIG["Misc"];
                                    return (
                                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                                                {exp.expense_date
                                                    ? new Date(exp.expense_date + "T00:00:00").toLocaleDateString("en-IN", {
                                                          day: "numeric", month: "short", year: "numeric"
                                                      })
                                                    : "—"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                    {cfg.icon}
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-600">
                                                {exp.description || <span className="text-slate-300 italic">No description</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                                                {fmt(exp.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditing(exp); setShowModal(true); }}
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Footer total */}
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td colSpan={3} className="px-5 py-3.5 font-semibold text-slate-600 text-sm uppercase tracking-wider">
                                        Monthly Total
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-rose-600 text-lg">
                                        {fmt(expenses.reduce((s, e) => s + Number(e.amount), 0))}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <ExpenseModal
                    expense={editing}
                    onClose={() => { setShowModal(false); setEditing(null); }}
                    onSaved={loadAll}
                />
            )}
        </AdminLayout>
    );
}
