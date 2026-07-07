import { useEffect, useState } from "react";

import PurchaseItems from "./PurchaseItems";

import {
    getSuppliers,
} from "../../services/purchaseService";

import {
    searchProducts,
} from "../../services/salesService";

export default function PurchaseModal({

    onClose,

    onSave,

}) {

    const [suppliers, setSuppliers] = useState([]);

    const [keyword, setKeyword] = useState("");

    const [products, setProducts] = useState([]);

    const [items, setItems] = useState([]);

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

        }

        catch (err) {

            console.error(err);

        }

    }

    function handleChange(e) {

        setPurchase({

            ...purchase,

            [e.target.name]: e.target.value,

        });

    }

    async function handleSearch(e) {

        const value = e.target.value;

        setKeyword(value);

        if (value.length < 2) {

            setProducts([]);

            return;

        }

        try {

            const data = await searchProducts(value);

            setProducts(data);

        }

        catch (err) {

            console.error(err);

        }

    }

    function addProduct(product) {

        const exists = items.find(

            item => item.id === product.id

        );

        if (exists) {

            alert("Product already added.");

            return;

        }

        setItems([

            ...items,

            {

                ...product,

                quantity: 1,

                purchase_price: Number(product.purchase_price),

            },

        ]);

        setKeyword("");

        setProducts([]);

    }

    function handleSavePurchase() {

        if (!purchase.supplier_id) {

            alert("Please select a supplier.");

            return;

        }

        if (items.length === 0) {

            alert("Please add at least one product.");

            return;

        }

        onSave({

            ...purchase,

            items,

        });

    }

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl w-[900px] max-h-[90vh] overflow-auto p-6">

                <h2 className="text-2xl font-bold mb-6">

                    New Purchase

                </h2>

                <div className="grid grid-cols-2 gap-4">

                    <select

                        name="supplier_id"

                        value={purchase.supplier_id}

                        onChange={handleChange}

                        className="border rounded-lg p-3"

                    >

                        <option value="">

                            Select Supplier

                        </option>

                        {

                            suppliers.map((supplier) => (

                                <option

                                    key={supplier.id}

                                    value={supplier.id}

                                >

                                    {supplier.name}

                                </option>

                            ))

                        }

                    </select>

                    <select

                        name="payment_mode"

                        value={purchase.payment_mode}

                        onChange={handleChange}

                        className="border rounded-lg p-3"

                    >

                        <option>Cash</option>

                        <option>Card</option>

                        <option>UPI</option>

                        <option>Credit</option>

                    </select>

                </div>

                <textarea

                    name="remarks"

                    placeholder="Remarks"

                    value={purchase.remarks}

                    onChange={handleChange}

                    className="border rounded-lg w-full p-3 mt-4"

                />

                <input

                    type="text"

                    placeholder="Search Product"

                    value={keyword}

                    onChange={handleSearch}

                    className="border rounded-lg w-full p-3 mt-4"

                />

                {

                    products.length > 0 && (

                        <div className="border rounded-lg max-h-56 overflow-auto">

                            {

                                products.map(product => (

                                    <div

                                        key={product.id}

                                        onClick={() => addProduct(product)}

                                        className="p-3 border-b hover:bg-blue-50 cursor-pointer"

                                    >

                                        <div className="font-semibold">

                                            {product.name}

                                        </div>

                                        <div className="text-sm text-gray-500">

                                            {product.brand}

                                        </div>

                                    </div>

                                ))

                            }

                        </div>

                    )

                }

                <PurchaseItems

                    items={items}

                    setItems={setItems}

                />

                <div className="flex justify-between items-center mt-6">

                    <h2 className="text-2xl font-bold">

                        Total ₹{

                            items

                                .reduce(

                                    (sum, item) =>

                                        sum +

                                        item.quantity *

                                        item.purchase_price,

                                    0

                                )

                                .toFixed(2)

                        }

                    </h2>

                    <div className="flex gap-3">

                        <button

                            onClick={onClose}

                            className="bg-gray-500 text-white px-5 py-2 rounded-lg"

                        >

                            Cancel

                        </button>

                        <button

                            onClick={handleSavePurchase}

                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"

                        >

                            Save Purchase

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}