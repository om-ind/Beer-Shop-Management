import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import PurchaseModal from "../components/Purchases/PurchaseModal";
import { toast } from "react-toastify";
import { Truck, Plus, Search, Loader2, FileText } from "lucide-react";
import { getPurchases, createPurchase } from "../services/purchaseService";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchases();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(purchases);
        } else {
            const q = search.toLowerCase();
            setFiltered(purchases.filter(p =>
                p.invoice_number?.toLowerCase().includes(q) ||
                p.supplier?.toLowerCase().includes(q) ||
                p.payment_mode?.toLowerCase().includes(q)
            ));
        }
    }, [search, purchases]);

    async function loadPurchases() {
        try {
            setLoading(true);
            const data = await getPurchases();
            setPurchases(data);
        } catch {
            toast.error("Failed to load purchases");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(purchase) {
        try {
            const result = await createPurchase(purchase);
            toast.success(`Purchase saved! Invoice: ${result.invoice_number}`);
            setShowModal(false);
            loadPurchases();
        } catch {
            toast.error("Failed to save purchase.");
        }
    }

    const totalSpend = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Purchase Orders
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{purchases.length} Orders Logged</span>
                                <span>•</span>
                                <Badge variant="warning" className="px-2 py-0 text-xs font-bold">
                                    ₹{totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Total Spend
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Button
                        id="new-purchase-btn"
                        variant="gradient"
                        onClick={() => setShowModal(true)}
                        className="text-slate-950 font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>New Purchase Order</span>
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="purchase-search"
                                type="text"
                                placeholder="Search by invoice number, supplier name, or payment method..."
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
                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                <p className="text-sm font-medium">Loading purchase records...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                <p className="font-semibold text-slate-900 dark:text-slate-100">No purchases found</p>
                                <p className="text-xs text-slate-500">Record a new stock purchase to get started</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Transport</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead className="text-center">Payment Mode</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((purchase, idx) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {purchase.invoice_number}
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                {purchase.supplier || "—"}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs">
                                                {purchase.purchase_date
                                                    ? new Date(purchase.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {purchase.transport_total > 0 ? (
                                                    <span className="font-bold text-amber-600">₹{Number(purchase.transport_total).toFixed(2)}</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                                ₹{Number(purchase.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-[11px]">
                                                    {purchase.payment_mode || "Cash"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Purchase Modal */}
                {showModal && (
                    <PurchaseModal
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                    />
                )}
            </div>
        </AdminLayout>
    );
}