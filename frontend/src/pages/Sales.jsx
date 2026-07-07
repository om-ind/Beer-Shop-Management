import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";

import {
    searchProducts,
    createSale,
} from "../services/salesService";

import {
    getCustomers,
} from "../services/customerService";

export default function Sales() {

    const [keyword, setKeyword] = useState("");

    const [products, setProducts] = useState([]);

    const [cart, setCart] = useState([]);

    const [customers, setCustomers] = useState([]);

    const [selectedCustomer, setSelectedCustomer] = useState(1);

    const [paymentMode, setPaymentMode] = useState("Cash");

    useEffect(() => {

        loadCustomers();

    }, []);

    async function loadCustomers() {

        try {

            const data = await getCustomers();

            setCustomers(data);

        } catch (err) {

            console.error(err);

        }

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

    function addToCart(product) {

        const existing = cart.find(

            item => item.id === product.id

        );

        if (existing) {

            setCart(

                cart.map(item =>

                    item.id === product.id

                        ? {

                            ...item,

                            quantity: item.quantity + 1

                        }

                        : item

                )

            );

        }

        else {

            setCart([

                ...cart,

                {

                    ...product,

                    quantity: 1

                }

            ]);

        }

        setKeyword("");

        setProducts([]);

    }

    function increaseQty(id) {

        setCart(

            cart.map(item =>

                item.id === id

                    ? {

                        ...item,

                        quantity: item.quantity + 1

                    }

                    : item

            )

        );

    }

    function decreaseQty(id) {

        setCart(

            cart.flatMap(item => {

                if (item.id !== id) return item;

                if (item.quantity === 1) return [];

                return {

                    ...item,

                    quantity: item.quantity - 1

                };

            })

        );

    }

    function removeItem(id) {

        setCart(

            cart.filter(item => item.id !== id)

        );

    }

    async function handleCheckout() {

        if (cart.length === 0) {

            alert("Cart is Empty");

            return;

        }

        const sale = {

            customer_id: selectedCustomer,

            payment_mode: paymentMode,

            items: cart.map(item => ({

                product_id: item.id,

                quantity: item.quantity,

                selling_price: Number(item.selling_price)

            }))

        };

        try {

            const result = await createSale(sale);

            alert(

                `Sale Completed\nInvoice : ${result.invoice_no}`

            );

            setCart([]);

            setKeyword("");

            setProducts([]);

        }

        catch (err) {

            console.error(err);

            alert("Sale Failed");

        }

    }

    const total = cart.reduce(

        (sum, item) =>

            sum +

            item.quantity *

            Number(item.selling_price),

        0

    );

    return (

        <AdminLayout>

            <Navbar />

            <div className="bg-white rounded-xl shadow p-6">

                <h2 className="text-3xl font-bold mb-6">

                    Sales POS

                </h2>

                {/* Search */}

                <input

                    type="text"

                    placeholder="Search Product or Scan Barcode"

                    value={keyword}

                    onChange={handleSearch}

                    className="w-full border rounded-lg p-3 mb-5"

                />

                {/* Search Results */}

                <div className="border rounded-lg mb-6">

                    {

                        products.length === 0

                            ?

                            <div className="p-4 text-gray-500">

                                No Products

                            </div>

                            :

                            products.map(product => (

                                <div

                                    key={product.id}

                                    onClick={() => addToCart(product)}

                                    className="flex justify-between items-center p-4 border-b hover:bg-blue-50 cursor-pointer"

                                >

                                    <div>

                                        <div className="font-semibold">

                                            {product.name}

                                        </div>

                                        <div className="text-gray-500 text-sm">

                                            {product.brand}

                                        </div>

                                    </div>

                                    <div>

                                        ₹{product.selling_price}

                                    </div>

                                </div>

                            ))

                    }

                </div>

                {/* Cart */}

                <h2 className="text-2xl font-bold mb-4">

                    Cart

                </h2>

                <table className="w-full border">

                    <thead className="bg-slate-100">

                        <tr>

                            <th className="p-3 text-left">

                                Product

                            </th>

                            <th>

                                Qty

                            </th>

                            <th>

                                Price

                            </th>

                            <th>

                                Total

                            </th>

                            <th>

                                Action

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            cart.length === 0

                                ?

                                <tr>

                                    <td

                                        colSpan="5"

                                        className="text-center py-8"

                                    >

                                        Cart Empty

                                    </td>

                                </tr>

                                :

                                cart.map(item => (

                                    <tr

                                        key={item.id}

                                        className="border-b"

                                    >

                                        <td className="p-3">

                                            {item.name}

                                        </td>

                                        <td>

                                            <div className="flex justify-center items-center gap-2">

                                                <button

                                                    onClick={() => decreaseQty(item.id)}

                                                    className="bg-red-500 text-white w-8 h-8 rounded"

                                                >

                                                    -

                                                </button>

                                                <span className="font-bold">

                                                    {item.quantity}

                                                </span>

                                                <button

                                                    onClick={() => increaseQty(item.id)}

                                                    className="bg-green-600 text-white w-8 h-8 rounded"

                                                >

                                                    +

                                                </button>

                                            </div>

                                        </td>

                                        <td>

                                            ₹{Number(item.selling_price).toFixed(2)}

                                        </td>

                                        <td>

                                            ₹{(

                                                item.quantity *

                                                Number(item.selling_price)

                                            ).toFixed(2)}

                                        </td>

                                        <td>

                                            <button

                                                onClick={() => removeItem(item.id)}

                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"

                                            >

                                                Delete

                                            </button>

                                        </td>

                                    </tr>

                                ))

                        }

                    </tbody>

                </table>

                {/* Checkout */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                    <div>

                        <label className="font-semibold block mb-2">

                            Customer

                        </label>

                        <select

                            value={selectedCustomer}

                            onChange={(e) =>

                                setSelectedCustomer(

                                    Number(e.target.value)

                                )

                            }

                            className="w-full border rounded-lg p-3"

                        >

                            {

                                customers.map(customer => (

                                    <option

                                        key={customer.id}

                                        value={customer.id}

                                    >

                                        {customer.name}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    <div>

                        <label className="font-semibold block mb-2">

                            Payment Mode

                        </label>

                        <select

                            value={paymentMode}

                            onChange={(e) =>

                                setPaymentMode(

                                    e.target.value

                                )

                            }

                            className="w-full border rounded-lg p-3"

                        >

                            <option>Cash</option>

                            <option>Card</option>

                            <option>UPI</option>

                        </select>

                    </div>

                </div>

                <div className="flex justify-end mt-8">

                    <div className="w-80">

                        <div className="bg-slate-100 rounded-lg p-5">

                            <div className="flex justify-between mb-2">

                                <span>

                                    Subtotal

                                </span>

                                <span>

                                    ₹{total.toFixed(2)}

                                </span>

                            </div>

                            <div className="flex justify-between mb-4">

                                <span>

                                    Grand Total

                                </span>

                                <span className="font-bold text-xl text-green-600">

                                    ₹{total.toFixed(2)}

                                </span>

                            </div>

                            <button

                                onClick={handleCheckout}

                                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg"

                            >

                                Complete Sale

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </AdminLayout>

    );

}