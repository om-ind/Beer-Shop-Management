import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    FaTimes, FaWallet, FaPlus, FaArrowUp, FaArrowDown,
    FaHistory, FaRupeeSign, FaCalendarAlt, FaPen, FaWhatsapp, FaPrint
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

    // ---- Send WhatsApp Payment Reminder ----
    function handleWhatsAppReminder() {
        if (!customer.mobile) {
            toast.warning("Customer mobile number is missing!");
            return;
        }
        const cleanMobile = customer.mobile.replace(/\D/g, "");
        const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        const msg = `Hello ${customer.name},\n\nThis is a friendly reminder regarding your outstanding credit balance at *B N BEER SHOP*.\n\n*Outstanding Balance: ₹${Number(balance).toFixed(2)}*\n\nKindly arrange to clear your dues at your earliest convenience. Thank you!\n\n— B N Beer Shop Management`;
        const url = `https://api.whatsapp.com/send?phone=${formattedMobile}&text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    }

    // ---- Print Khatabook Account Statement ----
    function handlePrintStatement() {
        if (!data?.history) return;
        const printWindow = window.open("", "_blank", "width=850,height=900");
        const historyRows = data.history.map(entry => {
            const isDebit = entry.amount < 0;
            const dateStr = entry.payment_date
                ? new Date(entry.payment_date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—";
            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; font-size: 13px;">${dateStr}</td>
                    <td style="padding: 10px; font-size: 13px; font-weight: bold;">${entry.remarks || (isDebit ? "Credit Sale (Dia)" : "Payment (Liya)")}</td>
                    <td style="padding: 10px; font-size: 13px; text-align: right; color: ${isDebit ? '#dc2626' : '#94a3b8'}; font-weight: bold;">
                        ${isDebit ? `₹${Math.abs(entry.amount).toFixed(2)}` : "-"}
                    </td>
                    <td style="padding: 10px; font-size: 13px; text-align: right; color: ${!isDebit ? '#16a34a' : '#94a3b8'}; font-weight: bold;">
                        ${!isDebit ? `₹${Math.abs(entry.amount).toFixed(2)}` : "-"}
                    </td>
                </tr>
            `;
        }).join("");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Khatabook Statement - ${customer.name}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
                        .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 24px; }
                        .header h1 { margin: 0; color: #d97706; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                        .header p { margin: 4px 0 0 0; color: #64748b; font-size: 13px; font-weight: 600; }
                        .meta { display: flex; justify-content: space-between; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        .table th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
                        .summary { margin-top: 24px; text-align: right; font-size: 16px; font-weight: bold; border-top: 2px solid #cbd5e1; padding-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>B N BEER SHOP</h1>
                        <p>CUSTOMER CREDIT LEDGER STATEMENT (KHATABOOK)</p>
                    </div>
                    <div class="meta">
                        <div>
                            <strong>Customer Name:</strong> ${customer.name}<br/>
                            <strong>Mobile:</strong> ${customer.mobile || "N/A"}<br/>
                            <strong>Address:</strong> ${customer.address || "N/A"}
                        </div>
                        <div style="text-align: right;">
                            <strong>Statement Date:</strong> ${new Date().toLocaleDateString("en-IN")}<br/>
                            <strong>Total Entries:</strong> ${data.history.length}<br/>
                            <strong style="color: ${balance > 0 ? '#dc2626' : '#16a34a'}; font-size: 17px;">Net Balance: ₹${Number(balance).toFixed(2)}</strong>
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Description / Remarks</th>
                                <th style="text-align: right;">You Gave (Dia ₹)</th>
                                <th style="text-align: right;">You Got (Liya ₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyRows}
                        </tbody>
                    </table>
                    <div class="summary">
                        Net Outstanding Balance: <span style="color: ${balance > 0 ? '#dc2626' : '#16a34a'}; font-size: 20px;">₹${Number(balance).toFixed(2)}</span>
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
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
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">

                {/* ── Header ── */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                            <FaWallet />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white text-lg">{customer.name}</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Credit Account · {customer.mobile || "No mobile"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Print Statement Button */}
                        <button
                            onClick={handlePrintStatement}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
                            title="Print Khatabook PDF Statement"
                        >
                            <FaPrint /> Statement
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 transition">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Body Area ── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 touch-pan-y focus:outline-none">
                    {/* ── Balance Banner + Action Buttons ── */}
                    <div className={`rounded-2xl p-4 ${
                        balance > 0
                            ? "bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 dark:from-red-950/40 dark:to-rose-950/20 dark:border-red-900/50"
                            : "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 dark:from-emerald-950/40 dark:to-teal-950/20 dark:border-emerald-900/50"
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Outstanding Net Balance</p>
                                <p className={`text-3xl font-extrabold ${balance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    ₹{Number(balance).toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                    {balance > 0 ? "Customer owes you (Dia)" : "No outstanding dues ✓"}
                                </p>
                            </div>

                            {/* WhatsApp Reminder Button */}
                            {balance > 0 && (
                                <button
                                    onClick={handleWhatsAppReminder}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
                                    title="Send WhatsApp Payment Link & Reminder"
                                >
                                    <FaWhatsapp className="text-sm" /> WhatsApp
                                </button>
                            )}
                        </div>

                        {/* Action buttons row — Khatabook Dia / Liya */}
                        <div className="flex gap-2">
                            {/* You Got (Liya) / Collect Payment */}
                            <button
                                id="collect-payment-btn"
                                onClick={() => togglePanel(PANEL.COLLECT)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                    activePanel === PANEL.COLLECT
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                                        : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                }`}
                            >
                                <FaRupeeSign /> You Got (Liya ₹)
                            </button>

                            {/* You Gave (Dia) / Add Debit */}
                            <button
                                id="add-txn-btn"
                                onClick={() => { setTxnType("debit"); togglePanel(PANEL.ADD_TXN); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                    activePanel === PANEL.ADD_TXN && txnType === "debit"
                                        ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                                        : "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40"
                                }`}
                            >
                                <FaPen /> You Gave (Dia ₹)
                            </button>
                        </div>
                    </div>

                    {/* ── Collect Payment Form ── */}
                    {activePanel === PANEL.COLLECT && balance > 0 && (
                        <form onSubmit={handleCollectPayment} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-3">
                            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <FaRupeeSign /> Record Payment Received
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">Amount (₹)</label>
                                    <input
                                        id="collect-amount"
                                        type="number" step="0.01" min="0.01" max={balance}
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        placeholder={`Max ₹${Number(balance).toFixed(2)}`}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">Remarks (optional)</label>
                                    <input
                                        id="collect-remarks"
                                        type="text"
                                        value={payRemarks}
                                        onChange={e => setPayRemarks(e.target.value)}
                                        placeholder="e.g. Cash received"
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setActivePanel(PANEL.NONE)}
                                    className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 text-sm transition">
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
                        <form onSubmit={handleAddTransaction} className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-200 dark:border-violet-900 space-y-3">
                            <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                                <FaPen /> Add Previous / Manual Transaction
                            </h3>

                            {/* Type toggle */}
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Transaction Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        id="txn-type-debit"
                                        onClick={() => setTxnType("debit")}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                            txnType === "debit"
                                                ? "bg-red-500 text-white border-red-500 shadow"
                                                : "bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50"
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
                                                : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50"
                                        }`}
                                    >
                                        <FaArrowUp className="text-xs" />
                                        Payment
                                        <span className="text-xs opacity-70">↓ balance</span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                    {txnType === "debit"
                                        ? "⚠ Debit — customer took goods/service on credit. Balance will increase."
                                        : "✓ Payment — customer paid back money. Balance will decrease."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">Amount (₹)</label>
                                    <input
                                        id="txn-amount"
                                        type="number" step="0.01" min="0.01"
                                        max={txnType === "payment" ? balance : undefined}
                                        value={txnAmount}
                                        onChange={e => setTxnAmount(e.target.value)}
                                        placeholder={txnType === "payment" ? `Max ₹${Number(balance).toFixed(2)}` : "Enter amount"}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1 block">
                                        <FaCalendarAlt className="text-violet-400" /> Date
                                    </label>
                                    <input
                                        id="txn-date"
                                        type="date"
                                        value={txnDate}
                                        onChange={e => setTxnDate(e.target.value)}
                                        max={today()}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">Remarks / Description</label>
                                <input
                                    id="txn-remarks"
                                    type="text"
                                    value={txnRemarks}
                                    onChange={e => setTxnRemarks(e.target.value)}
                                    placeholder={txnType === "debit" ? "e.g. Goods taken on credit — June batch" : "e.g. Cash payment for previous dues"}
                                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button type="button" onClick={() => setActivePanel(PANEL.NONE)}
                                    className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 text-sm transition">
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

                    {/* ── Transaction History List ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FaHistory className="text-slate-400 text-sm" />
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaction History</h3>
                            {data?.history?.length > 0 && (
                                <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
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
                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 touch-pan-y focus:outline-none">
                                {data.history.map(entry => {
                                    const isDebit = entry.amount < 0;
                                    return (
                                        <div key={entry.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                                            isDebit
                                                ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40"
                                                : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                                        }`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isDebit ? "bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                                            }`}>
                                                {isDebit ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                    {entry.remarks || (isDebit ? "Credit Sale" : "Payment Received")}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {entry.payment_date
                                                        ? new Date(entry.payment_date).toLocaleString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric",
                                                            hour: "2-digit", minute: "2-digit"
                                                        })
                                                        : "—"}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`font-extrabold text-sm ${isDebit ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                    {isDebit ? "−" : "+"} ₹{Math.abs(entry.amount).toFixed(2)}
                                                </p>
                                                <p className={`text-xs font-semibold mt-0.5 ${isDebit ? "text-red-400" : "text-emerald-500"}`}>
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
        </div>
    );
}
