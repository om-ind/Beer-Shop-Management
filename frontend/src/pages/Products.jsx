import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import ProductModal from "../components/ProductModal";
import { toast } from "react-toastify";
import { Package, Plus, Search, Edit3, Trash2, AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, addProduct, updateProduct, deleteProduct, checkProductLinks, forceDeleteProduct } from "../services/productService";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Dialog } from "../components/ui/dialog";

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
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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
        setCurrentPage(1);
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

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Inventory Products
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{products.length} Items Listed</span>
                                <span>•</span>
                                {lowStockCount > 0 ? (
                                    <Badge variant="destructive" className="px-2 py-0 text-xs">
                                        ⚠ {lowStockCount} Low Stock
                                    </Badge>
                                ) : (
                                    <Badge variant="success" className="px-2 py-0 text-xs">
                                        ✓ All Stock Healthy
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        id="add-product-btn"
                        variant="gradient"
                        onClick={() => { setSelectedProduct(null); setShowModal(true); }}
                        className="text-slate-950 font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add Product</span>
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <Card>
                    <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="product-search"
                                type="text"
                                placeholder="Search by product name, brand, or barcode..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    size="sm"
                                    variant={categoryFilter === cat ? "default" : "outline"}
                                    onClick={() => setCategoryFilter(cat)}
                                    className="rounded-xl text-xs"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Product Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-sm font-medium">Fetching product inventory...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Buy Price</TableHead>
                                        <TableHead className="text-right">Sell Price</TableHead>
                                        <TableHead className="text-center">Stock</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-16 text-slate-400">
                                                <Package className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                                <p className="font-semibold">No products found</p>
                                                <p className="text-xs text-slate-500">Try refining your search filter</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedProducts.map(product => {
                                            const isLow = product.stock <= product.minimum_stock;
                                            return (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-mono text-xs text-slate-500">
                                                        {product.barcode}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell>{product.brand}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-[11px]">
                                                            {product.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        ₹{Number(product.purchase_price).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                                        ₹{Number(product.selling_price).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`font-bold ${isLow ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>
                                                            {product.stock}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">/ {product.minimum_stock} min</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isLow ? (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Low Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="success" className="gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> In Stock
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                id={`edit-product-${product.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(product)}
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                id={`delete-product-${product.id}`}
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(product)}
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
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

                        {/* Pagination Footer */}
                        {!loading && filtered.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> to{" "}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
                                    </span>{" "}
                                    of <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> products
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="h-8 px-2 rounded-lg text-xs"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1 mx-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                            .map((page, index, array) => {
                                                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                                return (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                                                        <Button
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold ${
                                                                currentPage === page ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" : ""
                                                            }`}
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className="h-8 px-2 rounded-lg text-xs"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Form Modal */}
                {showModal && (
                    <ProductModal
                        product={selectedProduct}
                        onClose={() => { setShowModal(false); setSelectedProduct(null); }}
                        onSave={handleSave}
                    />
                )}

                {/* Delete Confirm Modal */}
                <Dialog
                    isOpen={!!deleteConfirm}
                    onClose={() => { setDeleteConfirm(null); setLinkInfo(null); }}
                    title="Delete Product"
                    description={`Are you sure you want to remove "${deleteConfirm?.name}"?`}
                >
                    <div className="space-y-4 pt-2">
                        {linkInfo === null && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Evaluating product associations...</span>
                            </div>
                        )}

                        {linkInfo?.has_links && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                                <p className="font-bold">⚠ Referenced in past records:</p>
                                {linkInfo.sale_items > 0 && <p>• {linkInfo.sale_items} sale records</p>}
                                {linkInfo.purchase_items > 0 && <p>• {linkInfo.purchase_items} purchase records</p>}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={() => { setDeleteConfirm(null); setLinkInfo(null); }}
                            >
                                Cancel
                            </Button>
                            {linkInfo?.has_links ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => confirmDelete(true)}
                                >
                                    Force Delete
                                </Button>
                            ) : (
                                <Button
                                    variant="destructive"
                                    disabled={linkInfo === null}
                                    onClick={() => confirmDelete(false)}
                                >
                                    Confirm Delete
                                </Button>
                            )}
                        </div>
                    </div>
                </Dialog>
            </div>
        </AdminLayout>
    );
}