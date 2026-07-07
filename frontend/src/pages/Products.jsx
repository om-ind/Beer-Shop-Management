import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";

import {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../services/productService";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

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
            if (selectedProduct) {
                // Update existing product
                await updateProduct(selectedProduct.id, product);
                alert("Product Updated Successfully");
            } else {
                // Add new product
                await addProduct(product);
                alert("Product Added Successfully");
            }

            setShowModal(false);
            setSelectedProduct(null);

            loadProducts();
        } catch (err) {
            console.error(err);
            alert("Operation Failed");
        }
    }

    function handleEdit(product) {
        setSelectedProduct(product);
        setShowModal(true);
    }

    async function handleDelete(id) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        try {
            await deleteProduct(id);

            alert("Product Deleted Successfully");

            loadProducts();
        } catch (err) {
            console.error(err);
            alert("Failed to delete product");
        }
    }

    function handleAddProduct() {
        setSelectedProduct(null);
        setShowModal(true);
    }

    return (
        <AdminLayout>
            <Navbar />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Products</h2>

                <button
                    onClick={handleAddProduct}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                    + Add Product
                </button>
            </div>

            <ProductTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedProduct(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </AdminLayout>
    );
}