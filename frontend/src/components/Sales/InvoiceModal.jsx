export default function InvoiceModal({
    invoice,
    total,
    customer,
    payment,
    onClose,
}) {
    if (!invoice) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-3">
                        ✓
                    </div>
                    <h2 className="text-2xl font-bold font-display text-white">
                        Sale Completed
                    </h2>
                </div>

                <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Invoice</span>
                        <span className="font-mono font-bold text-slate-200">{invoice}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Customer</span>
                        <span className="font-bold text-slate-200">{customer}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Payment</span>
                        <span className="font-bold text-slate-200">{payment}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-emerald-400 text-2xl font-display">
                            ₹{Number(total).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => window.print()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
                    >
                        🖨 Print
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}