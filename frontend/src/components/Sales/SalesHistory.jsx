import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaHistory, FaEye, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaReceipt, FaDownload, FaCalendarAlt } from "react-icons/fa";
import { getSales, getSaleDetail, downloadInvoice, updateSale } from "../../services/salesService";

function SaleDetailModal({ saleId, onClose }) {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getSaleDetail(saleId);
                setSale(data);
            } catch {
                toast.error("Failed to load sale details");
                onClose();
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [saleId]);

    async function handleDownload() {
        if (!sale) return;
        setDownloading(true);
        try {
            await downloadInvoice(sale.id, sale.invoice_no);
            toast.success("Invoice downloaded!");
        } catch {
            toast.error("PDF download failed — is reportlab installed?");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                            <FaReceipt />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Sale Details</h2>
                            {sale && <p className="text-xs text-slate-400 font-mono">{sale.invoice_no}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                        <FaTimes />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                ) : sale ? (
                    <>
                        {/* Sale Meta */}
                        <div className="p-5 border-b border-slate-100 grid grid-cols-2 gap-3 bg-slate-50">
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Customer</p>
                                <p className="font-semibold text-slate-700">{sale.customer_name || "Walk-in"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Payment Mode</p>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    sale.payment_mode === "Cash" ? "bg-green-100 text-green-700"
                                    : sale.payment_mode === "UPI" ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                    {sale.payment_mode}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Date & Time</p>
                                <p className="text-sm text-slate-600">{sale.sale_date ? new Date(sale.sale_date).toLocaleString("en-IN") : "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Mobile</p>
                                <p className="text-sm text-slate-600">{sale.customer_mobile || "—"}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Items</h3>
                            <div className="space-y-2">
                                {(sale.items || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">{item.product_name}</p>
                                            <p className="text-xs text-slate-400">{item.brand} · ₹{item.price} × {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-slate-800">₹{item.subtotal.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total + Download */}
                        <div className="p-5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-500 font-medium">Grand Total</span>
                                <span className="text-2xl font-bold text-slate-800">₹{sale.total_amount?.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-60"
                            >
                                <FaFilePdf />
                                {downloading ? "Generating PDF..." : "Download Invoice PDF"}
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function SalesHistory() {
    const [salesData, setSalesData] = useState({ sales: [], total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [viewingSale, setViewingSale] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [editingSaleId, setEditingSaleId] = useState(null);
    const [editingDate, setEditingDate] = useState("");

    async function handleSaveDate(saleId) {
        if (!editingDate) return;
        try {
            await updateSale(saleId, { sale_date: editingDate });
            toast.success("Sale date updated!");
            setEditingSaleId(null);
            loadSales();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update date");
        }
    }

    useEffect(() => {
        loadSales();
    }, [page]);

    async function loadSales() {
        try {
            setLoading(true);
            const data = await getSales(page, 15);
            setSalesData(data);
        } catch {
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    }

    async function handleRowDownload(sale) {
        setDownloadingId(sale.id);
        try {
            await downloadInvoice(sale.id, sale.invoice_no);
        } catch {
            toast.error("PDF download failed — is reportlab installed?");
        } finally {
            setDownloadingId(null);
        }
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white shadow">
                        <FaHistory />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Sales History</h2>
                        <p className="text-xs text-slate-500">{salesData.total} transactions total</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                    </div>
                ) : salesData.sales.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <FaHistory className="mx-auto text-4xl mb-3 opacity-30" />
                        <p className="font-medium">No sales yet</p>
                        <p className="text-sm mt-1">Complete a sale above to see it here</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {salesData.sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                                                {sale.invoice_no}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-slate-700">{sale.customer_name || "Walk-in"}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                                {sale.item_count}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                                            ₹{Number(sale.total_amount).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                sale.payment_mode === "Cash" ? "bg-green-50 text-green-600"
                                                : sale.payment_mode === "UPI" ? "bg-blue-50 text-blue-600"
                                                : "bg-slate-100 text-slate-600"
                                            }`}>
                                                {sale.payment_mode}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-500">
                                            {editingSaleId === sale.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="date"
                                                        value={editingDate}
                                                        onChange={e => setEditingDate(e.target.value)}
                                                        className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveDate(sale.id)}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded px-2 py-1 text-xs font-semibold transition"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingSaleId(null)}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded px-2 py-1 text-xs transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group/date">
                                                    <span>
                                                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingSaleId(sale.id);
                                                            setEditingDate(sale.sale_date ? sale.sale_date.slice(0, 10) : "");
                                                        }}
                                                        className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover/date:opacity-100 transition-opacity"
                                                        title="Edit Date"
                                                    >
                                                        <FaCalendarAlt className="text-xs" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    id={`view-sale-${sale.id}`}
                                                    onClick={() => setViewingSale(sale.id)}
                                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    id={`download-invoice-${sale.id}`}
                                                    onClick={() => handleRowDownload(sale)}
                                                    disabled={downloadingId === sale.id}
                                                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                                    title="Download Invoice PDF"
                                                >
                                                    {downloadingId === sale.id
                                                        ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin" />
                                                        : <FaDownload />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {salesData.pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500">
                                    Page {page} of {salesData.pages} &nbsp;·&nbsp; {salesData.total} sales
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(salesData.pages, p + 1))}
                                        disabled={page === salesData.pages}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sale Detail Modal */}
            {viewingSale && (
                <SaleDetailModal
                    saleId={viewingSale}
                    onClose={() => setViewingSale(null)}
                />
            )}
        </div>
    );
}
