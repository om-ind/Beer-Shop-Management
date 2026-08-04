import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import InvoiceModal from "../components/Sales/InvoiceModal";
import Receipt from "../components/Sales/Receipt";
import ProductSearch from "../components/Sales/ProductSearch";
import SearchResults from "../components/Sales/SearchResults";
import CartTable from "../components/Sales/CartTable";
import SalesHistory from "../components/Sales/SalesHistory";
import CustomerModal from "../components/Customers/CustomerModal";
import { toast } from "react-toastify";
import { ShoppingCart, History, Trash2, CheckCircle2, AlertTriangle, CreditCard, Wallet, QrCode, User, UserPlus } from "lucide-react";
import { searchProducts, createSale } from "../services/salesService";
import { getCustomers, addCustomer } from "../services/customerService";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

const PAYMENT_MODES = [
    { mode: "Cash", icon: Wallet, style: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400" },
    { mode: "Card", icon: CreditCard, style: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400" },
    { mode: "UPI", icon: QrCode, style: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-400" },
    { mode: "Credit", icon: User, style: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400" },
];

export default function Sales() {
    const today = () => new Date().toISOString().slice(0, 10);
    const [activeTab, setActiveTab] = useState("pos");
    const [keyword, setKeyword] = useState("");
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(1);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [saleDate, setSaleDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [showInvoice, setShowInvoice] = useState(false);
    const [receiptItems, setReceiptItems] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            const data = await getCustomers();
            setCustomers(data);
            if (data && data.length > 0) {
                setSelectedCustomer(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSearch(e) {
        const value = e.target.value;
        setKeyword(value);
        if (value.length < 2) { setProducts([]); return; }
        try {
            const data = await searchProducts(value);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    }

    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setKeyword("");
        setProducts([]);
    }

    function increaseQty(id) {
        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        ));
    }

    function decreaseQty(id) {
        setCart(cart.flatMap(item => {
            if (item.id !== id) return item;
            if (item.quantity === 1) return [];
            return { ...item, quantity: item.quantity - 1 };
        }));
    }

    function updateQty(id, newQty) {
        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, newQty) } : item
        ));
    }

    function updatePrice(id, newPrice) {
        setCart(cart.map(item =>
            item.id === id ? { ...item, selling_price: newPrice } : item
        ));
    }

    function removeItem(id) {
        setCart(cart.filter(item => item.id !== id));
    }

    async function handleCheckout() {
        if (cart.length === 0) { toast.warning("Cart is empty!"); return; }

        if (cart.some(item => item.quantity <= 0)) {
            toast.warning("Some items have zero or invalid quantity!");
            return;
        }

        if (cart.some(item => Number(item.selling_price) < 0 || isNaN(Number(item.selling_price)))) {
            toast.warning("Selling price cannot be negative or invalid!");
            return;
        }

        const sale = {
            customer_id: selectedCustomer,
            payment_mode: paymentMode,
            sale_date: saleDate,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                selling_price: Number(item.selling_price),
            })),
        };

        try {
            setProcessing(true);
            const result = await createSale(sale);
            setInvoiceNo(result.invoice_no);
            setShowInvoice(true);
            setReceiptItems([...cart]);
            setCart([]);
            setKeyword("");
            setProducts([]);
            toast.success(`Sale complete! Invoice: ${result.invoice_no}`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Sale failed");
        } finally {
            setProcessing(false);
        }
    }

    const total = cart.reduce((sum, item) => sum + item.quantity * Number(item.selling_price), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                            Point of Sale (POS)
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Process quick retail sales and view transaction history
                        </p>
                    </div>

                    <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-2xl w-fit">
                        <Button
                            id="pos-tab"
                            variant={activeTab === "pos" ? "default" : "ghost"}
                            onClick={() => setActiveTab("pos")}
                            className="rounded-xl"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            <span>POS Terminal</span>
                            {cart.length > 0 && (
                                <Badge variant="warning" className="ml-2 px-1.5 py-0 text-[10px] rounded-full">
                                    {itemCount}
                                </Badge>
                            )}
                        </Button>
                        <Button
                            id="history-tab"
                            variant={activeTab === "history" ? "default" : "ghost"}
                            onClick={() => setActiveTab("history")}
                            className="rounded-xl"
                        >
                            <History className="h-4 w-4 mr-2" />
                            <span>Sales History</span>
                        </Button>
                    </div>
                </div>

                {activeTab === "pos" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left — Search & Cart */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Product Search */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Search Catalog</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <ProductSearch keyword={keyword} onSearch={handleSearch} />
                                    <SearchResults products={products} onSelect={addToCart} />
                                </CardContent>
                            </Card>

                            {/* Cart Table */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                                        Current Cart ({itemCount} items)
                                    </CardTitle>
                                    {cart.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCart([])}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            <span>Clear Cart</span>
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <CartTable
                                        cart={cart}
                                        increaseQty={increaseQty}
                                        decreaseQty={decreaseQty}
                                        removeItem={removeItem}
                                        updateQty={updateQty}
                                        updatePrice={updatePrice}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right — Checkout Panel */}
                        <div className="space-y-6">
                            {/* Customer Select */}
                            <Card>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Customer Details</CardTitle>
                                    <Button
                                        id="add-customer-pos-btn"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAddCustomerModal(true)}
                                        className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 font-semibold px-2 rounded-lg"
                                    >
                                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                                        <span>Add Customer</span>
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <select
                                        id="customer-select"
                                        value={selectedCustomer}
                                        onChange={e => setSelectedCustomer(Number(e.target.value))}
                                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.mobile ? `(${c.mobile})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </CardContent>
                            </Card>

                            {/* Sale Date */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Sale Date</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        id="sale-date-input"
                                        type="date"
                                        value={saleDate}
                                        onChange={e => setSaleDate(e.target.value)}
                                        className="font-semibold"
                                    />
                                </CardContent>
                            </Card>

                            {/* Payment Mode */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Payment Mode</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAYMENT_MODES.map(({ mode, icon: Icon, style }) => (
                                            <button
                                                key={mode}
                                                id={`payment-${mode.toLowerCase()}`}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                    paymentMode === mode
                                                        ? `${style} shadow-sm font-bold`
                                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{mode}</span>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Total & Checkout Action */}
                            <Card className="border-slate-800 bg-slate-950 text-white shadow-2xl">
                                <CardHeader>
                                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {paymentMode === "Credit" && (() => {
                                        const cust = customers.find(c => c.id === selectedCustomer);
                                        const bal = Number(cust?.credit_balance || 0);
                                        return bal > 0 ? (
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
                                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                <div>
                                                    <span className="font-semibold">Outstanding Credit: </span>
                                                    <span>₹{bal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                                <span>No previous credit balance</span>
                                            </div>
                                        );
                                    })()}

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Items ({itemCount})</span>
                                            <span className="text-slate-200">₹{total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Taxes</span>
                                            <span className="text-slate-200">Included</span>
                                        </div>
                                        <div className="h-px bg-slate-800 my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-200">Grand Total</span>
                                            <span className="text-2xl font-bold font-display text-emerald-400">
                                                ₹{total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        id="checkout-btn"
                                        variant="gradient"
                                        disabled={cart.length === 0 || processing}
                                        onClick={handleCheckout}
                                        className="w-full h-12 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20"
                                    >
                                        {processing ? (
                                            "Processing Transaction..."
                                        ) : (
                                            `Complete Sale — ₹${total.toFixed(2)}`
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === "history" && <SalesHistory />}

                {/* Invoice Modal */}
                {showInvoice && (
                    <InvoiceModal
                        invoice={invoiceNo}
                        total={receiptItems.reduce((s, i) => s + i.quantity * Number(i.selling_price), 0)}
                        customer={customers.find(c => c.id === selectedCustomer)?.name}
                        payment={paymentMode}
                        onClose={() => setShowInvoice(false)}
                    />
                )}

                {/* Add Customer Quick Modal */}
                {showAddCustomerModal && (
                    <CustomerModal
                        onClose={() => setShowAddCustomerModal(false)}
                        onSave={async (formData) => {
                            try {
                                const created = await addCustomer(formData);
                                toast.success(`Customer "${formData.name}" created!`);
                                const updatedList = await getCustomers();
                                setCustomers(updatedList);
                                if (created?.id) {
                                    setSelectedCustomer(created.id);
                                } else if (updatedList && updatedList.length > 0) {
                                    const match = updatedList.find(c => c.name.toLowerCase() === formData.name.trim().toLowerCase());
                                    if (match) setSelectedCustomer(match.id);
                                }
                                setShowAddCustomerModal(false);
                            } catch (err) {
                                toast.error(err.response?.data?.error || "Failed to add customer");
                            }
                        }}
                    />
                )}

                <Receipt
                    invoice={invoiceNo}
                    customer={customers.find(c => c.id === selectedCustomer)?.name || "Walk-in Customer"}
                    payment={paymentMode}
                    items={receiptItems}
                    total={receiptItems.reduce((s, i) => s + i.quantity * Number(i.selling_price), 0)}
                />
            </div>
        </AdminLayout>
    );
}