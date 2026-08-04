export default function PurchaseItems({ items, setItems, allProducts = [] }) {

    function updateQty(index, value) {
        const updated = [...items];
        updated[index].quantity = Math.max(1, Number(value) || 1);
        setItems(updated);
    }

    function updatePrice(index, value) {
        const updated = [...items];
        updated[index].purchase_price = Number(value) || 0;
        setItems(updated);
    }

    function removeItem(index) {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    }

    function handleProductSelect(index, value) {
        const updated = [...items];
        const currentItem = updated[index];

        if (value === "NEW") {
            updated[index] = {
                ...currentItem,
                id: null,
                name: currentItem.extracted_name || currentItem.name,
                is_new: true,
            };
        } else {
            const targetId = Number(value);
            const candidates = currentItem.similar_products || [];
            const matched = candidates.find(c => c.id === targetId) || allProducts.find(p => p.id === targetId);

            if (matched) {
                updated[index] = {
                    ...currentItem,
                    id: matched.id,
                    name: matched.name,
                    brand: matched.brand || currentItem.brand,
                    category: matched.category || currentItem.category,
                    stock: matched.stock !== undefined ? matched.stock : currentItem.stock,
                    purchase_price: currentItem.purchase_price > 0 ? currentItem.purchase_price : (matched.purchase_price || 0),
                    is_new: false,
                };
            }
        }
        setItems(updated);
    }

    return (
        <table className="w-full border border-slate-200 rounded-xl overflow-hidden mt-4">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                <tr>
                    <th className="p-3 text-left">Product Selection (Match Existing / Create New)</th>
                    <th className="p-3 text-center">Qty (Units)</th>
                    <th className="p-3 text-right">Landed Purchase Price</th>
                    <th className="p-3 text-right">Line Total</th>
                    <th className="p-3 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
                {items.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                            No Products Added
                        </td>
                    </tr>
                ) : (
                    items.map((item, index) => {
                        const hasCandidates = item.similar_products && item.similar_products.length > 0;
                        return (
                            <tr key={item.id ? `prod-${item.id}-${index}` : `new-${index}`} className="hover:bg-orange-50/40 transition">
                                <td className="p-3 text-left">
                                    <div className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                                        <span>{item.name}</span>
                                        {item.volume && (
                                            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                                {item.volume}
                                            </span>
                                        )}
                                        {item.is_new ? (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                                ✨ New Product
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                                                ✓ Existing Stock ({item.stock ?? 0} in stock)
                                            </span>
                                        )}
                                    </div>

                                    {item.extracted_name && item.extracted_name !== item.name && (
                                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                                            Scanned on bill: <span className="font-medium text-slate-600">"{item.extracted_name}"</span>
                                        </div>
                                    )}

                                    {/* Candidate dropdown if similar products exist */}
                                    {hasCandidates && (
                                        <div className="mt-1.5">
                                            <select
                                                value={item.is_new ? "NEW" : (item.id || "NEW")}
                                                onChange={(e) => handleProductSelect(index, e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                            >
                                                {item.similar_products.map(sp => (
                                                    <option key={sp.id} value={sp.id}>
                                                        ✔ Match Existing: {sp.name} ({sp.stock} in stock)
                                                    </option>
                                                ))}
                                                <option value="NEW">
                                                    ➕ Create as New Product: "{item.extracted_name || item.name}"
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                </td>

                                <td className="p-3 text-center">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateQty(index, e.target.value)}
                                        className="border border-slate-300 rounded-lg w-20 p-1.5 text-center font-bold text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    />
                                    {item.carton_qty && (
                                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                            ({item.carton_qty} {item.unit_type || "cases"})
                                        </div>
                                    )}
                                </td>

                                <td className="p-3 text-right">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.purchase_price}
                                        onChange={(e) => updatePrice(index, e.target.value)}
                                        className="border border-slate-300 rounded-lg w-28 p-1.5 text-right font-bold text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    />
                                    {item.transport_per_unit > 0 && (
                                        <div className="text-[11px] text-orange-600 font-bold mt-0.5">
                                            +₹{item.transport_per_unit.toFixed(2)} transport/unit
                                        </div>
                                    )}
                                </td>

                                <td className="p-3 text-right font-bold text-slate-800">
                                    ₹{(item.quantity * item.purchase_price).toFixed(2)}
                                </td>

                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-semibold transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    );
}