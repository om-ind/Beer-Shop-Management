import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
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
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Trophy, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

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
                <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <p className="text-sm font-medium">Running Intelligence Analytics...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                            Smart Analytics Dashboard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Automated brand profitability and velocity metrics
                        </p>
                    </div>
                </div>

                {/* Best vs Worst Brand KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Highest Profit Brand</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                                    {bestBrand?.brand || "No data"}
                                </div>
                                {bestBrand?.total_profit != null && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total Profit: <span className="font-bold text-emerald-600">₹{Number(bestBrand.total_profit).toLocaleString("en-IN")}</span>
                                    </p>
                                )}
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                                <Trophy className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>Lowest Profit Brand</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                                    {worstBrand?.brand || "No data"}
                                </div>
                                {worstBrand?.total_profit != null && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total Profit: <span className="font-bold text-red-500">₹{Number(worstBrand.total_profit).toLocaleString("en-IN")}</span>
                                    </p>
                                )}
                            </div>
                            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sales Trend Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Revenue Velocity Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salesTrend.length === 0 ? (
                            <p className="text-slate-400 text-sm py-12 text-center">No trend data available</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Sales"]} />
                                    <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Profit by Brand Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Profitability Breakdown by Brand</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={brandProfit}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="brand" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Profit"]} />
                                <Bar dataKey="total_profit" radius={[6, 6, 0, 0]}>
                                    {brandProfit.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Restock & Pie Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Top Products Volume Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={topProducts}
                                        dataKey="total_quantity"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                    >
                                        {topProducts.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <PieTooltip formatter={(v, n) => [`${v} units`, n]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold">Restock Warnings</CardTitle>
                            <Badge variant={restock.length > 0 ? "destructive" : "success"}>
                                {restock.length} Items Pending
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[260px] overflow-y-auto">
                            {restock.length === 0 ? (
                                <p className="text-emerald-500 font-semibold text-center py-12 text-sm">
                                    All inventory levels optimal ✓
                                </p>
                            ) : (
                                restock.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</p>
                                            <p className="text-xs text-slate-400">{p.brand}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="destructive">{p.stock} left</Badge>
                                            <p className="text-[10px] text-slate-400 mt-1">Min required: {p.minimum_stock}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top Ranking Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Product Velocity Ranking</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead className="text-right">Units Sold</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-bold text-base">#{i + 1}</TableCell>
                                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">{p.name}</TableCell>
                                        <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{p.total_quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}