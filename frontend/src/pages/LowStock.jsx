import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import { getLowStockProducts } from "../services/lowStockService";
import { useNavigate } from "react-router-dom";
import {
    FaExclamationTriangle,
    FaBoxOpen,
    FaCheckCircle,
    FaTruck,
    FaSearch,
    FaSyncAlt,
} from "react-icons/fa";

const SEVERITY = (stock, min) => {
    if (stock === 0) return "critical";
    if (stock <= Math.ceil(min * 0.5)) return "high";
    return "low";
};

const SEVERITY_CONFIG = {
    critical: {
        label: "Out of Stock",
        badge: "bg-red-100 text-red-700 border border-red-200",
        row: "bg-red-50/40",
        dot: "bg-red-500",
    },
    high: {
        label: "Critical",
        badge: "bg-orange-100 text-orange-700 border border-orange-200",
        row: "bg-orange-50/30",
        dot: "bg-orange-500",
    },
    low: {
        label: "Low Stock",
        badge: "bg-amber-100 text-amber-700 border border-amber-200",
        row: "",
        dot: "bg-amber-400",
    },
};

export default function LowStock() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            q
                ? products.filter(
                      (p) =>
                          p.name.toLowerCase().includes(q) ||
                          p.brand?.toLowerCase().includes(q) ||
                          p.category?.toLowerCase().includes(q)
                  )
                : products
        );
    }, [search, products]);

    async function load() {
        try {
            setLoading(true);
            const data = await getLowStockProducts();
            setProducts(data);
            setFiltered(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const critical = products.filter((p) => p.stock === 0).length;
    const high = products.filter(
        (p) => p.stock > 0 && p.stock <= Math.ceil(p.minimum_stock * 0.5)
    ).length;
    const low = products.length - critical - high;

    return (
        <AdminLayout>
            <Navbar />

            <div className="space-y-6 p-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <FaExclamationTriangle size={18} />
                            </span>
                            Low Stock Alerts
                        </h1>
                        <p className="text-gray-500 mt-1 ml-[52px]">
                            Products that need restocking
                        </p>
                    </div>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-medium"
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">
                            <FaBoxOpen />
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Out of Stock</p>
                        <p className="text-4xl font-bold">{critical}</p>
                        <p className="text-white/70 text-xs mt-1">Need immediate restock</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">
                            <FaExclamationTriangle />
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Critical Low</p>
                        <p className="text-4xl font-bold">{high}</p>
                        <p className="text-white/70 text-xs mt-1">Below 50% of minimum</p>
                    </div>
                    <div
                        className={`rounded-2xl p-5 text-white shadow-lg relative overflow-hidden ${
                            products.length === 0
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                                : "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-500/20"
                        }`}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">
                            {products.length === 0 ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">
                            {products.length === 0 ? "All Stock Healthy" : "Below Minimum"}
                        </p>
                        <p className="text-4xl font-bold">{products.length === 0 ? "✓" : low}</p>
                        <p className="text-white/70 text-xs mt-1">
                            {products.length === 0
                                ? "No alerts right now"
                                : "Approaching minimum stock"}
                        </p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Table Toolbar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search product, brand…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 bg-slate-50 w-64"
                            />
                        </div>
                        <button
                            onClick={() => navigate("/purchases")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition"
                        >
                            <FaTruck />
                            Create Purchase Order
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <FaCheckCircle className="mx-auto text-5xl text-emerald-400 mb-4" />
                            <p className="text-lg font-semibold text-slate-700">All stock levels are healthy!</p>
                            <p className="text-slate-400 text-sm mt-1">No products are below their minimum stock threshold.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Brand
                                    </th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Current Stock
                                    </th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Min Required
                                    </th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Deficit
                                    </th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((product) => {
                                    const sev = SEVERITY(product.stock, product.minimum_stock);
                                    const cfg = SEVERITY_CONFIG[sev];
                                    const deficit = Math.max(0, product.minimum_stock - product.stock);
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`transition-colors ${cfg.row}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                                    <span className="font-semibold text-slate-800 text-sm">
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500">
                                                {product.brand || "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${
                                                        product.stock === 0
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-orange-100 text-orange-700"
                                                    }`}
                                                >
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center font-medium text-slate-600">
                                                {product.minimum_stock}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="font-bold text-red-600">
                                                    -{deficit}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {filtered.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 bg-slate-50/50">
                            Showing {filtered.length} of {products.length} low-stock products
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
