export default function CartTable({
    cart,
    increaseQty,
    decreaseQty,
    removeItem,
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

                            <td className="p-3">
                                {item.name}
                            </td>

                            <td>

                                <div className="flex justify-center items-center gap-2">

                                    <button
                                        onClick={() => decreaseQty(item.id)}
                                        className="bg-red-500 text-white w-8 h-8 rounded"
                                    >
                                        -
                                    </button>

                                    <span className="font-bold">
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => increaseQty(item.id)}
                                        className="bg-green-600 text-white w-8 h-8 rounded"
                                    >
                                        +
                                    </button>

                                </div>

                            </td>

                            <td>
                                ₹{Number(item.selling_price).toFixed(2)}
                            </td>

                            <td>
                                ₹{(
                                    item.quantity *
                                    Number(item.selling_price)
                                ).toFixed(2)}
                            </td>

                            <td>

                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
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