import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    FaTimes, FaTruck, FaPlus, FaCheckCircle, FaHourglassHalf,
    FaExclamationTriangle, FaCalendarAlt, FaTrash, FaRupeeSign,
    FaFileInvoice, FaSpinner
} from "react-icons/fa";
import {
    getSupplierBills, addSupplierBill, paySupplierBill, deleteSupplierBill
} from "../../services/supplierBillsService";

const today = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ status, overdue }) {
    if (overdue && status !== "paid") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                <FaExclamationTriangle className="text-xs" /> Overdue
            </span>
        );
    }
    switch (status) {
        case "paid":
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold"><FaCheckCircle className="text-xs" /> Paid</span>;
        case "partial":
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold"><FaHourglassHalf className="text-xs" /> Partial</span>;
        default:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold"><FaHourglassHalf className="text-xs" /> Pending</span>;
    }
}

function PayBillForm({ bill, onPay, onCancel }) {
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);
    const remaining = bill.total_amount - bill.paid_amount;

    async function handleSubmit(e) {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { toast.warning("Enter a valid amount"); return; }
        try {
            setSaving(true);
            await onPay(bill.id, amt);
            onCancel();
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <p className="text-xs font-semibold text-emerald-700">
                Record Payment — Remaining: ₹{remaining.toFixed(2)}
            </p>
            <div className="flex gap-2">
                <input
                    type="number" step="0.01" min="0.01" max={remaining}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`Max ₹${remaining.toFixed(2)}`}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                    autoFocus required
                />
                <button type="button" onClick={onCancel}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition">
                    Cancel
                </button>
                <button type="submit" disabled={saving}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60">
                    {saving ? <FaSpinner className="animate-spin" /> : "Pay"}
                </button>
            </div>
        </form>
    );
}

