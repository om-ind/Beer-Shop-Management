import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import SupplierModal from "../components/Suppliers/SupplierModal";
import SupplierBillsModal from "../components/Suppliers/SupplierBillsModal";
import { toast } from "react-toastify";
import {
    FaTruck, FaPlus, FaSearch, FaEdit, FaTrash,
    FaFileInvoice, FaExclamationTriangle, FaPhone, FaBuilding
} from "react-icons/fa";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "../services/supplierService";
import { getSupplierBillsOverview } from "../services/supplierBillsService";

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [billsOverview, setBillsOverview] = useState({});
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
            // Index overview by supplier_id for quick lookup
            const idx = {};
            (overview.suppliers || []).forEach(s => { idx[s.supplier_id] = s; });
            setBillsOverview({ index: idx, grand_pending: overview.grand_pending, grand_overdue: overview.grand_overdue });
        } catch (err) {
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

    async function confirmDelete() {
        if (!deleteConfirm) return;
        try {
            await deleteSupplier(deleteConfirm.id);
            toast.success(`"${deleteConfirm.name}" deleted`);
            setDeleteConfirm(null);
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Cannot delete supplier");
        }
    }

    const grandPending = billsOverview.grand_pending || 0;
    const grandOverdue = billsOverview.grand_overdue || 0;

    return (
        <AdminLayout>
            <Navbar />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                        <FaTruck />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
                        <p className="text-sm text-slate-500">
                            {suppliers.length} suppliers
                            {grandPending > 0 && (
                                <> &nbsp;·&nbsp;
                                    <span className={grandOverdue > 0 ? "text-red-500 font-semibold" : "text-amber-500 font-semibold"}>
                                        {grandOverdue > 0 && <FaExclamationTriangle className="inline text-xs mr-1" />}
                                        ₹{Number(grandPending).toFixed(2)} pending
                                        {grandOverdue > 0 && ` · ${grandOverdue} overdue`}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    id="add-supplier-btn"
                    onClick={() => { setEditingSupplier(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all"
                >
                    <FaPlus /> Add Supplier
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        id="supplier-search"
                        type="text"
                        placeholder="Search by name, company, or mobile..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Bills</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16 text-slate-400">
                                        <FaTruck className="mx-auto text-4xl mb-3 opacity-30" />
                                        <p className="font-medium">No suppliers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((supplier, idx) => {
                                    const overview = billsOverview.index?.[supplier.id] || {};
                                    const pending = overview.total_pending || 0;
                                    const overdue = overview.overdue_count || 0;
                                    return (
                                        <tr key={supplier.id} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-5 py-3.5 text-sm text-slate-400">{idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {supplier.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{supplier.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <FaBuilding className="text-xs text-slate-400" />
                                                    {supplier.company || "—"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <FaPhone className="text-xs text-slate-400" />
                                                    {supplier.mobile || "—"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {pending > 0 ? (
                                                    <div>
                                                        <span className={`font-bold text-sm ${overdue > 0 ? "text-red-500" : "text-amber-500"}`}>
                                                            ₹{Number(pending).toFixed(2)}
                                                        </span>
                                                        {overdue > 0 && (
                                                            <span className="ml-1.5 text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                                                                {overdue} overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-emerald-500 text-sm">Clear ✓</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        id={`bills-${supplier.id}`}
                                                        onClick={() => setBillsSupplier(supplier)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            pending > 0
                                                                ? "bg-orange-50 text-orange-500 hover:bg-orange-100"
                                                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                        }`}
                                                        title="View Bills"
                                                    >
                                                        <FaFileInvoice />
                                                    </button>
                                                    <button
                                                        id={`edit-supplier-${supplier.id}`}
                                                        onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                                                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        id={`delete-supplier-${supplier.id}`}
                                                        onClick={() => setDeleteConfirm(supplier)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <SupplierModal
                    isOpen={showModal}
                    supplier={editingSupplier}
                    onClose={() => { setShowModal(false); setEditingSupplier(null); }}
                    onSave={handleSave}
                />
            )}

            {/* Supplier Bills Modal */}
            {billsSupplier && (
                <SupplierBillsModal
                    supplier={billsSupplier}
                    onClose={() => { setBillsSupplier(null); loadAll(); }}
                />
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Supplier?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Remove <strong>"{deleteConfirm.name}"</strong> permanently?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition">
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}