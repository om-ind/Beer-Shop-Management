import { useState, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/api";
import { toast } from "react-toastify";
import { FileUp, Download, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";

const ENTITIES = [
    {
        id: "products",
        label: "Products Catalog",
        desc: "Import full product catalog with prices, stock, and excise details",
        columns: ["name","brand","category","barcode","purchase_price","selling_price","stock","minimum_stock","expiry_date","excise_code","pack_size_ml","liquor_type"],
    },
    {
        id: "customers",
        label: "Customers List",
        desc: "Import customer directory with contact details and credit balances",
        columns: ["name","mobile","address","credit_balance"],
    },
    {
        id: "suppliers",
        label: "Suppliers Directory",
        desc: "Import supplier contacts and company details",
        columns: ["name","mobile","company","address"],
    },
];

const STEPS = ["Select Entity", "Upload File", "Preview & Confirm", "Complete"];

export default function ImportData() {
    const [step, setStep] = useState(0);
    const [entity, setEntity] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileRef = useRef();

    function reset() {
        setStep(0); setEntity(null); setFile(null);
        setPreview(null); setResult(null); setLoading(false);
    }

    function pickEntity(e) {
        setEntity(e);
        setStep(1);
    }

    function handleFile(f) {
        const ok = f.name.match(/\.(xlsx|xls|csv)$/i);
        if (!ok) { toast.error("Upload .xlsx, .xls, or .csv file"); return; }
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
            toast.error(err.response?.data?.error || "File parsing failed");
        } finally {
            setLoading(false);
        }
    }

    async function doImport() {
        setLoading(true);
        try {
            const res = await api.post(`/import/commit/${entity.id}`, { rows: preview.rows });
            setResult(res.data);
            setStep(3);
            toast.success(`${res.data.inserted} ${entity.label.toLowerCase()} imported successfully!`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Import commit failed");
        } finally {
            setLoading(false);
        }
    }

    async function downloadTemplate() {
        try {
            const res = await api.get(`/import/template/${entity.id}`, { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${entity.id}_template.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Template download failed"); }
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <FileUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Bulk Data Importer
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Import Excel / CSV datasets into your shop database
                            </p>
                        </div>
                    </div>

                    {step > 0 && (
                        <Button variant="outline" onClick={reset} className="rounded-xl">
                            Start Over
                        </Button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex-1 flex flex-col gap-1">
                            <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                            <p className={`text-xs text-center font-semibold ${i === step ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>{s}</p>
                        </div>
                    ))}
                </div>

                {/* Step 0: Entity Selection */}
                {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                        {ENTITIES.map(e => (
                            <Card key={e.id} className="cursor-pointer hover:border-amber-500 transition-all hover:scale-[1.02]" onClick={() => pickEntity(e)}>
                                <CardHeader>
                                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 w-fit mb-2">
                                        <FileSpreadsheet className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-lg font-bold">{e.label}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{e.desc}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {e.columns.slice(0, 4).map(c => (
                                            <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Step 1: Upload */}
                {step === 1 && (
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Download Spreadsheet Template</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Pre-formatted Excel sheet for {entity.label}</p>
                                </div>
                                <Button variant="gradient" onClick={downloadTemplate} className="text-slate-950 font-bold text-xs">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>

                            <div
                                onClick={() => fileRef.current.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-amber-500 rounded-2xl p-12 text-center cursor-pointer transition"
                            >
                                <FileUp className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-base">Click or Drag & Drop Excel / CSV File</p>
                                <p className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, and .csv formats</p>
                                {loading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-amber-500" />}
                            </div>

                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Preview & Confirm */}
                {step === 2 && preview && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Import Data Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4 flex-wrap">
                                <Badge variant="secondary" className="px-3 py-1.5 text-xs font-bold">
                                    Parsed: {preview.total_rows} rows
                                </Badge>
                                <Badge variant={preview.errors.length ? "destructive" : "success"} className="px-3 py-1.5 text-xs font-bold">
                                    Errors: {preview.errors.length}
                                </Badge>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {entity.columns.map(c => (
                                                <TableHead key={c}>{c.replace(/_/g, " ")}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {preview.rows.slice(0, 8).map((r, i) => (
                                            <TableRow key={i}>
                                                {entity.columns.map(c => (
                                                    <TableCell key={c} className="text-xs">
                                                        {r[c] !== null && r[c] !== undefined ? String(r[c]) : "—"}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Change File
                                </Button>
                                <Button variant="gradient" disabled={loading || preview.total_rows === 0} onClick={doImport} className="text-slate-950 font-bold">
                                    {loading ? "Importing Data..." : `Confirm & Import ${preview.total_rows} Records`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Complete */}
                {step === 3 && result && (
                    <Card className="text-center p-8 space-y-4">
                        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
                        <h2 className="text-2xl font-bold font-display">Data Import Finished!</h2>
                        <p className="text-slate-500 text-sm">{result.inserted} records successfully processed into {entity.label}</p>
                        <Button variant="gradient" onClick={reset} className="text-slate-950 font-bold">
                            Import Another Dataset
                        </Button>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
