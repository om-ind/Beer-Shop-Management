export default function TopProductsTable({ products }) {

    return (

        <div className="bg-white rounded-xl shadow p-6 mt-8">

            <h2 className="text-xl font-bold mb-5">

                Top Selling Products

            </h2>

            <table className="w-full">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="p-3 text-left">

                            Product

                        </th>

                        <th className="p-3 text-center">

                            Qty Sold

                        </th>

                        <th className="p-3 text-center">

                            Revenue

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        products.length === 0

                            ?

                            <tr>

                                <td

                                    colSpan="3"

                                    className="text-center py-6 text-gray-500"

                                >

                                    No sales available

                                </td>

                            </tr>

                            :

                            products.map((item, index) => (

                                <tr
                                    key={index}
                                    className="border-t"
                                >

                                    <td className="p-3">

                                        {item.name}

                                    </td>

                                    <td className="text-center">

                                        {item.qty_sold}

                                    </td>

                                    <td className="text-center">

                                        ₹{Number(item.revenue).toFixed(2)}

                                    </td>

                                </tr>

                            ))

                    }

                </tbody>

            </table>

        </div>

    );

}