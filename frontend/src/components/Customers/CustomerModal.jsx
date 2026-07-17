import { useEffect, useState } from "react";

export default function CustomerModal({

    customer,

    onClose,

    onSave,

}) {

    const [form, setForm] = useState({

        name: "",

        mobile: "",

        address: "",

    });

    useEffect(() => {

        if (customer) {

            setForm({

                name: customer.name || "",

                mobile: customer.mobile || "",

                address: customer.address || "",

            });

        }

    }, [customer]);

    function handleChange(e) {

        setForm({

            ...form,

            [e.target.name]: e.target.value,

        });

    }

    function handleSubmit() {

        if (!form.name) {

            alert("Enter customer name");

            return;

        }

        onSave(form);

    }

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl p-6 w-[500px]">

                <h2 className="text-2xl font-bold mb-6">

                    {

                        customer

                            ? "Edit Customer"

                            : "Add Customer"

                    }

                </h2>

                <div className="space-y-4">

                    <input

                        type="text"

                        name="name"

                        placeholder="Customer Name"

                        value={form.name}

                        onChange={handleChange}

                        className="border rounded-lg w-full p-3"

                    />

                    <input

                        type="text"

                        name="mobile"

                        placeholder="Mobile Number"

                        value={form.mobile}

                        onChange={handleChange}

                        className="border rounded-lg w-full p-3"

                    />

                    <textarea

                        name="address"

                        placeholder="Address"

                        value={form.address}

                        onChange={handleChange}

                        rows="3"

                        className="border rounded-lg w-full p-3"

                    />

                </div>

                <div className="flex justify-end gap-3 mt-6">

                    <button

                        onClick={onClose}

                        className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"

                    >

                        Cancel

                    </button>

                    <button

                        onClick={handleSubmit}

                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"

                    >

                        {

                            customer

                                ? "Update Customer"

                                : "Save Customer"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}