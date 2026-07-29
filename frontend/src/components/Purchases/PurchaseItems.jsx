export default function PurchaseItems({ items, setItems }) {

    function updateQty(index, value) {
        const updated = [...items];
        updated[index].quantity = Number(value);
        setItems(updated);
    }

    function updatePrice(index, value) {
        const updated = [...items];
        updated[index].purchase_price = Number(value);
        setItems(updated);
    }

    function removeItem(index) {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    }

    return (
        <table className="w-full border border-slate-200 rounded-xl overflow-hidden mt-4">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                <tr>
                    <th className="p-3 text-left">Product</th>
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
                    items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-orange-50/40 transition">
                            <td className="p-3 font-semibold text-slate-800">
                                <div>{item.name}</div>
                                {item.brand && <div className="text-xs text-slate-400 font-normal">{item.brand}</div>}
                            </td>

                            <td className="p-3 text-center">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateQty(index, e.target.value)}
                                    className="border border-slate-200 rounded-lg w-20 p-1.5 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                            </td>

                            <td className="p-3 text-right">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.purchase_price}
                                    onChange={(e) => updatePrice(index, e.target.value)}
                                    className="border border-slate-200 rounded-lg w-28 p-1.5 text-right font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                                {item.transport_per_unit > 0 && (
                                    <div className="text-[11px] text-orange-600 font-medium mt-0.5">
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
                    ))
                )}
            </tbody>
        </table>
    );
}