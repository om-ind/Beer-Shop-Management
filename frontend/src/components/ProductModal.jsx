import { useState } from "react";

export default function ProductModal({ onClose, onSave }) {
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl">

                <h2 className="text-2xl font-bold mb-4">
                    Add Product
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">

                    <input
                        name="barcode"
                        placeholder="Barcode"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        name="name"
                        placeholder="Product Name"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        name="brand"
                        placeholder="Brand"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        name="category"
                        placeholder="Category"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="number"
                        name="purchase_price"
                        placeholder="Purchase Price"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="number"
                        name="selling_price"
                        placeholder="Selling Price"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="number"
                        name="minimum_stock"
                        placeholder="Minimum Stock"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <input
                        type="date"
                        name="expiry_date"
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />

                    <div className="flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Save Product
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}