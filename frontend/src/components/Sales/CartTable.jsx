export default function CartTable({
    cart,
    increaseQty,
    decreaseQty,
    removeItem,
    updateQty,
    updatePrice,
}) {

    return (

        <table className="w-full border">

            <thead className="bg-slate-100">

                <tr>

                    <th className="p-3 text-left">
                        Product
                    </th>

                    <th>Qty</th>

                    <th>Price</th>

                    <th>Total</th>

                    <th>Action</th>

                </tr>

            </thead>

            <tbody>

                {cart.length === 0 ? (

                    <tr>

                        <td
                            colSpan="5"
                            className="text-center py-8"
                        >
                            Cart Empty
                        </td>

                    </tr>

                ) : (

                    cart.map(item => (

                        <tr
                            key={item.id}
                            className="border-b"
                        >

                            <td className="p-3 font-medium text-slate-700">
                                {item.name}
                            </td>

                            <td>

                                <div className="flex justify-center items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() => decreaseQty(item.id)}
                                        className="bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
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
                                        className="w-16 text-center border border-slate-200 rounded-lg py-1 px-1 font-bold text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => increaseQty(item.id)}
                                        className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold hover:bg-green-700 transition-colors"
                                    >
                                        +
                                    </button>

                                </div>

                            </td>

                            <td>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-semibold">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.selling_price}
                                        onChange={(e) => updatePrice(item.id, e.target.value)}
                                        className="w-24 text-center border border-slate-200 rounded-lg py-1 px-2 font-semibold text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                    />
                                </div>
                            </td>

                            <td className="text-center font-semibold text-slate-700">
                                ₹{(
                                    item.quantity *
                                    Number(item.selling_price || 0)
                                ).toFixed(2)}
                            </td>

                            <td className="text-center">

                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
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