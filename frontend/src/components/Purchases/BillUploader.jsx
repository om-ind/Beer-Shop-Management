import { useState, useRef } from "react";
import { FaCloudUploadAlt, FaFileImage, FaFilePdf, FaTimes, FaSpinner } from "react-icons/fa";
import { scanBill } from "../../services/purchaseService";

export default function BillUploader({ onExtracted, onError }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    function handleFile(f) {
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        const allowed = ["jpg", "jpeg", "png", "webp", "pdf"];
        if (!allowed.includes(ext)) {
            onError?.(`Unsupported file type. Allowed: ${allowed.join(", ")}`);
            return;
        }
        setFile(f);
        if (ext !== "pdf") {
            setPreview(URL.createObjectURL(f));
        } else {
            setPreview(null);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        handleFile(f);
    }

    function clearFile() {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    async function handleScan() {
        if (!file) return;
        setScanning(true);
        try {
            const result = await scanBill(file);
            if (result.success) {
                onExtracted(result.extracted);
            } else {
                onError?.(result.message || "Extraction failed");
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Scan failed";
            onError?.(msg);
        } finally {
            setScanning(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    dragOver
                        ? "border-orange-400 bg-orange-50/50 scale-[1.01]"
                        : file
                        ? "border-green-300 bg-green-50/30"
                        : "border-slate-200 bg-slate-50/50 hover:border-orange-300 hover:bg-orange-50/30"
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="hidden"
                />

                {!file ? (
                    <div className="space-y-3">
                        <FaCloudUploadAlt className="mx-auto text-4xl text-slate-300" />
                        <div>
                            <p className="text-slate-600 font-semibold">
                                Drop a bill photo or PDF here
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                or click to browse · JPG, PNG, WebP, PDF
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        {/* Preview */}
                        {preview ? (
                            <img
                                src={preview}
                                alt="Bill preview"
                                className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-red-50 rounded-xl flex items-center justify-center border border-red-200">
                                <FaFilePdf className="text-3xl text-red-400" />
                            </div>
                        )}

                        <div className="flex-1 text-left">
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                                {file.name.endsWith(".pdf") ? (
                                    <FaFilePdf className="text-red-400" />
                                ) : (
                                    <FaFileImage className="text-blue-400" />
                                )}
                                {file.name}
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); clearFile(); }}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                            title="Remove file"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}
            </div>

            {/* Scan Button */}
            {file && (
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all ${
                        scanning
                            ? "bg-orange-400 cursor-wait"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/30 hover:shadow-orange-500/50"
                    }`}
                >
                    {scanning ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            <span>Extracting bill data with AI...</span>
                        </>
                    ) : (
                        <>
                            <FaCloudUploadAlt />
                            <span>Extract Bill Data</span>
                        </>
                    )}
                </button>
            )}

            {/* Scanning progress info */}
            {scanning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <p className="text-amber-700 text-sm font-medium">
                        AI is reading your bill... This may take 5-15 seconds
                    </p>
                </div>
            )}
        </div>
    );
}
