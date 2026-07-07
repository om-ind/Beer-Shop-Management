export default function PurchaseTable({ purchases }) {

    return (

        <div className="bg-white rounded-xl shadow overflow-hidden">

            <table className="w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="p-4 text-left">Invoice</th>
                        <th className="text-left">Supplier</th>
                        <th className="text-left">Date</th>
                        <th className="text-left">Payment</th>
                        <th className="text-right">Total</th>

                    </tr>

                </thead>

                <tbody>

                    {purchases.length === 0 ? (

                        <tr>

                            <td
                                colSpan="5"
                                className="text-center py-10 text-gray-500"
                            >
                                No Purchases Found
                            </td>

                        </tr>

                    ) : (

                        purchases.map((purchase) => (

                            <tr
                                key={purchase.id}
                                className="border-b hover:bg-gray-50"
                            >

                                <td className="p-4">
                                    {purchase.invoice_number}
                                </td>

                                <td>
                                    {purchase.supplier}
                                </td>

                                <td>
                                    {purchase.purchase_date}
                                </td>

                                <td>
                                    {purchase.payment_mode}
                                </td>

                                <td className="text-right pr-6 font-semibold">
                                    ₹{Number(purchase.total_amount).toFixed(2)}
                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>

    );

}