import { useEffect, useState } from "react";

import AdminLayout from "../layouts/AdminLayout";
import Navbar from "../components/Navbar";

import SupplierModal from "../components/Suppliers/SupplierModal";

import {

    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,

} from "../services/supplierService";

export default function Suppliers() {

    const [suppliers, setSuppliers] = useState([]);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState(null);

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

    async function handleSave(form) {

        try {

            if (editingSupplier) {

                await updateSupplier(

                    editingSupplier.id,

                    form

                );

            }

            else {

                await addSupplier(form);

            }

            setShowModal(false);

            setEditingSupplier(null);

            loadSuppliers();

        }

        catch (err) {

            console.error(err);

        }

    }

    async function handleDelete(id) {

        if (

            !window.confirm(

                "Delete this supplier?"

            )

        ) {

            return;

        }

        try {

            await deleteSupplier(id);

            loadSuppliers();

        }

        catch (err) {

            alert(

                err.response?.data?.message ||

                "Unable to delete supplier."

            );

        }

    }

    const filteredSuppliers = suppliers.filter(

        supplier =>

            supplier.name

                .toLowerCase()

                .includes(

                    search.toLowerCase()

                ) ||

            supplier.company

                ?.toLowerCase()

                .includes(

                    search.toLowerCase()

                ) ||

            supplier.mobile

                ?.includes(search)

    );

    return (

        <AdminLayout>

            <Navbar />

            <div className="bg-white rounded-xl shadow p-6">

                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-2xl font-bold">

                        Suppliers

                    </h2>

                    <button

                        onClick={() => {

                            setEditingSupplier(null);

                            setShowModal(true);

                        }}

                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"

                    >

                        + Add Supplier

                    </button>

                </div>

                <input

                    type="text"

                    placeholder="Search supplier..."

                    value={search}

                    onChange={(e) =>

                        setSearch(

                            e.target.value

                        )

                    }

                    className="w-full border rounded-lg p-3 mb-6"

                />
                <div className="overflow-x-auto">

                    <table className="w-full border-collapse">

                        <thead>

                            <tr className="bg-gray-100">

                                <th className="p-3 text-left">Name</th>

                                <th className="p-3 text-left">Company</th>

                                <th className="p-3 text-left">Mobile</th>

                                <th className="p-3 text-left">Address</th>

                                <th className="p-3 text-center">Actions</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                filteredSuppliers.length === 0 ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="5"

                                                className="text-center py-8 text-gray-500"

                                            >

                                                No suppliers found

                                            </td>

                                        </tr>

                                    )

                                    :

                                    filteredSuppliers.map((supplier) => (

                                        <tr

                                            key={supplier.id}

                                            className="border-b hover:bg-gray-50"

                                        >

                                            <td className="p-3">

                                                {supplier.name}

                                            </td>

                                            <td className="p-3">

                                                {supplier.company}

                                            </td>

                                            <td className="p-3">

                                                {supplier.mobile}

                                            </td>

                                            <td className="p-3">

                                                {supplier.address}

                                            </td>

                                            <td className="p-3 text-center space-x-2">

                                                <button

                                                    onClick={() => {

                                                        setEditingSupplier(supplier);

                                                        setShowModal(true);

                                                    }}

                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"

                                                >

                                                    Edit

                                                </button>

                                                <button

                                                    onClick={() =>

                                                        handleDelete(supplier.id)

                                                    }

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

                </div>

            </div>
            <SupplierModal

                isOpen={showModal}

                onClose={() => {

                    setShowModal(false);

                    setEditingSupplier(null);

                }}

                onSave={handleSave}

                supplier={editingSupplier}

            />

        </AdminLayout>

    );

}