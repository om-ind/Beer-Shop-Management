import { useEffect, useState } from "react";

export default function SupplierModal({

    isOpen,
    onClose,
    onSave,
    supplier,

}) {

    const [form, setForm] = useState({

        name: "",
        company: "",
        mobile: "",
        address: "",

    });

    useEffect(() => {

        if (supplier) {

            setForm({

                name: supplier.name || "",
                company: supplier.company || "",
                mobile: supplier.mobile || "",
                address: supplier.address || "",

            });

        }

        else {

            setForm({

                name: "",
                company: "",
                mobile: "",
                address: "",

            });

        }

    }, [supplier]);

    function handleChange(e) {

        setForm({

            ...form,
            [e.target.name]: e.target.value,

        });

    }

    function handleSubmit(e) {

        e.preventDefault();

        if (!form.name.trim()) {

            alert("Supplier name is required.");

            return;

        }

        onSave(form);

    }

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

                <h2 className="text-2xl font-bold mb-6">

                    {supplier ? "Edit Supplier" : "Add Supplier"}

                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <div>

                        <label className="block mb-1 font-medium">

                            Supplier Name

                        </label>

                        <input

                            type="text"

                            name="name"

                            value={form.name}

                            onChange={handleChange}

                            className="w-full border rounded-lg p-3"

                            required

                        />

                    </div>

                    <div>

                        <label className="block mb-1 font-medium">

                            Company

                        </label>

                        <input

                            type="text"

                            name="company"

                            value={form.company}

                            onChange={handleChange}

                            className="w-full border rounded-lg p-3"

                        />

                    </div>

                    <div>

                        <label className="block mb-1 font-medium">

                            Mobile

                        </label>

                        <input

                            type="text"

                            name="mobile"

                            value={form.mobile}

                            onChange={handleChange}

                            className="w-full border rounded-lg p-3"

                        />

                    </div>

                    <div>

                        <label className="block mb-1 font-medium">

                            Address

                        </label>

                        <textarea

                            name="address"

                            rows="3"

                            value={form.address}

                            onChange={handleChange}

                            className="w-full border rounded-lg p-3"

                        />

                    </div>

                    <div className="flex justify-end gap-3 pt-4">

                        <button

                            type="button"

                            onClick={onClose}

                            className="px-5 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"

                        >

                            Cancel

                        </button>

                        <button

                            type="submit"

                            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"

                        >

                            {supplier ? "Update" : "Save"}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}