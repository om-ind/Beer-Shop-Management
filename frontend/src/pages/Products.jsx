import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import ProductTable from "../components/ProductTable";

import { getProducts } from "../services/productService";

export default function Products() {

    const [products, setProducts] = useState([]);

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

    return (
        <AdminLayout>

            <Navbar />

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-3xl font-bold">
                    Products
                </h2>

                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                    + Add Product
                </button>

            </div>

            <ProductTable products={products} />

        </AdminLayout>
    );
}