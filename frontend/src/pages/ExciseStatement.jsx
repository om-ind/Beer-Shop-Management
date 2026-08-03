import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/api";
import { toast } from "react-toastify";
import { FileSpreadsheet, Printer, Download, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "../components/ui/table";

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

export default function ExciseStatement() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/excise/monthly-statement?month=${month}&year=${year}`)
            .then(r => setData(r.data))
            .catch(() => toast.error("Failed to load statement"))
            .finally(() => setLoading(false));
    }, [month, year]);

    useEffect(() => { load(); }, [load]);

    async function exportCSV() {
        setExporting(true);
        try {
            const res = await api.get(
                `/excise/monthly-statement/export?month=${month}&year=${year}`,
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = `excise_statement_${year}_${String(month).padStart(2,"0")}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    }

    const rows = data?.rows || [];
    const totals = data?.totals || {};
    const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

    return (
        <AdminLayout>
            <div className="space-y-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Monthly Excise Statement
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Consolidated monthly stock movement & sales audit for government submission
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                        >
                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 outline-none"
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                        <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                            <Printer className="h-4 w-4 mr-2" />
                            <span>Print</span>
                        </Button>
                        <Button variant="gradient" disabled={exporting || rows.length === 0} onClick={exportCSV} className="text-slate-950 font-bold">
                            <Download className="h-4 w-4 mr-2" />
                            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
                        </Button>
                    </div>
                </div>

                {/* Print Title Header */}
                <div className="hidden print:block text-center mb-6">
                    <h1 className="text-xl font-bold font-display">Monthly Excise Statement Report</h1>
                    <p className="text-sm font-semibold">{MONTHS[month - 1]} {year}</p>
                </div>

                {/* Metric Summary Cards */}
                {data && !loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Total Brands</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">{rows.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Total Sold (Units)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
                                    {totals.total_sold?.toLocaleString() || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Total Excise Sale Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                                    ₹{Number(totals.sale_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Table */}
                <Card className="print:border-none print:shadow-none">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-sm font-medium">Generating monthly statement...</p>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <FileSpreadsheet className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                <p className="font-semibold text-slate-900 dark:text-slate-100">No statement data for {MONTHS[month - 1]} {year}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Brand & Product</TableHead>
                                        <TableHead>Excise Code</TableHead>
                                        <TableHead className="text-right">Pack Size</TableHead>
                                        <TableHead className="text-right">Opening</TableHead>
                                        <TableHead className="text-right">Purchased</TableHead>
                                        <TableHead className="text-right">Sold</TableHead>
                                        <TableHead className="text-right">Closing</TableHead>
                                        <TableHead className="text-right">MRP (₹)</TableHead>
                                        <TableHead className="text-right">Sale Value (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r, i) => (
                                        <TableRow key={r.product_id}>
                                            <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                <div>{r.name}</div>
                                                <div className="text-xs text-slate-400 font-normal">{r.brand}</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500">{r.excise_code || "—"}</TableCell>
                                            <TableCell className="text-right text-xs">{r.pack_size_ml ? `${r.pack_size_ml} ml` : "—"}</TableCell>
                                            <TableCell className="text-right font-medium">{r.opening_stock}</TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">{r.total_purchased}</TableCell>
                                            <TableCell className="text-right font-bold text-amber-600">{r.total_sold}</TableCell>
                                            <TableCell className="text-right font-bold">{r.closing_stock}</TableCell>
                                            <TableCell className="text-right">₹{r.selling_price?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                ₹{r.sale_value?.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={5} className="font-bold text-slate-900 dark:text-slate-100">STATEMENT TOTALS</TableCell>
                                        <TableCell className="text-right font-bold">—</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{totals.total_purchased}</TableCell>
                                        <TableCell className="text-right font-bold text-amber-600">{totals.total_sold}</TableCell>
                                        <TableCell className="text-right font-bold">—</TableCell>
                                        <TableCell className="text-right font-bold">—</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                            ₹{Number(totals.sale_value || 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
