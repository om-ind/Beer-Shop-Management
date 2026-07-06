export default function ProductTable({
    products,
    onEdit,
    onDelete,
}) {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-3 text-left">Barcode</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Brand</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">Selling Price</th>
                        <th className="p-3 text-left">Stock</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {products.length > 0 ? (
                        products.map((product) => (
                            <tr
                                key={product.id}
                                className="border-b hover:bg-gray-50 transition"
                            >
                                <td className="p-3">{product.barcode}</td>
                                <td>{product.name}</td>
                                <td>{product.brand}</td>
                                <td>{product.category}</td>
                                <td>₹{product.selling_price}</td>
                                <td>{product.stock}</td>

                                <td>
                                    {product.stock <= product.minimum_stock ? (
                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                                            Low Stock
                                        </span>
                                    ) : (
                                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                                            In Stock
                                        </span>
                                    )}
                                </td>

                                <td className="text-center space-x-2">
                                    <button
                                        onClick={() => onEdit(product)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => onDelete(product.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="8"
                                className="text-center py-6 text-gray-500"
                            >
                                No products found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}