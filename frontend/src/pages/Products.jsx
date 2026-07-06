import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";

import {
    getProducts,
    addProduct,
    deleteProduct,
} from "../services/productService";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSave(product) {
        try {
            await addProduct(product);

            setShowModal(false);

            loadProducts();

            alert("Product Added Successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to Add Product");
        }
    }

    async function handleDelete(id) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        try {
            await deleteProduct(id);

            alert("Product deleted successfully.");

            loadProducts();
        } catch (error) {
            console.error(error);
            alert("Failed to delete product.");
        }
    }

    return (
        <AdminLayout>

            <Navbar />

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-3xl font-bold">
                    Products
                </h2>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                >
                    + Add Product
                </button>

            </div>

            <ProductTable
                products={products}
                onEdit={() => { }}
                onDelete={handleDelete}
            />

            {showModal && (
                <ProductModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

        </AdminLayout>
    );
}