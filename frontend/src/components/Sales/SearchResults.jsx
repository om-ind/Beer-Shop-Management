import { Plus, Package } from "lucide-react";

export default function SearchResults({
    products,
    onSelect,
}) {
    if (!products || products.length === 0) {
        return (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 font-medium">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span>No products found matching your search.</span>
            </div>
        );
    }

    return (
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 border border-slate-100 dark:border-slate-900 rounded-xl p-1">
            {products.map(product => {
                const isOutOfStock = (product.stock ?? 0) <= 0;
                return (
                    <div
                        key={product.id}
                        onClick={() => !isOutOfStock && onSelect(product)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isOutOfStock
                                ? "bg-slate-50 border-slate-200 opacity-60 dark:bg-slate-900 dark:border-slate-800 cursor-not-allowed"
                                : "bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-sm dark:bg-slate-950 dark:border-slate-800 dark:hover:border-amber-500/50"
                        }`}
                    >
                        <div className="flex-1 pr-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                <span>{product.name}</span>
                                {(product.pack_size_ml || product.size) && (
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                        {product.pack_size_ml ? `${product.pack_size_ml} ml` : product.size}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {product.brand && <span className="font-medium">{product.brand}</span>}
                                {isOutOfStock ? (
                                    <span className="font-bold text-red-600 dark:text-red-400">Out of Stock (0)</span>
                                ) : (
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        In Stock ({product.stock})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                ₹{Number(product.selling_price || 0).toFixed(2)}
                            </span>
                            <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isOutOfStock) onSelect(product);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                                    isOutOfStock
                                        ? "bg-slate-200 text-slate-400"
                                        : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm active:scale-95"
                                }`}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}