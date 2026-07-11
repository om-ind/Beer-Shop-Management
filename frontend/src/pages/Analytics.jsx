import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
    getBrandProfit,
    getTopSellingProducts,
    getRestockAlerts,
    getAnalyticsSalesTrend,
    getHighestProfitBrand,
    getLowestProfitBrand,
} from "../services/analyticsService";
import { FaArrowUp, FaArrowDown, FaExclamationTriangle } from "react-icons/fa";

const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

export default function Analytics() {

    const [brandProfit, setBrandProfit] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [restock, setRestock] = useState([]);
    const [salesTrend, setSalesTrend] = useState([]);
    const [bestBrand, setBestBrand] = useState(null);
    const [worstBrand, setWorstBrand] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [bp, tp, rs, st, best, worst] = await Promise.all([
                getBrandProfit(),
                getTopSellingProducts(),
                getRestockAlerts(),
                getAnalyticsSalesTrend(),
                getHighestProfitBrand(),
                getLowestProfitBrand(),
            ]);
            setBrandProfit(bp);
            setTopProducts(tp);
            setRestock(rs);
            setSalesTrend(st.map(d => ({ ...d, date: d.date?.slice(5) })));
            setBestBrand(best);
            setWorstBrand(worst);
        } catch (err) {
            console.error("Analytics error:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <Navbar />
                <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
                    Loading Analytics...
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Navbar />

            <div className="space-y-8 p-2">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
                    <p className="text-gray-500 mt-1">Business insights and performance metrics</p>
                </div>

                {/* ── Top Brand Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Best Brand */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <FaArrowUp size={18} />
                            </div>
                            <span className="text-green-100 text-sm font-medium">Highest Profit Brand</span>
                        </div>
                        <p className="text-3xl font-bold">
                            {bestBrand?.brand || "No data"}
                        </p>
                        {bestBrand?.total_profit != null && (
                            <p className="text-green-100 text-sm mt-1">
                                ₹{Number(bestBrand.total_profit).toLocaleString("en-IN")} profit
                            </p>
                        )}
                    </div>

                    {/* Worst Brand */}
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <FaArrowDown size={18} />
                            </div>
                            <span className="text-red-100 text-sm font-medium">Lowest Profit Brand</span>
                        </div>
                        <p className="text-3xl font-bold">
                            {worstBrand?.brand || "No data"}
                        </p>
                        {worstBrand?.total_profit != null && (
                            <p className="text-red-100 text-sm mt-1">
                                ₹{Number(worstBrand.total_profit).toLocaleString("en-IN")} profit
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Sales Trend Chart ── */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-5">
                        📈 Sales Trend
                    </h2>
                    {salesTrend.length === 0 ? (
                        <p className="text-gray-400 text-sm py-8 text-center">No sales data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Sales"]} />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#3b82f6" }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── Brand Profit Bar Chart ── */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-5">
                        💰 Profit by Brand
                    </h2>
                    {brandProfit.length === 0 ? (
                        <p className="text-gray-400 text-sm py-8 text-center">No profit data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={brandProfit} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="brand" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Profit"]}
                                    contentStyle={{ borderRadius: "12px" }}
                                />
                                <Bar dataKey="total_profit" radius={[8, 8, 0, 0]}>
                                    {brandProfit.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── Top Products Pie + Table ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Pie Chart */}
                    <div className="bg-white rounded-2xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-5">
                            🥇 Top Selling Products
                        </h2>
                        {topProducts.length === 0 ? (
                            <p className="text-gray-400 text-sm py-8 text-center">No sales data yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={topProducts}
                                        dataKey="total_quantity"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) =>
                                            `${name?.split(" ")[0]} (${(percent * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {topProducts.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <PieTooltip
                                        formatter={(v, n) => [`${v} units`, n]}
                                        contentStyle={{ borderRadius: "12px" }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Restock Alerts */}
                    <div className="bg-white rounded-2xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                            <FaExclamationTriangle className="text-orange-500" />
                            Restock Alerts
                        </h2>
                        {restock.length === 0 ? (
                            <p className="text-green-600 font-medium text-center py-8">
                                ✅ All products are well stocked!
                            </p>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-60">
                                {restock.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.brand}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-600 font-bold text-sm">{p.stock} left</p>
                                            <p className="text-xs text-gray-400">Min: {p.minimum_stock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top Products Ranking Table ── */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">📊 Top Products Ranking</h2>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">#</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Product</th>
                                <th className="py-3 px-6 text-right text-sm font-semibold text-gray-600">Units Sold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topProducts.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition">
                                    <td className="py-3 px-6 text-gray-400 font-bold">
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                    </td>
                                    <td className="py-3 px-6 text-gray-800 font-medium">{p.name}</td>
                                    <td className="py-3 px-6 text-right font-bold text-blue-600">
                                        {p.total_quantity}
                                    </td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-10 text-center text-gray-400">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}