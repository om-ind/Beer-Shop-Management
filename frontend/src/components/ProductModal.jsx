import { useEffect, useState } from "react";

export default function ProductModal({
    product,
    onClose,
    onSave,
}) {
    const [form, setForm] = useState({
        barcode: "",
        name: "",
        brand: "",
        category: "Beer",
        purchase_price: "",
        selling_price: "",
        stock: "",
        minimum_stock: "",
        expiry_date: "",
    });

    useEffect(() => {
        if (product) {
            setForm({
                barcode: product.barcode || "",
                name: product.name || "",
                brand: product.brand || "",
                category: product.category || "",
                purchase_price: product.purchase_price || "",
                selling_price: product.selling_price || "",
                stock: product.stock || "",
                minimum_stock: product.minimum_stock || "",
                expiry_date: product.expiry_date
                    ? product.expiry_date.substring(0, 10)
                    : "",
            });
        } else {
            setForm({
                barcode: "",
                name: "",
                brand: "",
                category: "Beer",
                purchase_price: "",
                selling_price: "",
                stock: "",
                minimum_stock: "",
                expiry_date: "",
            });
        }
    }, [product]);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSave(form);
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-[550px] p-6">

                <h2 className="text-2xl font-bold mb-5">
                    {product ? "Edit Product" : "Add Product"}
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-2 gap-4"
                >

                    <input
                        type="text"
                        name="barcode"
                        placeholder="Barcode"
                        value={form.barcode}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="text"
                        name="name"
                        placeholder="Product Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="text"
                        name="brand"
                        placeholder="Brand"
                        value={form.brand}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={form.category}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="number"
                        name="purchase_price"
                        placeholder="Purchase Price"
                        value={form.purchase_price}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="number"
                        name="selling_price"
                        placeholder="Selling Price"
                        value={form.selling_price}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        value={form.stock}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="number"
                        name="minimum_stock"
                        placeholder="Minimum Stock"
                        value={form.minimum_stock}
                        onChange={handleChange}
                        className="border rounded p-2"
                        required
                    />

                    <input
                        type="date"
                        name="expiry_date"
                        value={form.expiry_date}
                        onChange={handleChange}
                        className="border rounded p-2 col-span-2"
                    />

                    <div className="col-span-2 flex justify-end gap-3 mt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-400 text-white px-5 py-2 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                        >
                            {product ? "Update Product" : "Save Product"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}