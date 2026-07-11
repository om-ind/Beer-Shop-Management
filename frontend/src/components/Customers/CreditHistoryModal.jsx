import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    FaTimes, FaWallet, FaPlus, FaArrowUp, FaArrowDown,
    FaHistory, FaRupeeSign, FaCalendarAlt, FaPen
} from "react-icons/fa";
import { getCreditHistory, addCreditPayment, addCreditTransaction } from "../../services/customerService";

// What panel is showing in the action area
const PANEL = { NONE: "none", COLLECT: "collect", ADD_TXN: "add_txn" };

const today = () => new Date().toISOString().slice(0, 10);

export default function CreditHistoryModal({ customer, onClose, onBalanceUpdate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePanel, setActivePanel] = useState(PANEL.NONE);
    const [submitting, setSubmitting] = useState(false);

    // Collect payment form state
    const [payAmount, setPayAmount] = useState("");
    const [payRemarks, setPayRemarks] = useState("");

    // Add manual transaction form state
    const [txnType, setTxnType] = useState("debit");
    const [txnAmount, setTxnAmount] = useState("");
    const [txnDate, setTxnDate] = useState(today());
    const [txnRemarks, setTxnRemarks] = useState("");

    useEffect(() => { loadHistory(); }, [customer.id]);

    async function loadHistory() {
        try {
            setLoading(true);
            const result = await getCreditHistory(customer.id);
            setData(result);
        } catch {
            toast.error("Failed to load credit history");
        } finally {
            setLoading(false);
        }
    }

    function togglePanel(panel) {
        setActivePanel(prev => prev === panel ? PANEL.NONE : panel);
    }

    // ---- Collect payment (repayment against balance) ----
    async function handleCollectPayment(e) {
        e.preventDefault();
        const amt = parseFloat(payAmount);
        if (!amt || amt <= 0) { toast.warning("Enter a valid amount"); return; }
        try {
            setSubmitting(true);
            const result = await addCreditPayment(customer.id, amt, payRemarks);
            toast.success(result.message);
            setPayAmount(""); setPayRemarks("");
            setActivePanel(PANEL.NONE);
            await loadHistory();
            if (onBalanceUpdate) onBalanceUpdate(result.new_balance);
        } catch (err) {
            toast.error(err.response?.data?.error || "Payment failed");
        } finally {
            setSubmitting(false);
        }
    }

    // ---- Add manual / backdated transaction ----
    async function handleAddTransaction(e) {
        e.preventDefault();
        const amt = parseFloat(txnAmount);
        if (!amt || amt <= 0) { toast.warning("Enter a valid amount"); return; }
        try {
            setSubmitting(true);
            const result = await addCreditTransaction(customer.id, {
                type: txnType,
                amount: amt,
                remarks: txnRemarks,
                date: txnDate,
            });
            toast.success(result.message);
            setTxnAmount(""); setTxnRemarks(""); setTxnDate(today()); setTxnType("debit");
            setActivePanel(PANEL.NONE);
            await loadHistory();
            if (onBalanceUpdate) onBalanceUpdate(result.new_balance);
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction failed");
        } finally {
            setSubmitting(false);
        }
    }

    const balance = data?.customer?.credit_balance ?? customer.credit_balance ?? 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                            <FaWallet />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">{customer.name}</h2>
                            <p className="text-xs text-slate-400">Credit Account · {customer.mobile || "No mobile"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                        <FaTimes />
                    </button>
                </div>

                {/* ── Balance Banner + Action Buttons ── */}
                <div className={`mx-5 mt-5 rounded-2xl p-4 ${
                    balance > 0
                        ? "bg-gradient-to-r from-red-50 to-rose-50 border border-red-100"
                        : "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"
                }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
                            <p className={`text-3xl font-bold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                ₹{Number(balance).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {balance > 0 ? "Amount owed by customer" : "No outstanding dues ✓"}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex gap-2">
                        {/* Collect Payment — only if balance > 0 */}
                        {balance > 0 && (
                            <button
                                id="collect-payment-btn"
                                onClick={() => togglePanel(PANEL.COLLECT)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                    activePanel === PANEL.COLLECT
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                        : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                }`}
                            >
                                <FaRupeeSign /> Collect Payment
                            </button>
                        )}
                        {/* Add Transaction — always visible */}
                        <button
                            id="add-txn-btn"
                            onClick={() => togglePanel(PANEL.ADD_TXN)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                activePanel === PANEL.ADD_TXN
                                    ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                    : "bg-white text-violet-600 border-violet-200 hover:bg-violet-50"
                            }`}
                        >
                            <FaPen /> Add Transaction
                        </button>
                    </div>
                </div>

                {/* ── Collect Payment Form ── */}
                {activePanel === PANEL.COLLECT && balance > 0 && (
                    <form onSubmit={handleCollectPayment} className="mx-5 mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                        <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                            <FaRupeeSign /> Record Payment Received
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Amount (₹)</label>
                                <input
                                    id="collect-amount"
                                    type="number" step="0.01" min="0.01" max={balance}
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    placeholder={`Max ₹${Number(balance).toFixed(2)}`}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Remarks (optional)</label>
                                <input
                                    id="collect-remarks"
                                    type="text"
                                    value={payRemarks}
                                    onChange={e => setPayRemarks(e.target.value)}
                                    placeholder="e.g. Cash received"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setActivePanel(PANEL.NONE)}
                                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-white text-sm transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60">
                                {submitting ? "Saving..." : "Confirm Payment"}
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Add Manual / Backdated Transaction Form ── */}
                {activePanel === PANEL.ADD_TXN && (
                    <form onSubmit={handleAddTransaction} className="mx-5 mt-4 p-4 bg-violet-50 rounded-2xl border border-violet-200 space-y-3">
                        <h3 className="text-sm font-bold text-violet-800 flex items-center gap-2">
                            <FaPen /> Add Previous / Manual Transaction
                        </h3>

                        {/* Type toggle */}
                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-1.5 block">Transaction Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    id="txn-type-debit"
                                    onClick={() => setTxnType("debit")}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                        txnType === "debit"
                                            ? "bg-red-500 text-white border-red-500 shadow"
                                            : "bg-white text-red-500 border-red-200 hover:bg-red-50"
                                    }`}
                                >
                                    <FaArrowDown className="text-xs" />
                                    Credit (Debit)
                                    <span className="text-xs opacity-70">↑ balance</span>
                                </button>
                                <button
                                    type="button"
                                    id="txn-type-payment"
                                    onClick={() => setTxnType("payment")}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                        txnType === "payment"
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow"
                                            : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    }`}
                                >
                                    <FaArrowUp className="text-xs" />
                                    Payment
                                    <span className="text-xs opacity-70">↓ balance</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                {txnType === "debit"
                                    ? "⚠ Debit — customer took goods/service on credit. Balance will increase."
                                    : "✓ Payment — customer paid back money. Balance will decrease."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 block">Amount (₹)</label>
                                <input
                                    id="txn-amount"
                                    type="number" step="0.01" min="0.01"
                                    max={txnType === "payment" ? balance : undefined}
                                    value={txnAmount}
                                    onChange={e => setTxnAmount(e.target.value)}
                                    placeholder={txnType === "payment" ? `Max ₹${Number(balance).toFixed(2)}` : "Enter amount"}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1 block">
                                    <FaCalendarAlt className="text-violet-400" /> Date
                                </label>
                                <input
                                    id="txn-date"
                                    type="date"
                                    value={txnDate}
                                    onChange={e => setTxnDate(e.target.value)}
                                    max={today()}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Remarks / Description</label>
                            <input
                                id="txn-remarks"
                                type="text"
                                value={txnRemarks}
                                onChange={e => setTxnRemarks(e.target.value)}
                                placeholder={txnType === "debit" ? "e.g. Goods taken on credit — June batch" : "e.g. Cash payment for previous dues"}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button type="button" onClick={() => setActivePanel(PANEL.NONE)}
                                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-white text-sm transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className={`flex-1 py-2 rounded-xl font-semibold text-sm text-white transition disabled:opacity-60 ${
                                    txnType === "debit"
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-emerald-500 hover:bg-emerald-600"
                                }`}>
                                {submitting ? "Saving..." : `Save ${txnType === "debit" ? "Debit" : "Payment"}`}
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Transaction History ── */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FaHistory className="text-slate-400 text-sm" />
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Transaction History</h3>
                        {data?.history?.length > 0 && (
                            <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {data.history.length} entries
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : !data?.history?.length ? (
                        <div className="text-center py-12 text-slate-400">
                            <FaHistory className="mx-auto text-4xl mb-3 opacity-25" />
                            <p className="font-medium text-sm">No credit transactions yet</p>
                            <p className="text-xs mt-1">
                                Use <strong>"Add Transaction"</strong> above to enter past records
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.history.map(entry => {
                                const isDebit = entry.amount < 0;
                                return (
                                    <div key={entry.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                                        isDebit ? "bg-red-50/50 border-red-100" : "bg-emerald-50/50 border-emerald-100"
                                    }`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isDebit ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-600"
                                        }`}>
                                            {isDebit ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                {entry.remarks || (isDebit ? "Credit Sale" : "Payment Received")}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {entry.payment_date
                                                    ? new Date(entry.payment_date).toLocaleString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })
                                                    : "—"}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`font-bold text-sm ${isDebit ? "text-red-500" : "text-emerald-600"}`}>
                                                {isDebit ? "−" : "+"} ₹{Math.abs(entry.amount).toFixed(2)}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${isDebit ? "text-red-400" : "text-emerald-500"}`}>
                                                {isDebit ? "Charged" : "Paid"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
