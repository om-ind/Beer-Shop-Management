import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import CustomerModal from "../components/Customers/CustomerModal";
import CreditHistoryModal from "../components/Customers/CreditHistoryModal";
import { toast } from "react-toastify";
import { Users, Plus, Search, Edit3, Trash2, Wallet, Phone, History, Loader2, MessageSquare } from "lucide-react";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, checkCustomerLinks, forceDeleteCustomer } from "../services/customerService";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

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

    function handleBalanceUpdate(customerId, newBalance) {
        setCustomers(prev =>
            prev.map(c => c.id === customerId ? { ...c, credit_balance: newBalance } : c)
        );
        if (creditCustomer?.id === customerId) {
            setCreditCustomer(prev => ({ ...prev, credit_balance: newBalance }));
        }
    }

    const totalCredit = customers.reduce((sum, c) => sum + Number(c.credit_balance || 0), 0);
    const creditCount = customers.filter(c => Number(c.credit_balance) > 0).length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Customer Management
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{customers.length} Registered</span>
                                {creditCount > 0 && (
                                    <>
                                        <span>•</span>
                                        <Badge variant="destructive" className="px-2 py-0 text-xs">
                                            {creditCount} Credit Account{creditCount > 1 ? "s" : ""} (₹{totalCredit.toFixed(2)})
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        id="add-customer-btn"
                        variant="gradient"
                        onClick={() => { setSelectedCustomer(null); setShowModal(true); }}
                        className="text-slate-950 font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add Customer</span>
                    </Button>
                </div>

                {/* Search Toolbar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="customer-search"
                                type="text"
                                placeholder="Search by customer name, mobile, or address..."
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
                                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                <p className="text-sm font-medium">Fetching customers list...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Credit Balance</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                                <Users className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No customers found</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((customer, idx) => {
                                            const credit = Number(customer.credit_balance || 0);
                                            const hasCredit = credit > 0;
                                            return (
                                                <TableRow key={customer.id}>
                                                    <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${hasCredit ? "bg-red-500" : "bg-purple-600"}`}>
                                                                {customer.name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{customer.mobile || "—"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 max-w-xs truncate">
                                                        {customer.address || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {hasCredit ? (
                                                            <span className="text-red-500 flex items-center justify-end gap-1">
                                                                <Wallet className="h-3.5 w-3.5" />
                                                                ₹{credit.toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <Badge variant="success" className="text-[10px]">
                                                                Clear ✓
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {hasCredit && customer.mobile && (
                                                                <Button
                                                                    id={`whatsapp-reminder-${customer.id}`}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const cleanMobile = customer.mobile.replace(/\D/g, "");
                                                                        const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
                                                                        const msg = `Hello ${customer.name},\n\nThis is a friendly reminder regarding your outstanding credit balance at *B N BEER SHOP*.\n\n*Outstanding Balance: ₹${credit.toFixed(2)}*\n\nKindly arrange to clear your dues at your earliest convenience. Thank you!`;
                                                                        window.open(`https://api.whatsapp.com/send?phone=${formattedMobile}&text=${encodeURIComponent(msg)}`, "_blank");
                                                                    }}
                                                                    className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                                                    title="Send WhatsApp Reminder"
                                                                >
                                                                    <MessageSquare className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                id={`credit-history-${customer.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setCreditCustomer(customer)}
                                                                className="h-8 w-8 text-purple-600 hover:bg-purple-500/10"
                                                                title="Credit Ledger (Khatabook)"
                                                            >
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                id={`edit-customer-${customer.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
                                                                className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                                                                title="Edit"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                id={`delete-customer-${customer.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(customer)}
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
                    <CustomerModal
                        customer={selectedCustomer}
                        onClose={() => { setShowModal(false); setSelectedCustomer(null); }}
                        onSave={handleSave}
                    />
                )}

                {/* Credit Ledger Modal */}
                {creditCustomer && (
                    <CreditHistoryModal
                        customer={creditCustomer}
                        onClose={() => setCreditCustomer(null)}
                        onBalanceUpdate={(newBalance) => handleBalanceUpdate(creditCustomer.id, newBalance)}
                    />
                )}

                {/* Delete Dialog */}
                <Dialog
                    isOpen={!!deleteConfirm}
                    onClose={() => { setDeleteConfirm(null); setLinkInfo(null); }}
                    title="Remove Customer"
                    description={`Permanently delete "${deleteConfirm?.name}"?`}
                >
                    <div className="space-y-4 pt-2">
                        {linkInfo === null && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Verifying linked orders...</span>
                            </div>
                        )}

                        {linkInfo?.has_links && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                                <p className="font-bold">⚠ Customer has associated data:</p>
                                {linkInfo.sales > 0 && <p>• {linkInfo.sales} sales invoices</p>}
                                {linkInfo.credit_payments > 0 && <p>• {linkInfo.credit_payments} credit transactions</p>}
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
                                    Remove Customer
                                </Button>
                            )}
                        </div>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}