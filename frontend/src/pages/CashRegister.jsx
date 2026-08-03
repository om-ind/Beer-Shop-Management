import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { toast } from "react-toastify";
import { Wallet, Landmark, Plus, Trash2, ArrowUpRight, ArrowDownLeft, X, Calendar, Loader2 } from "lucide-react";
import { getCashSummary, getCashEntries, addCashEntry, deleteCashEntry } from "../services/cashRegisterService";
import { getPendingBills } from "../services/supplierBillsService";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

const today = () => new Date().toISOString().slice(0, 10);

const TYPE_CONFIG = {
    cash_in:  { label: "Cash In",  variant: "success",  isOut: false },
    cash_out: { label: "Cash Out", variant: "destructive", isOut: true },
    bank_in:  { label: "Bank In",  variant: "purple",   isOut: false },
    bank_out: { label: "Bank Out", variant: "warning",  isOut: true },
};

const CATEGORIES = [
    { value: "daily_sales",  label: "Daily Sales" },
    { value: "bill_payment", label: "Bill Payment" },
    { value: "expense",      label: "Expense" },
    { value: "salary",       label: "Salary" },
    { value: "transfer",     label: "Cash ↔ Bank Transfer" },
    { value: "other",        label: "Other" },
];

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

    const [form, setForm] = useState({
        entry_type: "cash_in",
        category: "daily_sales",
        amount: "",
        description: "",
        entry_date: today(),
    });
    const [saving, setSaving] = useState(false);

    const [pendingBills, setPendingBills] = useState([]);
    const [selectedBillId, setSelectedBillId] = useState("");

    const [filterType, setFilterType] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (showForm && form.category === "bill_payment") {
            loadPendingBills();
        }
    }, [showForm, form.category]);

    async function loadPendingBills() {
        try {
            const data = await getPendingBills();
            setPendingBills(data);
        } catch {
            toast.error("Failed to load pending bills");
        }
    }

    function handleBillSelectChange(e) {
        const billId = e.target.value;
        setSelectedBillId(billId);
        if (!billId) {
            setForm(f => ({ ...f, amount: "", description: "" }));
            return;
        }
        const bill = pendingBills.find(b => b.id === Number(billId));
        if (bill) {
            setForm(f => ({
                ...f,
                entry_type: "cash_out",
                amount: bill.balance_due.toString(),
                description: `Payment for Bill #${bill.bill_number} (Supplier: ${bill.supplier_name})`
            }));
        }
    }

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
        } catch {
            toast.error("Failed to load cash data");
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
            await addCashEntry({
                ...form,
                amount: Number(form.amount),
                supplier_bill_id: selectedBillId ? Number(selectedBillId) : null
            });
            toast.success("Entry added!");
            setForm({ entry_type: "cash_in", category: "daily_sales", amount: "", description: "", entry_date: today() });
            setSelectedBillId("");
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

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Cash Register & Ledger
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Physical drawer cash and bank liquidity management
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={showForm ? "outline" : "gradient"}
                        onClick={() => setShowForm(v => !v)}
                        className={showForm ? "" : "text-slate-950 font-bold"}
                    >
                        {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        <span>{showForm ? "Close Form" : "New Register Entry"}</span>
                    </Button>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-slate-800 bg-slate-950 text-white shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Combined Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-emerald-400">
                                ₹{Number(summary.total_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Cash in hand + Bank total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Physical Cash in Drawer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
                                ₹{Number(summary.cash_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Bank / UPI Liquidity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-purple-600 dark:text-purple-400">
                                ₹{Number(summary.bank_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Today's Net Flow</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Inflow:</span>
                                <span className="font-bold text-emerald-600">+₹{Number(summary.today_in).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Outflow:</span>
                                <span className="font-bold text-red-500">−₹{Number(summary.today_out).toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Dialog / Section */}
                {showForm && (
                    <Card className="border-amber-500/30">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">New Cash Register Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {ENTRY_TYPES.map(t => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, entry_type: t.value }))}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                                                    form.entry_type === t.value
                                                        ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                                        <select
                                            value={form.category}
                                            onChange={e => {
                                                setForm(f => ({ ...f, category: e.target.value }));
                                                setSelectedBillId("");
                                            }}
                                            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (₹)</label>
                                        <Input
                                            type="number" step="0.01" min="0.01" required
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                                        <Input
                                            type="date" required
                                            value={form.entry_date}
                                            onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {form.category === "bill_payment" && (
                                    <div className="space-y-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Link Pending Supplier Bill</label>
                                        <select
                                            value={selectedBillId}
                                            onChange={handleBillSelectChange}
                                            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                                        >
                                            <option value="">-- Choose Pending Bill --</option>
                                            {pendingBills.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.supplier_name} - Bill #{b.bill_number} · Due: ₹{b.balance_due.toFixed(2)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                                    <Input
                                        type="text"
                                        placeholder="Optional transaction memo or reference..."
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="gradient" disabled={saving} className="text-slate-950 font-bold">
                                        {saving ? "Processing..." : "Save Entry"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                <p className="text-sm font-medium">Loading register ledger...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                                <Wallet className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No register entries found</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        entries.map(entry => {
                                            const cfg = TYPE_CONFIG[entry.entry_type] || TYPE_CONFIG.cash_in;
                                            return (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="text-slate-500 text-xs">
                                                        {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric"
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={cfg.variant}>
                                                            {cfg.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="capitalize text-slate-600 dark:text-slate-300">
                                                        {(entry.category || "other").replace("_", " ")}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                        {entry.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        <span className={cfg.isOut ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>
                                                            {cfg.isOut ? "−" : "+"} ₹{Number(entry.amount).toFixed(2)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteConfirm(entry)}
                                                            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Dialog */}
                <Dialog
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    title="Remove Entry"
                    description={`Permanently remove this ${deleteConfirm?.entry_type} entry of ₹${Number(deleteConfirm?.amount || 0).toFixed(2)}?`}
                >
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Remove Entry</Button>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
