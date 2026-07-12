import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import CustomerModal from "../components/Customers/CustomerModal";
import CreditHistoryModal from "../components/Customers/CreditHistoryModal";
import { toast } from "react-toastify";
import {
    FaUsers, FaPlus, FaSearch, FaEdit, FaTrash,
    FaWallet, FaPhone, FaHistory
} from "react-icons/fa";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, checkCustomerLinks, forceDeleteCustomer } from "../services/customerService";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [linkInfo, setLinkInfo] = useState(null);
    const [creditCustomer, setCreditCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadCustomers(); }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(customers);
        } else {
            const q = search.toLowerCase();
            setFiltered(customers.filter(c =>
                c.name?.toLowerCase().includes(q) ||
                c.mobile?.includes(q) ||
                c.address?.toLowerCase().includes(q)
            ));
        }
    }, [search, customers]);

    async function loadCustomers() {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data);
        } catch {
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(customer) {
        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer.id, customer);
                toast.success("Customer updated successfully!");
            } else {
                await addCustomer(customer);
                toast.success("Customer added successfully!");
            }
            setShowModal(false);
            setSelectedCustomer(null);
            loadCustomers();
        } catch {
            toast.error("Operation failed. Please try again.");
        }
    }

    async function handleDeleteClick(customer) {
        setLinkInfo(null);
        setDeleteConfirm(customer);
        try {
            const info = await checkCustomerLinks(customer.id);
            setLinkInfo(info);
        } catch {
            setLinkInfo({ sales: 0, credit_payments: 0, has_links: false });
        }
    }

    async function confirmDelete(force = false) {
        if (!deleteConfirm) return;
        try {
            if (force) {
                await forceDeleteCustomer(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" and all linked data removed`);
            } else {
                await deleteCustomer(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" removed`);
            }
            setDeleteConfirm(null);
            setLinkInfo(null);
            loadCustomers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Delete failed");
        }
    }

    // Called by CreditHistoryModal after a payment is recorded
    function handleBalanceUpdate(customerId, newBalance) {
        setCustomers(prev =>
            prev.map(c => c.id === customerId ? { ...c, credit_balance: newBalance } : c)
        );
        // Also sync the open modal's customer object
        if (creditCustomer?.id === customerId) {
            setCreditCustomer(prev => ({ ...prev, credit_balance: newBalance }));
        }
    }

    const totalCredit = customers.reduce((sum, c) => sum + Number(c.credit_balance || 0), 0);
    const creditCount = customers.filter(c => Number(c.credit_balance) > 0).length;

    return (
        <AdminLayout>
            <Navbar />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <FaUsers />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
                        <p className="text-sm text-slate-500">
                            {customers.length} registered
                            {creditCount > 0 && (
                                <> &nbsp;·&nbsp;
                                    <span className="text-red-500 font-semibold">
                                        {creditCount} on credit · ₹{totalCredit.toFixed(2)} outstanding
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    id="add-customer-btn"
                    onClick={() => { setSelectedCustomer(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-violet-600/30 transition-all"
                >
                    <FaPlus /> Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        id="customer-search"
                        type="text"
                        placeholder="Search by name, mobile, or address..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm">Loading customers...</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Balance</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16 text-slate-400">
                                        <FaUsers className="mx-auto text-4xl mb-3 opacity-30" />
                                        <p className="font-medium">No customers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((customer, idx) => {
                                    const credit = Number(customer.credit_balance || 0);
                                    const hasCredit = credit > 0;
                                    return (
                                        <tr key={customer.id} className="hover:bg-violet-50/30 transition-colors group">
                                            <td className="px-5 py-3.5 text-sm text-slate-400">{idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                                        hasCredit
                                                            ? "bg-gradient-to-br from-red-400 to-rose-500"
                                                            : "bg-gradient-to-br from-violet-500 to-purple-600"
                                                    }`}>
                                                        {customer.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{customer.name}</span>
                                                        {hasCredit && (
                                                            <span className="ml-2 text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                                                                Owes
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <FaPhone className="text-xs text-slate-400" />
                                                    {customer.mobile || "—"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 text-sm max-w-xs truncate">
                                                {customer.address || "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {hasCredit ? (
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-red-500">
                                                        <FaWallet className="text-xs" />
                                                        ₹{credit.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-500 text-sm font-medium">Clear ✓</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Credit History button — always visible for UX */}
                                                    <button
                                                        id={`credit-history-${customer.id}`}
                                                        onClick={() => setCreditCustomer(customer)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            hasCredit
                                                                ? "bg-red-50 text-red-500 hover:bg-red-100"
                                                                : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                                        }`}
                                                        title="Credit History"
                                                    >
                                                        <FaHistory />
                                                    </button>
                                                    <button
                                                        id={`edit-customer-${customer.id}`}
                                                        onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
                                                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        id={`delete-customer-${customer.id}`}
                                                        onClick={() => handleDeleteClick(customer)}
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

            {/* Customer Add/Edit Modal */}
            {showModal && (
                <CustomerModal
                    customer={selectedCustomer}
                    onClose={() => { setShowModal(false); setSelectedCustomer(null); }}
                    onSave={handleSave}
                />
            )}

            {/* Credit History Modal */}
            {creditCustomer && (
                <CreditHistoryModal
                    customer={creditCustomer}
                    onClose={() => setCreditCustomer(null)}
                    onBalanceUpdate={(newBalance) => handleBalanceUpdate(creditCustomer.id, newBalance)}
                />
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Remove Customer?</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Delete <strong>"{deleteConfirm.name}"</strong> permanently?
                        </p>

                        {/* Checking spinner */}
                        {linkInfo === null && (
                            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                Checking linked data...
                            </div>
                        )}

                        {/* Linked records warning */}
                        {linkInfo?.has_links && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-left">
                                <p className="text-red-700 text-xs font-semibold mb-2">⚠ This customer has linked records:</p>
                                <ul className="text-red-600 text-xs space-y-1">
                                    {linkInfo.sales > 0 && (
                                        <li>• {linkInfo.sales} sale{linkInfo.sales > 1 ? 's' : ''} (invoices + items)</li>
                                    )}
                                    {linkInfo.credit_payments > 0 && (
                                        <li>• {linkInfo.credit_payments} credit payment record{linkInfo.credit_payments > 1 ? 's' : ''}</li>
                                    )}
                                </ul>
                                <p className="text-red-500 text-xs mt-2 font-medium">
                                    Force delete will permanently remove all linked data.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteConfirm(null); setLinkInfo(null); }}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition"
                            >
                                Cancel
                            </button>
                            {linkInfo?.has_links ? (
                                <button
                                    onClick={() => confirmDelete(true)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition text-sm"
                                >
                                    Force Delete All
                                </button>
                            ) : (
                                <button
                                    onClick={() => confirmDelete(false)}
                                    disabled={linkInfo === null}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium transition"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}