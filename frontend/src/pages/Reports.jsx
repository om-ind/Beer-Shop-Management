import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer, Legend, Cell
} from "recharts";
import {
    BarChart3, ShoppingCart, Package, Truck,
    AlertTriangle, TrendingUp, Award, RefreshCw, Loader2
} from "lucide-react";
import {
    getDashboardReport, getSalesTrend, getTopProducts,
    getLowStockProducts, getProfitSummary
} from "../services/reportService";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

function KPICard({ title, value, sub, icon: Icon, color }) {
    return (
        <Card className="relative overflow-hidden border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
                <div className={`p-2 rounded-xl text-white shadow-sm ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    {value}
                </div>
                {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
            </CardContent>
        </Card>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs border border-slate-800">
                <p className="text-slate-400 mb-1">{label}</p>
                <p className="font-bold text-emerald-400 text-sm">₹{Number(payload[0].value).toLocaleString("en-IN")}</p>
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
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getDashboardReport(),
                getSalesTrend(),
                getTopProducts(),
                getLowStockProducts(),
                getProfitSummary(),
            ]);

            if (results[0].status === "fulfilled" && results[0].value) setReport(results[0].value);
            if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
                setTrend(results[1].value.map(d => ({ ...d, day: d.day?.slice(5) })));
            }
            if (results[2].status === "fulfilled" && Array.isArray(results[2].value)) setTopProducts(results[2].value);
            if (results[3].status === "fulfilled" && Array.isArray(results[3].value)) setLowStock(results[3].value);
            if (results[4].status === "fulfilled" && results[4].value) setProfit(results[4].value);
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
                <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <p className="text-sm font-medium">Generating Report Visualizations...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Analytics & Reports
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Executive financial reports and sales trends
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={loadReport} className="rounded-xl">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <span>Refresh Data</span>
                    </Button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KPICard
                        title="Today's Sales"
                        value={`₹${Number(report.today_sales).toLocaleString("en-IN")}`}
                        sub="Revenue today"
                        icon={ShoppingCart}
                        color="bg-blue-600 shadow-blue-600/20"
                    />
                    <KPICard
                        title="Monthly Sales"
                        value={`₹${Number(report.monthly_sales).toLocaleString("en-IN")}`}
                        sub="This month"
                        icon={TrendingUp}
                        color="bg-purple-600 shadow-purple-600/20"
                    />
                    <KPICard
                        title="Total Profit"
                        value={`₹${Number(profit.total_profit).toLocaleString("en-IN")}`}
                        sub={`${profit.total_items} items sold`}
                        icon={Award}
                        color="bg-emerald-600 shadow-emerald-600/20"
                    />
                    <KPICard
                        title="Purchases"
                        value={`₹${Number(report.total_purchases).toLocaleString("en-IN")}`}
                        sub="Spend total"
                        icon={Truck}
                        color="bg-amber-600 shadow-amber-600/20"
                    />
                    <KPICard
                        title="Low Stock"
                        value={report.low_stock}
                        sub="Items restock"
                        icon={AlertTriangle}
                        color={report.low_stock > 0 ? "bg-red-600 shadow-red-600/20" : "bg-slate-700 shadow-slate-700/20"}
                    />
                    <KPICard
                        title="Avg Daily Sale"
                        value={`₹${trend.length > 0 ? (trend.reduce((s, d) => s + Number(d.total), 0) / trend.length).toFixed(0) : 0}`}
                        sub="Daily average"
                        icon={BarChart3}
                        color="bg-pink-600 shadow-pink-600/20"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            id={`report-tab-${tab.replace(" ", "-")}`}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                                activeTab === tab
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Views */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Sales Trend (30 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={trend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                        <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Top Products by Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} stroke="#94A3B8" />
                                        <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                            {topProducts.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "sales trend" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Comprehensive 30-Day Sales Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" name="Daily Revenue (₹)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {activeTab === "top products" && (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Qty Sold</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                        <TableHead>Volume Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProducts.map((product, idx) => {
                                        const maxQty = topProducts[0]?.qty_sold || 1;
                                        const pct = Math.round((product.qty_sold / maxQty) * 100);
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell className="font-bold text-base">#{idx + 1}</TableCell>
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{product.name}</TableCell>
                                                <TableCell className="text-right font-medium">{product.qty_sold}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₹{Number(product.revenue).toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="w-48">
                                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                                                        <div className="h-2 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {activeTab === "low stock" && (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Stock</TableHead>
                                        <TableHead className="text-center">Min Stock Threshold</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStock.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                                <Package className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">All inventory stock level healthy!</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lowStock.map((product, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{product.name}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{product.category}</TableCell>
                                                <TableCell className="text-center font-bold text-red-500">{product.stock}</TableCell>
                                                <TableCell className="text-center">{product.minimum_stock}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="destructive" className="gap-1">
                                                        <AlertTriangle className="h-3 w-3" /> Critical Restock
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}