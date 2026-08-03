import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { toast } from "react-toastify";
import {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
} from "../services/expenseService";
import { Receipt, Plus, Edit3, Trash2, Zap, Home, Users, Truck, Wrench, MoreHorizontal, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

const CATEGORIES = ["Electricity", "Rent", "Salary", "Transport", "Maintenance", "Misc"];

const CAT_CONFIG = {
    Electricity: { icon: Zap, color: "bg-amber-500" },
    Rent:        { icon: Home, color: "bg-blue-600" },
    Salary:      { icon: Users, color: "bg-purple-600" },
    Transport:   { icon: Truck, color: "bg-emerald-600" },
    Maintenance: { icon: Wrench, color: "bg-slate-600" },
    Misc:        { icon: MoreHorizontal, color: "bg-rose-500" },
};

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

const today = new Date();
const DEFAULT_MONTH = today.getMonth() + 1;
const DEFAULT_YEAR  = today.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => DEFAULT_YEAR - i);

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(DEFAULT_MONTH);
    const [year, setYear] = useState(DEFAULT_YEAR);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        category: "Misc",
        description: "",
        amount: "",
        expense_date: today.toISOString().slice(0, 10),
    });

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
        } catch {
            toast.error("Failed to load expenses");
        } finally {
            setLoading(false);
        }
    }

    function handleOpenCreate() {
        setEditing(null);
        setForm({
            category: "Misc",
            description: "",
            amount: "",
            expense_date: today.toISOString().slice(0, 10),
        });
        setShowModal(true);
    }

    function handleOpenEdit(exp) {
        setEditing(exp);
        setForm({
            category: exp.category || "Misc",
            description: exp.description || "",
            amount: exp.amount || "",
            expense_date: exp.expense_date || today.toISOString().slice(0, 10),
        });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            toast.warning("Amount must be greater than 0");
            return;
        }
        setSaving(true);
        try {
            if (editing?.id) {
                await updateExpense(editing.id, form);
                toast.success("Expense updated!");
            } else {
                await addExpense(form);
                toast.success("Expense added!");
            }
            setShowModal(false);
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to save expense");
        } finally {
            setSaving(false);
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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Expense Tracker
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Log operational costs to accurately calculate net margins
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                        >
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <Button variant="gradient" onClick={handleOpenCreate} className="text-slate-950 font-bold">
                            <Plus className="h-4 w-4 mr-2" />
                            <span>Add Expense</span>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-rose-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Monthly Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400">
                                    {fmt(summary.grand_total)}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{MONTHS[month - 1]} {year}</p>
                            </CardContent>
                        </Card>

                        {summary.by_category.slice(0, 3).map(cat => {
                            const cfg = CAT_CONFIG[cat.category] || CAT_CONFIG["Misc"];
                            const IconComp = cfg.icon;
                            return (
                                <Card key={cat.category}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xs uppercase tracking-wider text-slate-500">{cat.category}</CardTitle>
                                        <div className={`p-1.5 rounded-lg text-white ${cfg.color}`}>
                                            <IconComp className="h-3.5 w-3.5" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
                                            {fmt(cat.total)}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                                <p className="text-sm font-medium">Loading expense records...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                                                <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No expenses recorded for {MONTHS[month - 1]} {year}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map(exp => {
                                            const cfg = CAT_CONFIG[exp.category] || CAT_CONFIG["Misc"];
                                            const IconComp = cfg.icon;
                                            return (
                                                <TableRow key={exp.id}>
                                                    <TableCell className="text-slate-500 text-xs">
                                                        {exp.expense_date
                                                            ? new Date(exp.expense_date + "T00:00:00").toLocaleDateString("en-IN", {
                                                                  day: "numeric", month: "short", year: "numeric"
                                                              })
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="gap-1.5 text-xs">
                                                            <IconComp className="h-3 w-3 text-slate-500" />
                                                            <span>{exp.category}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300">
                                                        {exp.description || <span className="text-slate-400 italic">No description</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                                        {fmt(exp.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenEdit(exp)}
                                                                className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(exp.id)}
                                                                className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-bold text-slate-900 dark:text-slate-100">Total Monthly Expenses</TableCell>
                                        <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400 text-base">
                                            {fmt(expenses.reduce((s, e) => s + Number(e.amount), 0))}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Expense Modal */}
                <Dialog
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editing ? "Edit Expense Entry" : "Record New Expense"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
                                            form.category === cat
                                                ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                            <Input
                                type="text"
                                placeholder="e.g. Electric bill for June"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (₹)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                                <Input
                                    type="date"
                                    required
                                    value={form.expense_date}
                                    onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-3">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                {saving ? "Saving..." : editing ? "Update Expense" : "Save Expense"}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
