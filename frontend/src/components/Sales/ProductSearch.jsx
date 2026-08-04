import { Search, X } from "lucide-react";

export default function ProductSearch({
    keyword,
    onSearch,
}) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
                id="pos-product-search-input"
                type="text"
                value={keyword}
                onChange={onSearch}
                placeholder="🔍 Search product by name, brand, or barcode..."
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {keyword && (
                <button
                    type="button"
                    onClick={() => onSearch({ target: { value: "" } })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}