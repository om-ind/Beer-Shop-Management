import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import PurchaseTable from "../components/Purchases/PurchaseTable";
import PurchaseModal from "../components/Purchases/PurchaseModal";

import {
    getPurchases,
    createPurchase,
} from "../services/purchaseService";

export default function Purchases() {

    const [purchases, setPurchases] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadPurchases();
    }, []);

    async function loadPurchases() {

        try {

            const data = await getPurchases();

            setPurchases(data);

        } catch (err) {

            console.error(err);

        }

    }

    async function handleSave(purchase) {

        try {

            await createPurchase(purchase);

            alert("Purchase Created Successfully");

            setShowModal(false);

            loadPurchases();

        } catch (err) {

            console.error(err);

            alert("Failed to Create Purchase");

        }

    }

    return (

        <AdminLayout>

            <Navbar />

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-3xl font-bold">
                    Purchases
                </h2>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                    + New Purchase
                </button>

            </div>

            <PurchaseTable purchases={purchases} />

            {showModal && (

                <PurchaseModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />

            )}

        </AdminLayout>

    );

}