import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getDashboard } from "../services/dashboardService";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
    IndianRupee,
    TrendingUp,
    Boxes,
    Users,
    Truck,
    AlertTriangle,
    Receipt,
    Scale,
    Star,
    Award,
    Calendar,
    Loader2
} from "lucide-react";

function KPICard({ title, value, icon: Icon, color, sub }) {
    return (
        <Card className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-xl text-white shadow-md ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100 tracking-tight">
                    {value}
                </div>
                {sub && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {sub}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const today = () => new Date().toISOString().slice(0, 10);
    const [dashboard, setDashboard] = useState(null);
    const [selectedDate, setSelectedDate] = useState(today());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [selectedDate]);

    async function loadDashboard() {
        setLoading(true);
        try {
            const data = await getDashboard(selectedDate);
            setDashboard(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

    if (loading && !dashboard) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <p className="text-sm font-medium">Loading Dashboard Metrics...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                            Shop Dashboard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Real-time sales, inventory metrics, and financial performance
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date:</span>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="h-8 border-none bg-transparent p-0 text-sm font-semibold text-slate-700 dark:text-slate-200 focus-visible:ring-0 cursor-pointer w-auto"
                        />
                    </div>
                </div>

                {/* ── Sales & Financial Overview ── */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Financial Metrics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KPICard
                            title="Today's Sales"
                            value={fmt(dashboard?.today_sales)}
                            icon={IndianRupee}
                            color="bg-blue-600 shadow-blue-600/20"
                        />
                        <KPICard
                            title="Today's Profit"
                            value={fmt(dashboard?.today_profit)}
                            icon={TrendingUp}
                            color="bg-emerald-600 shadow-emerald-600/20"
                        />
                        <KPICard
                            title="Weekly Sales"
                            value={fmt(dashboard?.weekly_sales)}
                            icon={TrendingUp}
                            color="bg-purple-600 shadow-purple-600/20"
                        />
                        <KPICard
                            title="Monthly Sales"
                            value={fmt(dashboard?.monthly_sales)}
                            icon={Award}
                            color="bg-amber-600 shadow-amber-600/20"
                        />
                        <KPICard
                            title="Monthly Expenses"
                            value={fmt(dashboard?.monthly_expenses)}
                            icon={Receipt}
                            color="bg-rose-600 shadow-rose-600/20"
                            sub="Operating cost"
                        />
                        <KPICard
                            title="Net Profit"
                            value={fmt(dashboard?.net_profit)}
                            icon={Scale}
                            color={dashboard?.net_profit >= 0 ? "bg-emerald-600 shadow-emerald-600/20" : "bg-red-600 shadow-red-600/20"}
                            sub="Revenue − Expenses"
                        />
                    </div>
                </div>

                {/* ── Inventory & Operations ── */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Inventory & Operations
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <KPICard
                            title="Inventory Value"
                            value={fmt(dashboard?.inventory_value)}
                            icon={Boxes}
                            color="bg-cyan-600 shadow-cyan-600/20"
                            sub="Total stock cost"
                        />
                        <KPICard
                            title="Total Products"
                            value={dashboard?.total_products || 0}
                            icon={Boxes}
                            color="bg-indigo-600 shadow-indigo-600/20"
                        />
                        <KPICard
                            title="Low Stock Alerts"
                            value={dashboard?.low_stock || 0}
                            icon={AlertTriangle}
                            color={dashboard?.low_stock > 0 ? "bg-red-600 shadow-red-600/20" : "bg-emerald-600 shadow-emerald-600/20"}
                            sub={dashboard?.low_stock > 0 ? "Items require restock" : "All stock healthy"}
                        />
                    </div>
                </div>

                {/* ── Partners & Highlights ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Partners Cards */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Partners
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <KPICard
                                title="Total Customers"
                                value={dashboard?.total_customers || 0}
                                icon={Users}
                                color="bg-pink-600 shadow-pink-600/20"
                            />
                            <KPICard
                                title="Total Suppliers"
                                value={dashboard?.total_suppliers || 0}
                                icon={Truck}
                                color="bg-slate-700 shadow-slate-700/20"
                            />
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Highlights
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="border-l-4 border-l-amber-500 p-4 flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Star className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Product</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                                        {dashboard?.top_product || "N/A"}
                                    </p>
                                </div>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500 p-4 flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Award className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Brand</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                                        {dashboard?.highest_profit_brand || "N/A"}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}