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

                        <div className="font-semibold">
                            {product.name}
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