import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import SupplierModal from "../components/Suppliers/SupplierModal";
import SupplierBillsModal from "../components/Suppliers/SupplierBillsModal";
import { toast } from "react-toastify";
import { Truck, Plus, Search, Edit3, Trash2, FileText, Phone, Building2, Loader2, AlertTriangle } from "lucide-react";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, checkSupplierLinks, forceDeleteSupplier } from "../services/supplierService";
import { getSupplierBillsOverview } from "../services/supplierBillsService";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [billsOverview, setBillsOverview] = useState({});
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [linkInfo, setLinkInfo] = useState(null);
    const [billsSupplier, setBillsSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAll(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            !q ? suppliers :
            suppliers.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.company?.toLowerCase().includes(q) ||
                s.mobile?.includes(q)
            )
        );
    }, [search, suppliers]);

    async function loadAll() {
        try {
            setLoading(true);
            const [suppData, overview] = await Promise.all([
                getSuppliers(),
                getSupplierBillsOverview().catch(() => ({ suppliers: [], grand_pending: 0, grand_overdue: 0 })),
            ]);
            setSuppliers(suppData);
            const idx = {};
            (overview.suppliers || []).forEach(s => { idx[s.supplier_id] = s; });
            setBillsOverview({ index: idx, grand_pending: overview.grand_pending, grand_overdue: overview.grand_overdue });
        } catch {
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(form) {
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, form);
                toast.success("Supplier updated!");
            } else {
                await addSupplier(form);
                toast.success("Supplier added!");
            }
            setShowModal(false);
            setEditingSupplier(null);
            loadAll();
        } catch {
            toast.error("Operation failed");
        }
    }

    async function handleDeleteClick(supplier) {
        setLinkInfo(null);
        setDeleteConfirm(supplier);
        try {
            const info = await checkSupplierLinks(supplier.id);
            setLinkInfo(info);
        } catch {
            setLinkInfo({ purchases: 0, bills: 0, has_links: false });
        }
    }

    async function confirmDelete(force = false) {
        if (!deleteConfirm) return;
        try {
            if (force) {
                await forceDeleteSupplier(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" deleted`);
            } else {
                await deleteSupplier(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" deleted`);
            }
            setDeleteConfirm(null);
            setLinkInfo(null);
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Cannot delete supplier");
        }
    }

    const grandPending = billsOverview.grand_pending || 0;
    const grandOverdue = billsOverview.grand_overdue || 0;

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
                                Supplier Management
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{suppliers.length} Registered Suppliers</span>
                                {grandPending > 0 && (
                                    <>
                                        <span>•</span>
                                        <Badge variant={grandOverdue > 0 ? "destructive" : "warning"} className="px-2 py-0 text-xs">
                                            ₹{Number(grandPending).toFixed(2)} Pending
                                            {grandOverdue > 0 && ` (${grandOverdue} overdue)`}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        id="add-supplier-btn"
                        variant="gradient"
                        onClick={() => { setEditingSupplier(null); setShowModal(true); }}
                        className="text-slate-950 font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add Supplier</span>
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="supplier-search"
                                type="text"
                                placeholder="Search by name, company name, or mobile..."
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
                                <p className="text-sm font-medium">Loading suppliers list...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Supplier Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead className="text-right">Pending Bills</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                                <Truck className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No suppliers found</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((supplier, idx) => {
                                            const overview = billsOverview.index?.[supplier.id] || {};
                                            const pending = overview.total_pending || 0;
                                            const overdue = overview.overdue_count || 0;
                                            return (
                                                <TableRow key={supplier.id}>
                                                    <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                                                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                        {supplier.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{supplier.company || "—"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{supplier.mobile || "—"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {pending > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className={overdue > 0 ? "text-red-500" : "text-amber-600"}>
                                                                    ₹{Number(pending).toFixed(2)}
                                                                </span>
                                                                {overdue > 0 && (
                                                                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px] mt-0.5">
                                                                        {overdue} Overdue
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="success" className="text-[10px]">
                                                                Clear ✓
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                id={`bills-${supplier.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setBillsSupplier(supplier)}
                                                                className="h-8 w-8 text-orange-600 hover:bg-orange-500/10"
                                                                title="View Bills"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                id={`edit-supplier-${supplier.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                                                                className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                                                                title="Edit"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                id={`delete-supplier-${supplier.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(supplier)}
                                                                className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Add/Edit Modal */}
                {showModal && (
                    <SupplierModal
                        isOpen={showModal}
                        supplier={editingSupplier}
                        onClose={() => { setShowModal(false); setEditingSupplier(null); }}
                        onSave={handleSave}
                    />
                )}

                {/* Bills Modal */}
                {billsSupplier && (
                    <SupplierBillsModal
                        supplier={billsSupplier}
                        onClose={() => { setBillsSupplier(null); loadAll(); }}
                    />
                )}

                {/* Delete Dialog */}
                <Dialog
                    isOpen={!!deleteConfirm}
                    onClose={() => { setDeleteConfirm(null); setLinkInfo(null); }}
                    title="Delete Supplier"
                    description={`Remove supplier "${deleteConfirm?.name}"?`}
                >
                    <div className="space-y-4 pt-2">
                        {linkInfo === null && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Verifying linked purchase history...</span>
                            </div>
                        )}

                        {linkInfo?.has_links && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                                <p className="font-bold">⚠ Supplier has associated data:</p>
                                {linkInfo.purchases > 0 && <p>• {linkInfo.purchases} purchase orders</p>}
                                {linkInfo.bills > 0 && <p>• {linkInfo.bills} supplier bills</p>}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={() => { setDeleteConfirm(null); setLinkInfo(null); }}>
                                Cancel
                            </Button>
                            {linkInfo?.has_links ? (
                                <Button variant="destructive" onClick={() => confirmDelete(true)}>
                                    Force Delete All
                                </Button>
                            ) : (
                                <Button variant="destructive" disabled={linkInfo === null} onClick={() => confirmDelete(false)}>
                                    Remove Supplier
                                </Button>
                            )}
                        </div>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}