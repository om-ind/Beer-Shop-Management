export default function Receipt({
    invoice,
    customer,
    payment,
    items,
    total,
}) {

    const today = new Date();

    return (
        <div
            id="receipt"
            className="hidden print:block p-6 text-black bg-white"
        >

            <div className="text-center">

                <h1 className="text-3xl font-bold">
                    🍺 Beer Shop ERP
                </h1>

                <p>Industrial Management System</p>

                <hr className="my-4" />

            </div>

            <div className="flex justify-between mb-4">

                <div>

                    <p>
                        <strong>Invoice:</strong> {invoice}
                    </p>

                    <p>
                        <strong>Date:</strong>{" "}
                        {today.toLocaleDateString()}
                    </p>

                </div>

                <div>

                    <p>
                        <strong>Customer:</strong> {customer}
                    </p>

                    <p>
                        <strong>Payment:</strong> {payment}
                    </p>

                </div>

            </div>

            <table className="w-full border">

                <thead>

                    <tr className="bg-gray-200">

                        <th className="border p-2 text-left">
                            Product
                        </th>

                        <th className="border p-2">
                            Qty
                        </th>

                        <th className="border p-2">
                            Price
                        </th>

                        <th className="border p-2">
                            Total
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {items.map(item => (

                        <tr key={item.id}>

                            <td className="border p-2">

                                {item.name}

                            </td>

                            <td className="border text-center">

                                {item.quantity}

                            </td>

                            <td className="border text-center">

                                ₹{Number(item.selling_price).toFixed(2)}

                            </td>

                            <td className="border text-center">

                                ₹{(
                                    item.quantity *
                                    Number(item.selling_price)
                                ).toFixed(2)}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            <div className="flex justify-end mt-6">

                <div className="text-right">

                    <h2 className="text-xl">

                        Grand Total

                    </h2>

                    <h1 className="text-3xl font-bold">

                        ₹{total.toFixed(2)}

                    </h1>

                </div>

            </div>

            <div className="text-center mt-10">

                <hr className="mb-4" />

                <p>

                    Thank You!

                </p>

                <p>

                    Visit Again 🍻

                </p>

            </div>

        </div>
    );
}