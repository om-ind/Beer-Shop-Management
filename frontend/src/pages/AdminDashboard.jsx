import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOverview } from "../services/shopsService";
import AdminLayout from "../layouts/AdminLayout";
import { Building2, Users, IndianRupee, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

function StatCard({ icon: Icon, label, value, sub, color }) {
    return (
        <Card className="relative overflow-hidden border-slate-800 bg-slate-900 text-white shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</CardTitle>
                <div className={`p-2 rounded-xl text-white ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-display text-white tracking-tight">{value}</div>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </CardContent>
        </Card>
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
                <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <p className="text-sm font-medium">Loading Admin Master Console...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
                            Global Admin Console
                        </h1>
                        <p className="text-slate-400 text-sm mt-0.5">
                            Cross-tenant shop monitoring and revenue breakdown
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Building2}
                        label="Active Shops"
                        value={overview?.total_shops ?? 0}
                        sub="Tenant stores"
                        color="bg-purple-600"
                    />
                    <StatCard
                        icon={Users}
                        label="Total Users"
                        value={overview?.total_users ?? 0}
                        sub="Registered accounts"
                        color="bg-blue-600"
                    />
                    <StatCard
                        icon={IndianRupee}
                        label="Global Revenue"
                        value={fmt(overview?.total_revenue)}
                        sub="All time across shops"
                        color="bg-emerald-600"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Transactions"
                        value={(overview?.total_sales ?? 0).toLocaleString()}
                        sub="Completed sales"
                        color="bg-amber-600"
                    />
                </div>

                {/* Table */}
                <Card className="border-slate-800 bg-slate-900 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base font-bold">Shop Performance Breakdown</CardTitle>
                        <Button variant="ghost" onClick={() => navigate("/admin/shops")} className="text-purple-400 hover:text-purple-300">
                            Manage All Shops <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-400">#</TableHead>
                                    <TableHead className="text-slate-400">Shop Name</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-slate-400">Total Sales</TableHead>
                                    <TableHead className="text-right text-slate-400">Revenue</TableHead>
                                    <TableHead className="text-center text-slate-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(overview?.shop_breakdown || []).map((shop, idx) => (
                                    <TableRow key={shop.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
                                        <TableCell className="font-bold text-white">{shop.name}</TableCell>
                                        <TableCell>
                                            {shop.is_active ? (
                                                <Badge variant="success" className="gap-1 text-[11px]">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="gap-1 text-[11px]">
                                                    <XCircle className="h-3 w-3" /> Suspended
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-300">{shop.sales_count}</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-400">{fmt(shop.revenue)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate("/admin/shops")}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                Details
                                            </Button>
                                        </TableCell>
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
