import { Search, X } from "lucide-react";

export default function ProductSearch({
    keyword,
    onSearch,
}) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
            <input
                id="pos-product-search-input"
                type="text"
                value={keyword}
                onChange={onSearch}
                placeholder="Search product by name, brand, or barcode..."
                className="w-full pl-11 pr-10 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {keyword && (
                <button
                    type="button"
                    onClick={() => onSearch({ target: { value: "" } })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-full"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}