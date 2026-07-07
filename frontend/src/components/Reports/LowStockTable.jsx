export default function LowStockTable({ products }) {

    return (

        <div className="bg-white rounded-xl shadow p-6 mt-8">

            <h2 className="text-xl font-bold mb-5">

                Low Stock Products

            </h2>

            <table className="w-full">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="p-3 text-left">

                            Barcode

                        </th>

                        <th className="p-3 text-left">

                            Product

                        </th>

                        <th className="p-3 text-left">

                            Category

                        </th>

                        <th className="p-3 text-center">

                            Stock

                        </th>

                        <th className="p-3 text-center">

                            Minimum

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        products.length === 0

                            ?

                            <tr>

                                <td
                                    colSpan="5"
                                    className="text-center py-6 text-gray-500"
                                >

                                    No Low Stock Products

                                </td>

                            </tr>

                            :

                            products.map(product => (

                                <tr
                                    key={product.barcode}
                                    className="border-t"
                                >

                                    <td className="p-3">

                                        {product.barcode}

                                    </td>

                                    <td className="p-3">

                                        {product.name}

                                    </td>

                                    <td className="p-3">

                                        {product.category}

                                    </td>

                                    <td className="text-center text-red-600 font-bold">

                                        {product.stock}

                                    </td>

                                    <td className="text-center">

                                        {product.minimum_stock}

                                    </td>

                                </tr>

                            ))

                    }

                </tbody>

            </table>

        </div>

    );

}