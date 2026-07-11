import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import PurchaseTable from "../components/Purchases/PurchaseTable";
import PurchaseModal from "../components/Purchases/PurchaseModal";
import { toast } from "react-toastify";
import { FaTruck, FaPlus, FaSearch } from "react-icons/fa";
import { getPurchases, createPurchase } from "../services/purchaseService";

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchases();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(purchases);
        } else {
            const q = search.toLowerCase();
            setFiltered(purchases.filter(p =>
                p.invoice_number?.toLowerCase().includes(q) ||
                p.supplier?.toLowerCase().includes(q) ||
                p.payment_mode?.toLowerCase().includes(q)
            ));
        }
    }, [search, purchases]);

    async function loadPurchases() {
        try {
            setLoading(true);
            const data = await getPurchases();
            setPurchases(data);
        } catch (err) {
            toast.error("Failed to load purchases");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(purchase) {
        try {
            const result = await createPurchase(purchase);
            toast.success(`Purchase saved! Invoice: ${result.invoice_number}`);
            setShowModal(false);
            loadPurchases();
        } catch (err) {
            toast.error("Failed to save purchase.");
        }
    }

    const totalSpend = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

    return (
        <AdminLayout>
            <Navbar />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                        <FaTruck />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Purchases</h1>
                        <p className="text-sm text-slate-500">
                            {purchases.length} records &nbsp;·&nbsp;
                            <span className="text-orange-600 font-semibold">₹{totalSpend.toFixed(2)} total</span>
                        </p>
                    </div>
                </div>
                <button
                    id="new-purchase-btn"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all"
                >
                    <FaPlus /> New Purchase
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        id="purchase-search"
                        type="text"
                        placeholder="Search by invoice, supplier, or payment mode..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm">Loading purchases...</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <FaTruck className="mx-auto text-4xl mb-3 opacity-30" />
                        <p className="font-medium">No purchases found</p>
                        <p className="text-sm mt-1">Record a new purchase to get started</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((purchase, idx) => (
                                <tr key={purchase.id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-5 py-3.5 text-sm text-slate-400">{idx + 1}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                            {purchase.invoice_number}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                                                {purchase.supplier?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <span className="font-medium text-slate-700">{purchase.supplier || "—"}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 text-sm">
                                        {purchase.purchase_date
                                            ? new Date(purchase.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                            : "—"}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                                        ₹{Number(purchase.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            purchase.payment_mode === "Cash"
                                                ? "bg-green-50 text-green-600"
                                                : purchase.payment_mode === "UPI"
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {purchase.payment_mode || "—"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Purchase Modal */}
            {showModal && (
                <PurchaseModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </AdminLayout>
    );
}