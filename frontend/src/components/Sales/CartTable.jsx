import { Trash2 } from "lucide-react";

export default function CartTable({
    cart,
    increaseQty,
    decreaseQty,
    removeItem,
    updateQty,
    updatePrice,
}) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-extrabold text-slate-700 dark:text-slate-200 tracking-wider">
                    <tr>
                        <th className="p-3.5 text-left">Product</th>
                        <th className="p-3.5 text-center">Size / ML</th>
                        <th className="p-3.5 text-center">Qty</th>
                        <th className="p-3.5 text-center">Price (₹)</th>
                        <th className="p-3.5 text-right">Line Total</th>
                        <th className="p-3.5 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950">
                    {cart.length === 0 ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center py-10 text-slate-400 font-semibold dark:text-slate-500"
                            >
                                Cart Empty
                            </td>
                        </tr>
                    ) : (
                        cart.map(item => (
                            <tr
                                key={item.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                            >
                                <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                                    {item.name}
                                </td>

                                <td className="p-3.5 text-center">
                                    <span className="inline-block text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                                        {item.pack_size_ml ? `${item.pack_size_ml} ml` : (item.size || "—")}
                                    </span>
                                </td>

                                <td className="p-3.5">
                                    <div className="flex justify-center items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => decreaseQty(item.id)}
                                            className="bg-red-500 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                                        >
                                            -
                                        </button>

                                        <input
                                            type="number"
                                            min="0"
                                            value={item.quantity === 0 ? "" : item.quantity}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                                updateQty(item.id, isNaN(val) ? 0 : val);
                                            }}
                                            className="w-14 text-center border-2 border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1 font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-sm"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => increaseQty(item.id)}
                                            className="bg-emerald-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>

                                <td className="p-3.5">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-slate-400 dark:text-slate-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.selling_price}
                                            onChange={(e) => updatePrice(item.id, e.target.value)}
                                            className="w-24 text-center border-2 border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1 font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-sm"
                                        />
                                    </div>
                                </td>

                                <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                                    ₹{(
                                        item.quantity *
                                        Number(item.selling_price || 0)
                                    ).toFixed(2)}
                                </td>

                                <td className="p-3.5 text-center">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/30 p-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}