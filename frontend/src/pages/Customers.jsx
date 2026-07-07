import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";

import CustomerTable from "../components/Customers/CustomerTable";
import CustomerModal from "../components/Customers/CustomerModal";

import {

    getCustomers,

    addCustomer,

    updateCustomer,

    deleteCustomer,

} from "../services/customerService";

export default function Customers() {

    const [customers, setCustomers] = useState([]);

    const [showModal, setShowModal] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {

        loadCustomers();

    }, []);

    async function loadCustomers() {

        try {

            const data = await getCustomers();

            setCustomers(data);

        }

        catch (err) {

            console.error(err);

        }

    }

    async function handleSave(customer) {

        try {

            if (selectedCustomer) {

                await updateCustomer(
                    selectedCustomer.id,
                    customer
                );

                alert("Customer Updated");

            }

            else {

                await addCustomer(customer);

                alert("Customer Added");

            }

            setShowModal(false);

            setSelectedCustomer(null);

            loadCustomers();

        }

        catch (err) {

            console.error(err);

        }

    }

    async function handleDelete(id) {

        if (!window.confirm("Delete customer?")) return;

        try {

            await deleteCustomer(id);

            alert("Customer Deleted");

            loadCustomers();

        }

        catch (err) {

            alert(

                err.response?.data?.message ||

                "Delete failed"

            );

        }

    }

    return (

        <AdminLayout>

            <Navbar />

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-3xl font-bold">

                    Customers

                </h2>

                <button

                    onClick={() => {

                        setSelectedCustomer(null);

                        setShowModal(true);

                    }}

                    className="bg-blue-600 text-white px-5 py-2 rounded-lg"

                >

                    + Add Customer

                </button>

            </div>

            <CustomerTable

                customers={customers}

                onEdit={(customer) => {

                    setSelectedCustomer(customer);

                    setShowModal(true);

                }}

                onDelete={handleDelete}

            />

            {

                showModal && (

                    <CustomerModal

                        customer={selectedCustomer}

                        onClose={() => {

                            setShowModal(false);

                            setSelectedCustomer(null);

                        }}

                        onSave={handleSave}

                    />

                )

            }

        </AdminLayout>

    );

}