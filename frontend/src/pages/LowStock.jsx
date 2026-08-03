import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { getLowStockProducts } from "../services/lowStockService";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Truck, Search, RefreshCw, Loader2, PackageX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

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
    const high = products.filter((p) => p.stock > 0 && p.stock <= Math.ceil(p.minimum_stock * 0.5)).length;
    const low = products.length - critical - high;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Low Stock Center
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Automated stock warnings and replenishment alerts
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={load} className="rounded-xl">
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </Button>
                        <Button variant="gradient" onClick={() => navigate("/purchases")} className="text-slate-950 font-bold">
                            <Truck className="h-4 w-4 mr-2" />
                            <span>Create PO</span>
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Out of Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-red-600 dark:text-red-400">{critical}</div>
                            <p className="text-xs text-slate-400 mt-1">Requires immediate purchase order</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Critical Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-amber-600 dark:text-amber-400">{high}</div>
                            <p className="text-xs text-slate-400 mt-1">Below 50% threshold</p>
                        </CardContent>
                    </Card>

                    <Card className={products.length === 0 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-blue-500"}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                                {products.length === 0 ? "Status" : "Moderate Low"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
                                {products.length === 0 ? "✓ Healthy" : low}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {products.length === 0 ? "All items well supplied" : "Approaching minimum stock"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Filter by product name, brand, or category..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                                <p className="text-sm font-medium">Scanning stock thresholds...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-1" />
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">All Stock Levels Healthy</p>
                                <p className="text-xs text-slate-500">No items are currently below minimum safety stock.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead className="text-center">Current Stock</TableHead>
                                        <TableHead className="text-center">Min Required</TableHead>
                                        <TableHead className="text-center">Stock Deficit</TableHead>
                                        <TableHead className="text-center">Urgency</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(product => {
                                        const deficit = Math.max(0, product.minimum_stock - product.stock);
                                        const isOut = product.stock === 0;
                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{product.name}</TableCell>
                                                <TableCell>{product.brand || "—"}</TableCell>
                                                <TableCell className="text-center font-bold">
                                                    <span className={isOut ? "text-red-500 font-extrabold" : "text-amber-600"}>
                                                        {product.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center text-slate-500">{product.minimum_stock}</TableCell>
                                                <TableCell className="text-center font-bold text-red-500">-{deficit}</TableCell>
                                                <TableCell className="text-center">
                                                    {isOut ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <PackageX className="h-3 w-3" /> Out of Stock
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="warning" className="gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> Low Stock
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
