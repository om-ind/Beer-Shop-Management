import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer, Legend, Cell
} from "recharts";
import {
    FaChartBar, FaShoppingCart, FaBoxOpen, FaTruck,
    FaExclamationTriangle, FaChartLine, FaTrophy, FaArrowUp
} from "react-icons/fa";
import {
    getDashboardReport, getSalesTrend, getTopProducts,
    getLowStockProducts, getProfitSummary
} from "../services/reportService";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

function KPICard({ title, value, sub, icon, gradient, iconBg }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                    {icon}
                </div>
            </div>
            {/* Decorative circle */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
                <p className="text-slate-300 mb-1">{label}</p>
                <p className="font-bold text-emerald-400">₹{Number(payload[0].value).toLocaleString("en-IN")}</p>
            </div>
        );
    }
    return null;
};

export default function Reports() {
    const [report, setReport] = useState({ today_sales: 0, monthly_sales: 0, total_purchases: 0, low_stock: 0 });
    const [trend, setTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [profit, setProfit] = useState({ total_profit: 0, total_items: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        loadReport();
    }, []);

    async function loadReport() {
        try {
            setLoading(true);
            const [dashboard, trendData, top, low, profitData] = await Promise.all([
                getDashboardReport(),
                getSalesTrend(),
                getTopProducts(),
                getLowStockProducts(),
                getProfitSummary(),
            ]);
            setReport(dashboard);
            setTrend(trendData.map(d => ({ ...d, day: d.day?.slice(5) })));
            setTopProducts(top);
            setLowStock(low);
            setProfit(profitData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const TABS = ["overview", "sales trend", "top products", "low stock"];

    if (loading) {
        return (
            <AdminLayout>
                <Navbar />
                <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                        <p>Loading reports...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Navbar />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
                        <FaChartBar />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
                        <p className="text-sm text-slate-500">Business performance overview</p>
                    </div>
                </div>
                <button
                    onClick={loadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium text-sm transition"
                >
                    <FaArrowUp className="rotate-45" /> Refresh
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <KPICard
                    title="Today's Sales"
                    value={`₹${Number(report.today_sales).toLocaleString("en-IN")}`}
                    sub="Revenue today"
                    icon={<FaShoppingCart />}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    iconBg="bg-white/20"
                />
                <KPICard
                    title="Monthly Sales"
                    value={`₹${Number(report.monthly_sales).toLocaleString("en-IN")}`}
                    sub="This month"
                    icon={<FaChartLine />}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                    iconBg="bg-white/20"
                />
                <KPICard
                    title="Total Profit"
                    value={`₹${Number(profit.total_profit).toLocaleString("en-IN")}`}
                    sub={`${profit.total_items} items sold`}
                    icon={<FaTrophy />}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    iconBg="bg-white/20"
                />
                <KPICard
                    title="Total Purchases"
                    value={`₹${Number(report.total_purchases).toLocaleString("en-IN")}`}
                    sub="All time spend"
                    icon={<FaTruck />}
                    gradient="bg-gradient-to-br from-orange-500 to-amber-500"
                    iconBg="bg-white/20"
                />
                <KPICard
                    title="Low Stock"
                    value={report.low_stock}
                    sub="Need restock"
                    icon={<FaExclamationTriangle />}
                    gradient={report.low_stock > 0 ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-slate-500 to-slate-600"}
                    iconBg="bg-white/20"
                />
                <KPICard
                    title="Avg. Sale Value"
                    value={`₹${trend.length > 0 ? (trend.reduce((s, d) => s + Number(d.total), 0) / trend.length).toFixed(0) : 0}`}
                    sub="Daily average"
                    icon={<FaChartBar />}
                    gradient="bg-gradient-to-br from-pink-500 to-rose-500"
                    iconBg="bg-white/20"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        id={`report-tab-${tab.replace(" ", "-")}`}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium capitalize rounded-t-xl transition-all ${
                            activeTab === tab
                                ? "bg-white border border-b-white border-slate-200 -mb-px text-indigo-600"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Mini */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <h2 className="text-base font-bold text-slate-700 mb-4">Sales Trend (30 days)</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Products Mini */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <h2 className="text-base font-bold text-slate-700 mb-4">Top Products by Revenue</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} stroke="#94A3B8" />
                                <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                    {topProducts.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === "sales trend" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-6">Sales Trend — Last 30 Days</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="total" name="Sales (₹)" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: "#6366F1" }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {activeTab === "top products" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-700">Top 10 Products</h2>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rank</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Qty Sold</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topProducts.map((product, idx) => {
                                const maxQty = topProducts[0]?.qty_sold || 1;
                                const pct = Math.round((product.qty_sold / maxQty) * 100);
                                const medals = ["🥇", "🥈", "🥉"];
                                return (
                                    <tr key={idx} className="hover:bg-indigo-50/30">
                                        <td className="px-5 py-3.5 text-lg">{medals[idx] || `#${idx + 1}`}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{product.name}</td>
                                        <td className="px-5 py-3.5 text-right text-slate-600 font-medium">{product.qty_sold}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-800">₹{Number(product.revenue).toLocaleString("en-IN")}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "low stock" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        <h2 className="text-lg font-bold text-slate-700">Low Stock Products</h2>
                        <span className="ml-auto bg-red-50 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
                            {lowStock.length} items
                        </span>
                    </div>
                    {lowStock.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <FaBoxOpen className="mx-auto text-5xl mb-3 opacity-30" />
                            <p className="font-medium">All products are well stocked!</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Brand</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Stock</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Min Stock</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Urgency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lowStock.map((product, idx) => {
                                    const pct = Math.round((product.stock / product.minimum_stock) * 100);
                                    const urgency = pct === 0 ? "Out of Stock" : pct < 50 ? "Critical" : "Low";
                                    const urgencyColor = pct === 0 ? "bg-red-100 text-red-700" : pct < 50 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
                                    return (
                                        <tr key={idx} className="hover:bg-red-50/30">
                                            <td className="px-5 py-3.5 font-semibold text-slate-800">{product.name}</td>
                                            <td className="px-5 py-3.5 text-slate-500">{product.brand}</td>
                                            <td className="px-5 py-3.5 text-slate-500">{product.category}</td>
                                            <td className="px-5 py-3.5 text-center font-bold text-red-500">{product.stock}</td>
                                            <td className="px-5 py-3.5 text-center text-slate-500">{product.minimum_stock}</td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${urgencyColor}`}>
                                                    {urgency}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}