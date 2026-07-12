import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import ProductModal from "../components/ProductModal";
import { toast } from "react-toastify";
import { FaBox, FaPlus, FaSearch, FaEdit, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { getProducts, addProduct, updateProduct, deleteProduct, checkProductLinks, forceDeleteProduct } from "../services/productService";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [linkInfo, setLinkInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState("All");

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        let result = products;
        if (categoryFilter !== "All") {
            result = result.filter(p => p.category === categoryFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.barcode?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, products, categoryFilter]);

    async function loadProducts() {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(product) {
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, product);
                toast.success("Product updated successfully!");
            } else {
                await addProduct(product);
                toast.success("Product added successfully!");
            }
            setShowModal(false);
            setSelectedProduct(null);
            loadProducts();
        } catch (err) {
            const msg = err.response?.data?.error || "Operation failed. Please try again.";
            toast.error(msg);
        }
    }

    function handleEdit(product) {
        setSelectedProduct(product);
        setShowModal(true);
    }

    async function handleDeleteClick(product) {
        setLinkInfo(null);
        setDeleteConfirm(product);
        try {
            const info = await checkProductLinks(product.id);
            setLinkInfo(info);
        } catch {
            setLinkInfo({ sale_items: 0, purchase_items: 0, has_links: false });
        }
    }

    async function confirmDelete(force = false) {
        if (!deleteConfirm) return;
        try {
            if (force) {
                await forceDeleteProduct(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" deleted (sales history kept)`);
            } else {
                await deleteProduct(deleteConfirm.id);
                toast.success(`"${deleteConfirm.name}" deleted`);
            }
            setDeleteConfirm(null);
            setLinkInfo(null);
            loadProducts();
        } catch (err) {
            toast.error("Failed to delete product");
        }
    }

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    const lowStockCount = products.filter(p => p.stock <= p.minimum_stock).length;

    return (
        <AdminLayout>
            <Navbar />

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <FaBox />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
                        <p className="text-sm text-slate-500">
                            {products.length} total &nbsp;·&nbsp;
                            <span className={lowStockCount > 0 ? "text-red-500 font-semibold" : "text-green-600"}>
                                {lowStockCount > 0 ? `⚠ ${lowStockCount} low stock` : "✓ All in stock"}
                            </span>
                        </p>
                    </div>
                </div>
                <button
                    id="add-product-btn"
                    onClick={() => { setSelectedProduct(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all"
                >
                    <FaPlus /> Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="product-search"
                            type="text"
                            placeholder="Search by name, brand, or barcode..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    categoryFilter === cat
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm">Loading products...</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Barcode</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Buy Price</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Sell Price</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-16 text-slate-400">
                                        <FaBox className="mx-auto text-4xl mb-3 opacity-30" />
                                        <p className="font-medium">No products found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or add a new product</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(product => {
                                    const isLow = product.stock <= product.minimum_stock;
                                    return (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                    {product.barcode}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-slate-800">{product.name}</td>
                                            <td className="px-5 py-3.5 text-slate-600">{product.brand}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-slate-600">₹{Number(product.purchase_price).toFixed(2)}</td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{Number(product.selling_price).toFixed(2)}</td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`font-bold text-lg ${isLow ? "text-red-500" : "text-slate-700"}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-slate-400 text-xs block">/ {product.minimum_stock} min</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {isLow ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                                                        <FaExclamationTriangle className="text-xs" /> Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                                                        ✓ In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        id={`edit-product-${product.id}`}
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        id={`delete-product-${product.id}`}
                                                        onClick={() => handleDeleteClick(product)}
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

            {/* Product Modal */}
            {showModal && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => { setShowModal(false); setSelectedProduct(null); }}
                    onSave={handleSave}
                />
            )}

            {/* Delete Confirm Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Product?</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
                        </p>

                        {linkInfo === null && (
                            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                Checking linked data...
                            </div>
                        )}

                        {linkInfo?.has_links && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-left">
                                <p className="text-amber-700 text-xs font-semibold mb-2">⚠ This product is referenced in:</p>
                                <ul className="text-amber-700 text-xs space-y-1">
                                    {linkInfo.sale_items > 0 && (
                                        <li>• {linkInfo.sale_items} sale record{linkInfo.sale_items > 1 ? 's' : ''}</li>
                                    )}
                                    {linkInfo.purchase_items > 0 && (
                                        <li>• {linkInfo.purchase_items} purchase record{linkInfo.purchase_items > 1 ? 's' : ''}</li>
                                    )}
                                </ul>
                                <p className="text-amber-600 text-xs mt-2">
                                    Force delete keeps the history but removes the product.
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
                                    Force Delete
                                </button>
                            ) : (
                                <button
                                    onClick={() => confirmDelete(false)}
                                    disabled={linkInfo === null}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium transition shadow-lg shadow-red-600/30"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}