import { useState } from "react";

export default function PurchaseItems({

    items,
    setItems,

}) {

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

        <table className="w-full border mt-5">

            <thead className="bg-slate-100">

                <tr>

                    <th className="p-3 text-left">
                        Product
                    </th>

                    <th>
                        Qty
                    </th>

                    <th>
                        Purchase Price
                    </th>

                    <th>
                        Total
                    </th>

                    <th>
                        Action
                    </th>

                </tr>

            </thead>

            <tbody>

                {

                    items.length === 0

                        ?

                        <tr>

                            <td
                                colSpan="5"
                                className="text-center py-8"
                            >

                                No Products Added

                            </td>

                        </tr>

                        :

                        items.map((item, index) => (

                            <tr key={item.id}>

                                <td className="p-3">

                                    {item.name}

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        min="1"

                                        value={item.quantity}

                                        onChange={(e) =>

                                            updateQty(index, e.target.value)

                                        }

                                        className="border rounded w-20 p-1"

                                    />

                                </td>

                                <td>

                                    <input

                                        type="number"

                                        value={item.purchase_price}

                                        onChange={(e) =>

                                            updatePrice(index, e.target.value)

                                        }

                                        className="border rounded w-28 p-1"

                                    />

                                </td>

                                <td>

                                    ₹{

                                        (

                                            item.quantity *

                                            item.purchase_price

                                        ).toFixed(2)

                                    }

                                </td>

                                <td>

                                    <button

                                        onClick={() =>

                                            removeItem(index)

                                        }

                                        className="bg-red-600 text-white px-3 py-1 rounded"

                                    >

                                        Delete

                                    </button>

                                </td>

                            </tr>

                        ))

                }

            </tbody>

        </table>

    );

}