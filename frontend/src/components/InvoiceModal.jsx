export default function InvoiceModal({

    invoice,

    total,

    customer,

    payment,

    onClose,

}) {

    if (!invoice) return null;

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl w-[500px] p-8 shadow-2xl">

                <div className="text-center">

                    <div className="text-6xl mb-3">

                        ✅

                    </div>

                    <h2 className="text-3xl font-bold">

                        Sale Completed

                    </h2>

                </div>

                <div className="mt-8 space-y-4">

                    <div className="flex justify-between">

                        <span className="font-semibold">

                            Invoice

                        </span>

                        <span>

                            {invoice}

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <span className="font-semibold">

                            Customer

                        </span>

                        <span>

                            {customer}

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <span className="font-semibold">

                            Payment

                        </span>

                        <span>

                            {payment}

                        </span>

                    </div>

                    <div className="flex justify-between text-2xl font-bold">

                        <span>

                            Total

                        </span>

                        <span className="text-green-600">

                            ₹{total.toFixed(2)}

                        </span>

                    </div>

                </div>

                <div className="mt-8 flex justify-end gap-4">

                    <button

                        onClick={() => window.print()}

                        className="bg-green-600 text-white px-5 py-2 rounded-lg"

                    >

                        🖨 Print

                    </button>

                    <button

                        onClick={onClose}

                        className="bg-gray-500 text-white px-5 py-2 rounded-lg"

                    >

                        Close

                    </button>

                </div>

            </div>

        </div>

    );

}