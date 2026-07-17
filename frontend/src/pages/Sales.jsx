import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import InvoiceModal from "../components/Sales/InvoiceModal";
import Receipt from "../components/Sales/Receipt";
import ProductSearch from "../components/Sales/ProductSearch";
import SearchResults from "../components/Sales/SearchResults";
import CartTable from "../components/Sales/CartTable";
import SalesHistory from "../components/Sales/SalesHistory";
import { toast } from "react-toastify";
import { FaShoppingCart, FaHistory, FaTrash } from "react-icons/fa";
import { searchProducts, createSale } from "../services/salesService";
import { getCustomers } from "../services/customerService";

const PAYMENT_MODES = ["Cash", "Card", "UPI", "Credit"];
const PAYMENT_COLORS = {
    Cash: "bg-green-50 border-green-200 text-green-700",
    Card: "bg-blue-50 border-blue-200 text-blue-700",
    UPI: "bg-violet-50 border-violet-200 text-violet-700",
    Credit: "bg-amber-50 border-amber-200 text-amber-700",
};

export default function Sales() {
    const today = () => new Date().toISOString().slice(0, 10);
    const [activeTab, setActiveTab] = useState("pos");
    const [keyword, setKeyword] = useState("");
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(1);
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
            <Navbar />

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
                <button
                    id="pos-tab"
                    onClick={() => setActiveTab("pos")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        activeTab === "pos"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <FaShoppingCart /> Point of Sale
                    {cart.length > 0 && (
                        <span className="bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {itemCount}
                        </span>
                    )}
                </button>
                <button
                    id="history-tab"
                    onClick={() => setActiveTab("history")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        activeTab === "history"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <FaHistory /> Sales History
                </button>
            </div>

            {activeTab === "pos" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left — Search + Cart */}
                    <div className="xl:col-span-2 space-y-4">

                        {/* Product Search */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Search Product</h2>
                            <ProductSearch keyword={keyword} onSearch={handleSearch} />
                            <SearchResults products={products} onSelect={addToCart} />
                        </div>

                        {/* Cart */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Cart ({itemCount} items)
                                </h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setCart([])}
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition"
                                    >
                                        <FaTrash /> Clear
                                    </button>
                                )}
                            </div>
                            <CartTable
                                cart={cart}
                                increaseQty={increaseQty}
                                decreaseQty={decreaseQty}
                                removeItem={removeItem}
                                updateQty={updateQty}
                                updatePrice={updatePrice}
                            />
                        </div>
                    </div>

                    {/* Right — Order Summary */}
                    <div className="space-y-4">
                        {/* Customer */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</h2>
                            <select
                                id="customer-select"
                                value={selectedCustomer}
                                onChange={e => setSelectedCustomer(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-slate-700"
                            >
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sale Date */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Sale Date</h2>
                            <input
                                id="sale-date-input"
                                type="date"
                                value={saleDate}
                                onChange={e => setSaleDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-slate-700 font-semibold"
                            />
                        </div>

                        {/* Payment Mode */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Mode</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_MODES.map(mode => (
                                    <button
                                        key={mode}
                                        id={`payment-${mode.toLowerCase()}`}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                            paymentMode === mode
                                                ? PAYMENT_COLORS[mode] + " shadow-sm"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Order Summary</h2>

                            {/* Credit warning */}
                            {paymentMode === "Credit" && (() => {
                                const cust = customers.find(c => c.id === selectedCustomer);
                                const bal = Number(cust?.credit_balance || 0);
                                return bal > 0 ? (
                                    <div className="mb-4 px-3 py-2.5 bg-red-500/20 border border-red-400/30 rounded-xl">
                                        <p className="text-red-300 text-xs font-semibold">⚠ Outstanding Credit</p>
                                        <p className="text-red-200 text-sm font-bold mt-0.5">₹{bal.toFixed(2)} already owed</p>
                                    </div>
                                ) : (
                                    <div className="mb-4 px-3 py-2.5 bg-emerald-500/10 border border-emerald-400/20 rounded-xl">
                                        <p className="text-emerald-300 text-xs font-semibold">✓ No outstanding balance</p>
                                    </div>
                                );
                            })()}

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal ({itemCount} items)</span>
                                    <span className="text-slate-200">₹{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Tax</span>
                                    <span className="text-slate-200">Included</span>
                                </div>
                                <div className="h-px bg-slate-700 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300 font-semibold">Grand Total</span>
                                    <span className="text-2xl font-bold text-emerald-400">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                id="checkout-btn"
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || processing}
                                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all
                                    bg-gradient-to-r from-emerald-500 to-teal-500
                                    hover:from-emerald-600 hover:to-teal-600
                                    disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed
                                    shadow-lg shadow-emerald-600/20"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    `✓ Complete Sale — ₹${total.toFixed(2)}`
                                )}
                            </button>
                        </div>
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

            <Receipt
                invoice={invoiceNo}
                customer={customers.find(c => c.id === selectedCustomer)?.name || "Walk-in Customer"}
                payment={paymentMode}
                items={receiptItems}
                total={receiptItems.reduce((s, i) => s + i.quantity * Number(i.selling_price), 0)}
            />
        </AdminLayout>
    );
}