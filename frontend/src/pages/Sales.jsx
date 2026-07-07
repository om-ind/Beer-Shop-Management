import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";
import InvoiceModal from "../components/Sales/InvoiceModal";
import Receipt from "../components/Sales/Receipt";
import ProductSearch from "../components/Sales/ProductSearch";
import SearchResults from "../components/Sales/SearchResults";
import CartTable from "../components/Sales/CartTable";

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

    const [invoiceNo, setInvoiceNo] = useState("");

    const [showInvoice, setShowInvoice] = useState(false);

    const [receiptItems, setReceiptItems] = useState([]);

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

            setInvoiceNo(result.invoice_no);

            setShowInvoice(true);

            setReceiptItems(cart);

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

                <ProductSearch
                    keyword={keyword}
                    onSearch={handleSearch}
                />

                {/* Search Results */}

                <SearchResults
                    products={products}
                    onSelect={addToCart}
                />

                {/* Cart */}

                <CartTable
                    cart={cart}
                    increaseQty={increaseQty}
                    decreaseQty={decreaseQty}
                    removeItem={removeItem}
                />

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

            {
                showInvoice && (

                    <InvoiceModal

                        invoice={invoiceNo}

                        total={total}

                        customer={
                            customers.find(
                                c => c.id === selectedCustomer
                            )?.name
                        }

                        payment={paymentMode}

                        onClose={() => setShowInvoice(false)}

                    />

                )
            }

            <Receipt
                invoice={invoiceNo}
                customer={
                    customers.find(
                        c => c.id === selectedCustomer
                    )?.name || "Walk-in Customer"
                }
                payment={paymentMode}
                items={receiptItems}
                total={total}
            />

        </AdminLayout>

    );

}