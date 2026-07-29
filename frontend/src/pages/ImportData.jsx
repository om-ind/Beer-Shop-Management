import { useState, useRef, useCallback } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

const ENTITIES = [
    {
        id: "products",
        label: "Products",
        icon: "📦",
        color: "from-blue-600 to-blue-700",
        border: "border-blue-500/40",
        desc: "Import your full product catalog with prices, stock, and excise details",
        columns: ["name","brand","category","barcode","purchase_price","selling_price","stock","minimum_stock","expiry_date","excise_code","pack_size_ml","liquor_type"],
    },
    {
        id: "customers",
        label: "Customers",
        icon: "👥",
        color: "from-green-600 to-green-700",
        border: "border-green-500/40",
        desc: "Import your customer list with contact details and credit balances",
        columns: ["name","mobile","address","credit_balance"],
    },
    {
        id: "suppliers",
        label: "Suppliers",
        icon: "🚚",
        color: "from-purple-600 to-purple-700",
        border: "border-purple-500/40",
        desc: "Import your supplier and distributor contacts",
        columns: ["name","mobile","company","address"],
    },
];

const STEPS = ["Select Type", "Upload File", "Preview & Confirm", "Done"];

export default function ImportData() {
    const [step,     setStep]     = useState(0);
    const [entity,   setEntity]   = useState(null);
    const [dragging, setDragging] = useState(false);
    const [file,     setFile]     = useState(null);
    const [preview,  setPreview]  = useState(null);  // { rows, errors, total_rows }
    const [loading,  setLoading]  = useState(false);
    const [result,   setResult]   = useState(null);  // { inserted, skipped, skip_log }
    const fileRef = useRef();

    function reset() {
        setStep(0); setEntity(null); setFile(null);
        setPreview(null); setResult(null); setLoading(false);
    }

    // ── Step 1: pick entity ──
    function pickEntity(e) {
        setEntity(e);
        setStep(1);
    }

    // ── Step 2: file handling ──
    function handleDrop(ev) {
        ev.preventDefault();
        setDragging(false);
        const f = ev.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    function handleFile(f) {
        const ok = f.name.match(/\.(xlsx|xls|csv)$/i);
        if (!ok) { toast.error("Upload .xlsx, .xls, or .csv"); return; }
        setFile(f);
        doPreview(f);
    }

    async function doPreview(f) {
        setLoading(true);
        const form = new FormData();
        form.append("file", f);
        try {
            const res = await api.post(`/import/preview/${entity.id}`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPreview(res.data);
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.error || "Parse failed");
        } finally {
            setLoading(false);
        }
    }

    // ── Step 3: commit ──
    async function doImport() {
        setLoading(true);
        try {
            const res = await api.post(`/import/commit/${entity.id}`, { rows: preview.rows });
            setResult(res.data);
            setStep(3);
            toast.success(`${res.data.inserted} ${entity.label.toLowerCase()} imported!`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Import failed");
        } finally {
            setLoading(false);
        }
    }

    async function downloadTemplate() {
        try {
            const res = await api.get(`/import/template/${entity.id}`, { responseType: "blob" });
            const url  = URL.createObjectURL(new Blob([res.data]));
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `${entity.id}_template.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Template download failed"); }
    }

    const ent = entity || ENTITIES[0];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Import Data</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Bulk import products, customers, or suppliers from Excel / CSV</p>
                </div>
                {step > 0 && (
                    <button onClick={reset} className="text-sm text-slate-400 hover:text-white transition-colors">
                        ← Start Over
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="flex gap-2">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex-1 flex flex-col gap-1">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-blue-500" : "bg-slate-700"}`} />
                        <p className={`text-xs text-center ${i === step ? "text-blue-400 font-semibold" : "text-slate-500"}`}>{s}</p>
                    </div>
                ))}
            </div>

            {/* ─── Step 0: Pick type ─── */}
            {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {ENTITIES.map(e => (
                        <button
                            key={e.id}
                            onClick={() => pickEntity(e)}
                            className={`group text-left bg-slate-800 border ${e.border} hover:border-opacity-100 border-opacity-40 rounded-2xl p-6 transition-all hover:shadow-lg hover:scale-[1.02]`}
                        >
                            <div className="text-4xl mb-3">{e.icon}</div>
                            <h3 className="text-white font-bold text-lg">{e.label}</h3>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">{e.desc}</p>
                            <div className="mt-4 flex flex-wrap gap-1">
                                {e.columns.slice(0, 5).map(c => (
                                    <span key={c} className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{c}</span>
                                ))}
                                {e.columns.length > 5 && (
                                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">+{e.columns.length - 5} more</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* ─── Step 1: Upload ─── */}
            {step === 1 && (
                <div className="space-y-5">
                    {/* Instructions */}
                    <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-5 space-y-2">
                        <p className="text-blue-300 font-semibold text-sm">📋 How to import {entity.label}</p>
                        <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
                            <li>Download the template Excel file below</li>
                            <li>Fill in your data (one row per {entity.label.slice(0,-1).toLowerCase()})</li>
                            <li>Upload the filled file — we'll preview before importing</li>
                        </ol>
                    </div>

                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-5 py-3 bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-600/40 rounded-xl text-sm font-semibold transition-colors"
                    >
                        ⬇ Download {entity.label} Template (.xlsx)
                    </button>

                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                            dragging
                                ? "border-blue-400 bg-blue-900/20"
                                : "border-slate-600 hover:border-slate-400 bg-slate-800/40"
                        }`}
                    >
                        <div className="text-5xl mb-4">📂</div>
                        <p className="text-white font-semibold text-lg">Drop your Excel / CSV file here</p>
                        <p className="text-slate-400 text-sm mt-1">or click to browse — supports .xlsx, .xls, .csv</p>
                        {loading && <p className="text-blue-400 text-sm mt-3 animate-pulse">Parsing file…</p>}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                    />
                </div>
            )}

            {/* ─── Step 2: Preview ─── */}
            {step === 2 && preview && (
                <div className="space-y-5">
                    {/* Summary bar */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3">
                            <p className="text-slate-400 text-xs">Rows parsed</p>
                            <p className="text-white text-2xl font-bold">{preview.total_rows}</p>
                        </div>
                        <div className={`border rounded-xl px-5 py-3 ${preview.errors.length ? "bg-red-900/20 border-red-700/40" : "bg-green-900/20 border-green-700/40"}`}>
                            <p className="text-slate-400 text-xs">Validation errors</p>
                            <p className={`text-2xl font-bold ${preview.errors.length ? "text-red-400" : "text-green-400"}`}>{preview.errors.length}</p>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3">
                            <p className="text-slate-400 text-xs">File</p>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">{file?.name}</p>
                        </div>
                    </div>

                    {/* Errors */}
                    {preview.errors.length > 0 && (
                        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 space-y-2">
                            <p className="text-red-300 font-semibold text-sm">⚠ Validation Errors (rows with errors will be skipped)</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {preview.errors.map((e, i) => (
                                    <p key={i} className="text-red-200 text-xs">Row {e.row} · <span className="font-mono">{e.field}</span>: {e.message}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data preview table */}
                    <div>
                        <p className="text-slate-400 text-xs mb-2">Preview (first {Math.min(preview.rows.length, 10)} of {preview.total_rows} rows)</p>
                        <div className="overflow-x-auto rounded-xl border border-slate-700 max-h-80">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-800 text-slate-400 uppercase sticky top-0">
                                    <tr>
                                        {entity.columns.map(c => (
                                            <th key={c} className="px-3 py-2.5 text-left whitespace-nowrap">{c.replace(/_/g," ")}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/40">
                                    {preview.rows.slice(0, 10).map((r, i) => (
                                        <tr key={i} className="bg-slate-900 hover:bg-slate-800/60">
                                            {entity.columns.map(c => (
                                                <td key={c} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[150px] truncate">
                                                    {r[c] !== null && r[c] !== undefined ? String(r[c]) : <span className="text-slate-600">—</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setFile(null); setPreview(null); setStep(1); }}
                            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                        >Upload Different File</button>
                        <button
                            onClick={doImport}
                            disabled={loading || preview.total_rows === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            {loading ? "Importing…" : `✅ Import ${preview.total_rows} ${entity.label}`}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Step 3: Done ─── */}
            {step === 3 && result && (
                <div className="space-y-5 text-center py-8">
                    <div className="text-7xl">🎉</div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Import Complete!</h2>
                        <p className="text-slate-400 mt-1">{entity.label} have been added to the system</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-8 py-4">
                            <p className="text-slate-400 text-xs">Inserted</p>
                            <p className="text-green-400 text-3xl font-bold">{result.inserted}</p>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-8 py-4">
                            <p className="text-slate-400 text-xs">Skipped</p>
                            <p className="text-orange-400 text-3xl font-bold">{result.skipped}</p>
                        </div>
                    </div>

                    {result.skip_log?.length > 0 && (
                        <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 text-left max-w-lg mx-auto">
                            <p className="text-orange-300 font-semibold text-sm mb-2">Skipped rows (duplicates / errors):</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {result.skip_log.map((s, i) => (
                                    <p key={i} className="text-orange-200 text-xs">{s.name}: {s.reason}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                        >Import More Data</button>
                    </div>
                </div>
            )}
        </div>
    );
}
