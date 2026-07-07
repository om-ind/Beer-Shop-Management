import { useEffect, useState } from "react";

import {
    getSuppliers,
} from "../../services/purchaseService";

export default function PurchaseModal({
    onClose,
    onSave,
}) {

    const [suppliers, setSuppliers] = useState([]);

    const [purchase, setPurchase] = useState({
        supplier_id: "",
        payment_mode: "Cash",
        remarks: "",
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    async function loadSuppliers() {

        try {

            const data = await getSuppliers();

            setSuppliers(data);

        } catch (err) {

            console.error(err);

        }

    }

    function handleChange(e) {

        setPurchase({
            ...purchase,
            [e.target.name]: e.target.value,
        });

    }

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">

            <div className="bg-white rounded-xl w-[500px] p-6">

                <h2 className="text-2xl font-bold mb-6">
                    New Purchase
                </h2>

                <select
                    name="supplier_id"
                    value={purchase.supplier_id}
                    onChange={handleChange}
                    className="border w-full rounded-lg p-3 mb-4"
                >

                    <option value="">
                        Select Supplier
                    </option>

                    {suppliers.map((supplier) => (

                        <option
                            key={supplier.id}
                            value={supplier.id}
                        >
                            {supplier.name}
                        </option>

                    ))}

                </select>

                <select
                    name="payment_mode"
                    value={purchase.payment_mode}
                    onChange={handleChange}
                    className="border w-full rounded-lg p-3 mb-4"
                >

                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Credit</option>

                </select>

                <textarea
                    name="remarks"
                    placeholder="Remarks"
                    value={purchase.remarks}
                    onChange={handleChange}
                    className="border w-full rounded-lg p-3"
                />

                <div className="flex justify-end gap-3 mt-6">

                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-5 py-2 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => onSave(purchase)}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                    >
                        Next
                    </button>

                </div>

            </div>

        </div>

    );

}