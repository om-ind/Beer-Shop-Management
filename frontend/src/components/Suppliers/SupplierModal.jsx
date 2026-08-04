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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
                <h2 className="text-xl font-bold font-display text-white border-b border-slate-800 pb-3">
                    {supplier ? "Edit Supplier" : "Add Supplier"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Supplier Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Company
                        </label>
                        <input
                            type="text"
                            name="company"
                            value={form.company}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Mobile
                        </label>
                        <input
                            type="text"
                            name="mobile"
                            value={form.mobile}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Address
                        </label>
                        <textarea
                            name="address"
                            rows="3"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition shadow-lg"
                        >
                            {supplier ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}