export default function SupplierBillsModal({ supplier, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [payingBill, setPayingBill] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        bill_number: "",
        bill_date: today(),
        due_date: "",
        total_amount: "",
        notes: "",
    });

    async function loadBills() {
        try {
            setLoading(true);
            const result = await getSupplierBills(supplier.id);
            setData(result);
        } catch {
            toast.error("Failed to load bills");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadBills(); }, [supplier.id]);

    async function handleAddBill(e) {
        e.preventDefault();
        if (!form.total_amount || Number(form.total_amount) <= 0) { toast.warning("Enter a valid amount"); return; }
        try {
            setSaving(true);
            await addSupplierBill({
                supplier_id: supplier.id,
                ...form,
                total_amount: Number(form.total_amount),
                due_date: form.due_date || null,
            });
            toast.success("Bill added!");
            setForm({ bill_number: "", bill_date: today(), due_date: "", total_amount: "", notes: "" });
            setShowAddForm(false);
            loadBills();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to add bill");
        } finally {
            setSaving(false);
        }
    }

    async function handlePay(billId, amount) {
        try {
            const result = await paySupplierBill(billId, amount);
            toast.success(result.message);
            loadBills();
        } catch (err) {
            toast.error(err.response?.data?.error || "Payment failed");
            throw err;
        }
    }

    async function handleDelete() {
        if (!deleteConfirm) return;
        try {
            await deleteSupplierBill(deleteConfirm.id);
            toast.success("Bill deleted");
            setDeleteConfirm(null);
            loadBills();
        } catch {
            toast.error("Delete failed");
        }
    }

    const summary = data?.summary || {};

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                            <FaTruck />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">{supplier.name}</h2>
                            <p className="text-xs text-slate-400">{supplier.company || "Supplier"} · Bills & Payables</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="add-bill-btn"
                            onClick={() => setShowAddForm(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                showAddForm
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                            }`}
                        >
                            {showAddForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Bill</>}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Summary Bar */}
                {!loading && (
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                        <div className="px-5 py-3 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">Total Billed</p>
                            <p className="font-bold text-slate-700">₹{Number(summary.total_billed || 0).toFixed(2)}</p>
                        </div>
                        <div className="px-5 py-3 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">Total Paid</p>
                            <p className="font-bold text-emerald-600">₹{Number(summary.total_paid || 0).toFixed(2)}</p>
                        </div>
                        <div className="px-5 py-3 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">Pending</p>
                            <p className={`font-bold ${summary.total_pending > 0 ? "text-red-500" : "text-slate-400"}`}>
                                ₹{Number(summary.total_pending || 0).toFixed(2)}
                                {summary.overdue_count > 0 && (
                                    <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                        {summary.overdue_count} overdue
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Add Bill Form */}
                {showAddForm && (
                    <form onSubmit={handleAddBill} className="mx-5 mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-3">
                        <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                            <FaFileInvoice /> New Bill
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Bill Number</label>
                                <input
                                    id="bill-number"
                                    type="text"
                                    value={form.bill_number}
                                    onChange={e => setForm(f => ({ ...f, bill_number: e.target.value }))}
                                    placeholder="e.g. INV-2025-001"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Total Amount (₹) *</label>
                                <input
                                    id="bill-amount"
                                    type="number" step="0.01" min="0.01"
                                    value={form.total_amount}
                                    onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1 block">
                                    <FaCalendarAlt className="text-orange-400 text-xs" /> Bill Date *
                                </label>
                                <input
                                    id="bill-date"
                                    type="date"
                                    value={form.bill_date}
                                    onChange={e => setForm(f => ({ ...f, bill_date: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1 block">
                                    <FaCalendarAlt className="text-red-400 text-xs" /> Due Date
                                </label>
                                <input
                                    id="bill-due-date"
                                    type="date"
                                    value={form.due_date}
                                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Notes</label>
                            <input
                                type="text" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Optional notes..."
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAddForm(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm hover:bg-white transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60">
                                {saving ? "Saving..." : "Add Bill"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Bills List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    ) : !data?.bills?.length ? (
                        <div className="text-center py-16 text-slate-400">
                            <FaFileInvoice className="mx-auto text-4xl mb-3 opacity-25" />
                            <p className="font-medium text-sm">No bills recorded yet</p>
                            <p className="text-xs mt-1">Click "Add Bill" to add the first one</p>
                        </div>
                    ) : (
                        data.bills.map(bill => (
                            <div key={bill.id} className={`rounded-2xl border p-4 ${
                                bill.overdue && bill.status !== "paid"
                                    ? "border-red-200 bg-red-50/30"
                                    : bill.status === "paid"
                                    ? "border-emerald-200 bg-emerald-50/20"
                                    : "border-slate-200 bg-white"
                            }`}>
                                {/* Bill header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-800 text-sm">
                                                {bill.bill_number || `Bill #${bill.id}`}
                                            </p>
                                            <StatusBadge status={bill.status} overdue={bill.overdue} />
                                        </div>
                                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                                            <span>Billed: {bill.bill_date ? new Date(bill.bill_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                                            {bill.due_date && (
                                                <span className={bill.overdue && bill.status !== "paid" ? "text-red-500 font-semibold" : ""}>
                                                    Due: {new Date(bill.due_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                        {bill.notes && <p className="text-xs text-slate-400 mt-0.5 italic">"{bill.notes}"</p>}
                                    </div>
                                    <button
                                        onClick={() => setDeleteConfirm(bill)}
                                        className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 transition flex-shrink-0"
                                        title="Delete bill"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>

                                {/* Amounts */}
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex-1 bg-slate-100 rounded-xl h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-xl transition-all ${
                                                bill.status === "paid" ? "bg-emerald-500" : bill.overdue ? "bg-red-400" : "bg-orange-400"
                                            }`}
                                            style={{ width: `${Math.min(100, (bill.paid_amount / bill.total_amount) * 100).toFixed(1)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 flex-shrink-0">
                                        {((bill.paid_amount / bill.total_amount) * 100).toFixed(0)}% paid
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Total</p>
                                        <p className="font-bold text-sm text-slate-700">₹{bill.total_amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Paid</p>
                                        <p className="font-bold text-sm text-emerald-600">₹{bill.paid_amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Balance</p>
                                        <p className={`font-bold text-sm ${bill.balance_due > 0 ? (bill.overdue ? "text-red-500" : "text-orange-500") : "text-emerald-600"}`}>
                                            ₹{bill.balance_due.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Pay button */}
                                {bill.status !== "paid" && (
                                    payingBill === bill.id ? (
                                        <PayBillForm
                                            bill={bill}
                                            onPay={handlePay}
                                            onCancel={() => setPayingBill(null)}
                                        />
                                    ) : (
                                        <button
                                            id={`pay-bill-${bill.id}`}
                                            onClick={() => setPayingBill(bill.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                                        >
                                            <FaRupeeSign className="text-xs" /> Record Payment
                                        </button>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Bill?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Remove <strong>"{deleteConfirm.bill_number || `Bill #${deleteConfirm.id}`}"</strong>?
                            <br /><span className="text-xs text-slate-400">Total: ₹{deleteConfirm.total_amount?.toFixed(2)}</span>
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
        </div>
    );
}
