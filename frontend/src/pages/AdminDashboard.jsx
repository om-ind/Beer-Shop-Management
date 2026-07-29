import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOverview, getAllShops } from "../services/shopsService";
import AdminLayout from "../layouts/AdminLayout";
import {
    FaStore, FaUsers, FaRupeeSign, FaChartLine,
    FaCheckCircle, FaTimesCircle, FaArrowRight, FaShoppingBag
} from "react-icons/fa";

const BASE_LAYOUT = "flex min-h-screen bg-slate-950";

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className={`rounded-2xl p-6 bg-slate-800/60 border border-slate-700/50 backdrop-blur flex items-start gap-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium">{label}</p>
                <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
                {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getAdminOverview()
            .then(setOverview)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-lg">
                    Loading Admin Dashboard…
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
        <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white text-lg">
                        🔐
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-slate-400 text-sm">Global overview across all shops</p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    icon={<FaStore />}
                    label="Active Shops"
                    value={overview?.total_shops ?? 0}
                    sub="Registered & active"
                    color="bg-purple-500/20 text-purple-400"
                />
                <StatCard
                    icon={<FaUsers />}
                    label="Total Users"
                    value={overview?.total_users ?? 0}
                    sub="Across all shops"
                    color="bg-blue-500/20 text-blue-400"
                />
                <StatCard
                    icon={<FaRupeeSign />}
                    label="Total Revenue"
                    value={fmt(overview?.total_revenue)}
                    sub="All time"
                    color="bg-emerald-500/20 text-emerald-400"
                />
                <StatCard
                    icon={<FaChartLine />}
                    label="Total Sales"
                    value={(overview?.total_sales ?? 0).toLocaleString()}
                    sub="Transactions"
                    color="bg-amber-500/20 text-amber-400"
                />
            </div>

            {/* Shop Breakdown Table */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur">
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <FaShoppingBag className="text-purple-400" /> Shop Revenue Breakdown
                    </h2>
                    <button
                        onClick={() => navigate("/admin/shops")}
                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition"
                    >
                        Manage Shops <FaArrowRight />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                                <th className="px-6 py-3 font-medium">#</th>
                                <th className="px-6 py-3 font-medium">Shop Name</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Sales</th>
                                <th className="px-6 py-3 font-medium text-right">Revenue</th>
                                <th className="px-6 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(overview?.shop_breakdown || []).map((shop, idx) => (
                                <tr
                                    key={shop.id}
                                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition"
                                >
                                    <td className="px-6 py-4 text-slate-400 text-sm">{idx + 1}</td>
                                    <td className="px-6 py-4 text-white font-medium">{shop.name}</td>
                                    <td className="px-6 py-4">
                                        {shop.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full">
                                                <FaCheckCircle /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-full">
                                                <FaTimesCircle /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{shop.sales_count}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-semibold text-right">{fmt(shop.revenue)}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => navigate("/admin/shops")}
                                            className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
                                        >
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!overview?.shop_breakdown?.length) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm">
                                        No shops found. Create a shop to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </AdminLayout>
    );
}
