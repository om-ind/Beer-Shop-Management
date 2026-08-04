import { useEffect, useState } from "react";
import { FaKeyboard, FaCamera, FaCheckCircle, FaStar, FaTruck } from "react-icons/fa";
import PurchaseItems from "./PurchaseItems";
import BillUploader from "./BillUploader";

import {
    getSuppliers,
} from "../../services/purchaseService";

import {
    searchProducts,
} from "../../services/salesService";

export default function PurchaseModal({ onClose, onSave }) {

    const [suppliers, setSuppliers] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [purchase, setPurchase] = useState({
        supplier_id: "",
        payment_mode: "Cash",
        remarks: "",
        invoice_no: "",
        purchase_date: new Date().toISOString().split("T")[0],
        mvat_amount: "",
        tcs_amount: "",
        bill_total_amount: "",
    });

    // Transport charges per carton (default ₹25 per carton)
    const [transportPerCarton, setTransportPerCarton] = useState(25);

    // Tab state: "manual" or "scan"
    const [activeTab, setActiveTab] = useState("manual");
    const [scanError, setScanError] = useState("");
    const [scanSuccess, setScanSuccess] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    async function loadSuppliers() {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err) {
            console.error(err);
        }
    }

    function handleChange(e) {
        setPurchase({
            ...purchase,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSearch(e) {
        const value = e.target.value;
        setKeyword(value);
        if (value.length < 2) {
            setProducts([]);
            return;
        }
        try {
            const data = await searchProducts(value);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    }

    function addProduct(product) {
        const exists = items.find(item => item.id === product.id);
        if (exists) {
            alert("Product already added.");
            return;
        }
        const basePrice = Number(product.purchase_price) || 0;
        setItems([
            ...items,
            {
                ...product,
                base_price: basePrice,
                quantity: 1,
                purchase_price: basePrice,
            },
        ]);
        setKeyword("");
        setProducts([]);
    }

    // Helper: calculate carton multiplier for an item based on volume/name
    function getItemMultiplier(item) {
        const name = (item.name || "").toLowerCase();
        if (name.includes("650") || name.includes("750")) return 12;
        if (name.includes("180")) return 48;
        return 24; // 500ml, 330ml, default
    }

    // Recalculate landed purchase price whenever transportPerCarton changes
    function getEffectiveItems() {
        const rate = Number(transportPerCarton || 0);
        return items.map(item => {
            const mult = getItemMultiplier(item);
            const transportPerUnit = rate / mult;
            const base = item.base_price !== undefined ? item.base_price : item.purchase_price;
            const landedPrice = roundToTwo(base + transportPerUnit);
            return {
                ...item,
                base_price: base,
                transport_per_unit: roundToTwo(transportPerUnit),
                purchase_price: landedPrice,
            };
        });
    }

    function roundToTwo(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    const effectiveItems = getEffectiveItems();

    // Calculate total cartons across all items
    const totalCartons = effectiveItems.reduce((sum, item) => {
        const mult = getItemMultiplier(item);
        return sum + (item.quantity / mult);
    }, 0);

    const totalTransportCost = totalCartons * Number(transportPerCarton || 0);
    const grandTotal = effectiveItems.reduce((sum, item) => sum + item.quantity * item.purchase_price, 0);

    function handleSavePurchase() {
        if (!purchase.supplier_id) {
            alert("Please select a supplier.");
            return;
        }
        if (effectiveItems.length === 0) {
            alert("Please add at least one product.");
            return;
        }
        onSave({
            ...purchase,
            items: effectiveItems,
            transport_per_carton: Number(transportPerCarton || 0),
            total_cartons: totalCartons,
            transport_total: totalTransportCost,
        });
    }

    // Handle extracted data from bill scanner
    function handleExtracted(extracted) {
        setScanError("");
        setScanSuccess(true);

        let matchedSupplierId = purchase.supplier_id;
        if (extracted.supplier_name) {
            const match = suppliers.find(s =>
                s.name.toLowerCase().includes(extracted.supplier_name.toLowerCase()) ||
                extracted.supplier_name.toLowerCase().includes(s.name.toLowerCase())
            );
            if (match) {
                matchedSupplierId = match.id;
            }
        }

        setPurchase(prev => ({
            ...prev,
            supplier_id: matchedSupplierId,
            invoice_no: extracted.bill_number || prev.invoice_no,
            purchase_date: extracted.bill_date || prev.purchase_date,
            mvat_amount: extracted.mvat_amount !== undefined ? extracted.mvat_amount : prev.mvat_amount,
            tcs_amount: extracted.tcs_amount !== undefined ? extracted.tcs_amount : prev.tcs_amount,
            bill_total_amount: extracted.total_amount !== undefined ? extracted.total_amount : prev.bill_total_amount,
        }));

        if (extracted.items && extracted.items.length > 0) {
            setItems(extracted.items.map(item => ({
                id: item.id || null,
                name: item.name,
                extracted_name: item.extracted_name || item.name,
                brand: item.brand || "",
                category: item.category || "Beer",
                quantity: item.quantity || 1,
                base_price: item.purchase_price || 0,
                purchase_price: item.purchase_price || 0,
                selling_price: item.selling_price || 0,
                stock: item.stock || 0,
                is_new: item.is_new !== undefined ? item.is_new : !item.id,
                similar_products: item.similar_products || [],
            })));
        }

        setActiveTab("manual");
    }

    function handleScanError(msg) {
        setScanError(msg);
        setScanSuccess(false);
    }

    const newProductCount = items.filter(i => i.is_new).length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-[940px] max-h-[90vh] overflow-auto p-0 shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 px-6 pt-5 pb-4">
                    <h2 className="text-2xl font-bold font-display text-white mb-4">New Purchase</h2>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setActiveTab("manual")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === "manual"
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaKeyboard /> Manual Entry
                        </button>
                        <button
                            onClick={() => setActiveTab("scan")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === "scan"
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaCamera /> Scan Bill
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5">

                    {/* Scan Tab */}
                    {activeTab === "scan" && (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <p className="text-blue-300 text-sm">
                                    <strong className="text-blue-200">How it works:</strong> Upload a photo or PDF of your supplier bill.
                                    AI will extract MVAT, TCS, Invoice No, Date, supplier total amount, and line items.
                                    You can match existing inventory or create new products before saving.
                                </p>
                            </div>

                            <BillUploader
                                onExtracted={handleExtracted}
                                onError={handleScanError}
                            />

                            {scanError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                                    <strong>Error:</strong> {scanError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Tab */}
                    {activeTab === "manual" && (
                        <div className="space-y-4">

                            {/* Scan success banner */}
                            {scanSuccess && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                                    <FaCheckCircle className="text-emerald-400 text-lg flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-emerald-300 font-semibold text-sm">
                                            Bill data extracted successfully!
                                        </p>
                                        <p className="text-emerald-400/80 text-xs mt-1">
                                            {items.length} products found
                                            {newProductCount > 0 && (
                                                <span className="ml-1">
                                                    · <strong>{newProductCount} new</strong> product option(s) selected
                                                </span>
                                            )}
                                            . Match existing stock or create new products below.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Supplier & Bill Header Details Section */}
                            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-200 text-sm">Supplier & Bill Information</h3>
                                    {purchase.bill_total_amount > 0 && (
                                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                                            Scanned Total: ₹{Number(purchase.bill_total_amount).toLocaleString("en-IN")}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Supplier</label>
                                        <select
                                            name="supplier_id"
                                            value={purchase.supplier_id}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Mode</label>
                                        <select
                                            name="payment_mode"
                                            value={purchase.payment_mode}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        >
                                            <option>Cash</option>
                                            <option>Card</option>
                                            <option>UPI</option>
                                            <option>Credit</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice No</label>
                                        <input
                                            type="text"
                                            name="invoice_no"
                                            placeholder="e.g. INV-10045"
                                            value={purchase.invoice_no}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Date</label>
                                        <input
                                            type="date"
                                            name="purchase_date"
                                            value={purchase.purchase_date}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Taxes breakdown */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">MVAT Amount (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="mvat_amount"
                                            placeholder="0.00"
                                            value={purchase.mvat_amount}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">TCS Amount (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="tcs_amount"
                                            placeholder="0.00"
                                            value={purchase.tcs_amount}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Scanned Total Bill (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="bill_total_amount"
                                            placeholder="0.00"
                                            value={purchase.bill_total_amount}
                                            onChange={handleChange}
                                            className="w-full border border-slate-800 rounded-xl p-2 bg-slate-900 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <textarea
                                name="remarks"
                                placeholder="Remarks"
                                value={purchase.remarks}
                                onChange={handleChange}
                                className="border border-slate-800 rounded-xl w-full p-3 bg-slate-950 text-slate-100 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                            />

                            {/* Transport Charge Section */}
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-orange-300 font-bold text-sm">
                                        <FaTruck className="text-orange-400 text-lg" />
                                        <span>Transport Charge per Carton</span>
                                    </div>
                                    <span className="text-xs text-orange-300 bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full font-bold">
                                        {totalCartons.toFixed(1)} Total Cartons
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                                            Rate per Carton (₹)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="e.g. 25"
                                                value={transportPerCarton}
                                                onChange={(e) => setTransportPerCarton(e.target.value)}
                                                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-bold text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                                            Added to 500ml Can
                                        </label>
                                        <div className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl font-semibold text-slate-300 text-xs">
                                            +₹{((Number(transportPerCarton || 0)) / 24).toFixed(2)} / bottle (÷ 24)
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                                            Added to 650ml Bottle
                                        </label>
                                        <div className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl font-semibold text-slate-300 text-xs">
                                            +₹{((Number(transportPerCarton || 0)) / 12).toFixed(2)} / bottle (÷ 12)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product search */}
                            <input
                                type="text"
                                placeholder="Search Product to add..."
                                value={keyword}
                                onChange={handleSearch}
                                className="border border-slate-800 rounded-xl w-full p-3 bg-slate-950 text-slate-100 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                            />

                            {products.length > 0 && (
                                <div className="border border-slate-800 rounded-xl max-h-56 overflow-auto bg-slate-950">
                                    {products.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addProduct(product)}
                                            className="p-3 border-b border-slate-800 hover:bg-orange-500/10 cursor-pointer transition"
                                        >
                                            <div className="font-semibold text-slate-200">{product.name}</div>
                                            <div className="text-sm text-slate-400">{product.brand}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Items table with landed purchase prices */}
                            <div className="relative">
                                <PurchaseItems
                                    items={effectiveItems}
                                    allProducts={products}
                                    setItems={(updated) => {
                                        setItems(updated.map(item => ({
                                            ...item,
                                            base_price: item.purchase_price - (item.transport_per_unit || 0)
                                        })));
                                    }}
                                />

                                {/* New product badges */}
                                {newProductCount > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                                        <FaStar className="text-amber-400" />
                                        <span>
                                            {newProductCount} new product{newProductCount > 1 ? "s" : ""} will be added to your inventory
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                <div>
                                    <div className="text-xs text-slate-400">
                                        Includes ₹{totalTransportCost.toFixed(2)} transport ({totalCartons.toFixed(1)} cartons @ ₹{transportPerCarton}/carton) automatically added to unit prices
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">
                                        Total Amount ₹{grandTotal.toFixed(2)}
                                    </h2>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold border border-slate-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePurchase}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all"
                                    >
                                        Save Purchase
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}