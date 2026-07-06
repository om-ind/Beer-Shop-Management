export default function ProductTable({ products }) {
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
                    </tr>
                </thead>

                <tbody>
                    {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{product.barcode}</td>
                            <td>{product.name}</td>
                            <td>{product.brand}</td>
                            <td>{product.category}</td>
                            <td>₹{product.selling_price}</td>
                            <td>{product.stock}</td>

                            <td>
                                {product.stock <= product.minimum_stock ? (
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                                        Low Stock
                                    </span>
                                ) : (
                                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded">
                                        In Stock
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}