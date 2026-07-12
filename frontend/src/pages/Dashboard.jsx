import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import { getDashboard } from "../services/dashboardService";
import {
    FaMoneyBillWave,
    FaBox,
    FaUsers,
    FaTruck,
    FaChartLine,
    FaWarehouse,
    FaExclamationTriangle,
    FaCoins,
    FaStar,
    FaTrophy,
    FaReceipt,
    FaBalanceScale,
} from "react-icons/fa";

function KPICard({ title, value, icon, gradient, sub }) {
    return (
        <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">
                {icon}
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-white/20 p-2 rounded-xl text-lg">
                        {icon}
                    </div>
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                </div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function Dashboard() {

    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const data = await getDashboard();
            setDashboard(data);
        } catch (err) {
            console.error(err);
        }
    }

    if (!dashboard) {
        return (
            <AdminLayout>
                <Navbar />
                <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
                    Loading Dashboard...
                </div>
            </AdminLayout>
        );
    }

    const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

    return (
        <AdminLayout>
            <Navbar />

            <div className="space-y-8 p-2">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back — here's your shop at a glance</p>
                </div>

                {/* ── Sales KPIs ── */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                        Sales Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Today's Sales"
                            value={fmt(dashboard.today_sales)}
                            icon={<FaMoneyBillWave />}
                            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                        />
                        <KPICard
                            title="Today's Profit"
                            value={fmt(dashboard.today_profit)}
                            icon={<FaCoins />}
                            gradient="bg-gradient-to-br from-green-500 to-emerald-700"
                        />
                        <KPICard
                            title="Weekly Sales"
                            value={fmt(dashboard.weekly_sales)}
                            icon={<FaChartLine />}
                            gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                        />
                        <KPICard
                            title="Monthly Sales"
                            value={fmt(dashboard.monthly_sales)}
                            icon={<FaTrophy />}
                            gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                        />
                        <KPICard
                            title="Monthly Expenses"
                            value={fmt(dashboard.monthly_expenses)}
                            icon={<FaReceipt />}
                            gradient="bg-gradient-to-br from-rose-500 to-pink-700"
                            sub="This month's operating costs"
                        />
                        <KPICard
                            title="Net Profit"
                            value={fmt(dashboard.net_profit)}
                            icon={<FaBalanceScale />}
                            gradient={
                                dashboard.net_profit >= 0
                                    ? "bg-gradient-to-br from-emerald-500 to-green-700"
                                    : "bg-gradient-to-br from-red-500 to-rose-700"
                            }
                            sub="Monthly profit − expenses"
                        />
                    </div>
                </div>

                {/* ── Inventory KPIs ── */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                        Inventory & Operations
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <KPICard
                            title="Inventory Value"
                            value={fmt(dashboard.inventory_value)}
                            icon={<FaWarehouse />}
                            gradient="bg-gradient-to-br from-teal-500 to-cyan-700"
                            sub="Total stock at cost price"
                        />
                        <KPICard
                            title="Total Products"
                            value={dashboard.total_products}
                            icon={<FaBox />}
                            gradient="bg-gradient-to-br from-indigo-500 to-blue-700"
                        />
                        <KPICard
                            title="Low Stock Alerts"
                            value={dashboard.low_stock}
                            icon={<FaExclamationTriangle />}
                            gradient={
                                dashboard.low_stock > 0
                                    ? "bg-gradient-to-br from-red-500 to-rose-700"
                                    : "bg-gradient-to-br from-green-500 to-emerald-700"
                            }
                            sub={dashboard.low_stock > 0 ? "Products need restock" : "All stock healthy"}
                        />
                    </div>
                </div>

                {/* ── Partners KPIs ── */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                        Partners
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <KPICard
                            title="Total Customers"
                            value={dashboard.total_customers}
                            icon={<FaUsers />}
                            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                        />
                        <KPICard
                            title="Total Suppliers"
                            value={dashboard.total_suppliers}
                            icon={<FaTruck />}
                            gradient="bg-gradient-to-br from-slate-600 to-gray-800"
                        />
                    </div>
                </div>

                {/* ── Highlights ── */}
                {(dashboard.top_product || dashboard.highest_profit_brand) && (
                    <div>
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                            Highlights
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {dashboard.top_product && dashboard.top_product !== "N/A" && (
                                <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4 border-l-4 border-blue-500">
                                    <div className="bg-blue-100 p-3 rounded-xl">
                                        <FaStar className="text-blue-600" size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                            Top Selling Product
                                        </p>
                                        <p className="text-gray-800 font-bold text-lg mt-0.5">
                                            {dashboard.top_product}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {dashboard.highest_profit_brand && dashboard.highest_profit_brand !== "N/A" && (
                                <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4 border-l-4 border-green-500">
                                    <div className="bg-green-100 p-3 rounded-xl">
                                        <FaTrophy className="text-green-600" size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                            Most Profitable Brand
                                        </p>
                                        <p className="text-gray-800 font-bold text-lg mt-0.5">
                                            {dashboard.highest_profit_brand}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}