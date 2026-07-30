export default function SearchResults({
    products,
    onSelect,
}) {

    if (products.length === 0) {
        return (
            <div className="border rounded-lg mb-6">
                <div className="p-4 text-gray-500">
                    No Products
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg mb-6">

            {products.map(product => (

                <div
                    key={product.id}
                    onClick={() => onSelect(product)}
                    className="flex justify-between items-center p-4 border-b hover:bg-blue-50 cursor-pointer"
                >

                    <div>

                        <div className="font-semibold flex items-center gap-2">
                            <span>{product.name}</span>
                            {(product.pack_size_ml || product.size) && (
                                <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {product.pack_size_ml ? `${product.pack_size_ml} ml` : product.size}
                                </span>
                            )}
                        </div>

                        <div className="text-sm text-gray-500">
                            {product.brand}
                        </div>

                    </div>

                    <div className="font-bold">
                        ₹{product.selling_price}
                    </div>

                </div>

            ))}

        </div>
    );
}