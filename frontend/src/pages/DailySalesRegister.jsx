import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api/api";
import { toast } from "react-toastify";
import { ClipboardList, Printer, Lock, Calendar, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "../components/ui/table";

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function DailySalesRegister() {
    const [date, setDate] = useState(today());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/excise/daily-register?date=${date}`)
            .then(r => setRows(r.data.rows || []))
            .catch(() => toast.error("Failed to load daily register"))
            .finally(() => setLoading(false));
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const isLocked = rows.length > 0 && rows.every(r => r.is_locked);

    async function saveRow(row) {
        setSaving(true);
        try {
            await api.post("/excise/daily-register/save", {
                sale_date: date,
                product_id: row.product_id,
                opening_stock: Number(row.opening_stock),
                qty_received: Number(row.qty_received),
                qty_sold: Number(row.qty_sold),
                sale_value: Number(row.sale_value),
            });
            toast.success("Row updated");
            setEditRow(null);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function lockDay() {
        if (!window.confirm(`Lock the register for ${date}? This action is permanent for excise records.`)) return;
        setLocking(true);
        try {
            await api.post("/excise/daily-register/lock", { date });
            toast.success(`Daily register locked for ${date}`);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || "Lock failed");
        } finally {
            setLocking(false);
        }
    }

    function printRegister() { window.print(); }

    const totals = rows.reduce((acc, r) => {
        acc.qty_received += Number(r.qty_received);
        acc.qty_sold += Number(r.qty_sold);
        acc.sale_value += Number(r.sale_value);
        return acc;
    }, { qty_received: 0, qty_sold: 0, sale_value: 0 });

    return (
        <AdminLayout>
            <div className="space-y-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                                Daily Excise Register
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Statutory daily opening, stock received, sales, and closing register
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="h-8 border-none bg-transparent p-0 text-sm font-semibold"
                            />
                        </div>

                        <Button variant="outline" onClick={printRegister} className="rounded-xl">
                            <Printer className="h-4 w-4 mr-2" />
                            <span>Print Register</span>
                        </Button>

                        {!isLocked && rows.length > 0 && (
                            <Button variant="destructive" disabled={locking} onClick={lockDay} className="rounded-xl font-bold">
                                <Lock className="h-4 w-4 mr-2" />
                                <span>{locking ? "Locking..." : "Lock Register"}</span>
                            </Button>
                        )}

                        {isLocked && (
                            <Badge variant="success" className="px-3 py-1.5 text-xs font-bold gap-1">
                                <Lock className="h-3 w-3" /> Locked
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Print Title Header */}
                <div className="hidden print:block text-center mb-6">
                    <h1 className="text-xl font-bold font-display">Daily Statutory Excise Sales Register</h1>
                    <p className="text-sm">Date: {date}</p>
                </div>

                {/* Table Card */}
                <Card className="print:border-none print:shadow-none">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-sm font-medium">Loading daily register entries...</p>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                                <ClipboardList className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                <p className="font-semibold text-slate-900 dark:text-slate-100">No register entries for {date}</p>
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
                                        <TableHead className="text-right">Received</TableHead>
                                        <TableHead className="text-right">Sold</TableHead>
                                        <TableHead className="text-right">Closing</TableHead>
                                        <TableHead className="text-right">Sale Value (₹)</TableHead>
                                        <TableHead className="text-center print:hidden">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r, i) => {
                                        const isEditing = editRow?.product_id === r.product_id;
                                        const cur = isEditing ? editRow : r;
                                        const closing = Number(cur.opening_stock) + Number(cur.qty_received) - Number(cur.qty_sold);
                                        return (
                                            <TableRow key={r.product_id}>
                                                <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                    <div>{r.name}</div>
                                                    <div className="text-xs text-slate-400 font-normal">{r.brand}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-500">
                                                    {r.excise_code || "—"}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">{r.pack_size_ml ? `${r.pack_size_ml} ml` : "—"}</TableCell>

                                                {["opening_stock", "qty_received", "qty_sold"].map(field => (
                                                    <TableCell key={field} className="text-right font-medium">
                                                        {isEditing && !r.is_locked ? (
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                className="h-8 w-20 text-right text-xs"
                                                                value={cur[field]}
                                                                onChange={e => setEditRow(v => ({ ...v, [field]: e.target.value }))}
                                                            />
                                                        ) : (
                                                            r[field]
                                                        )}
                                                    </TableCell>
                                                ))}

                                                <TableCell className="text-right font-bold">{closing}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₹{Number(cur.sale_value).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center print:hidden">
                                                    {r.is_locked ? (
                                                        <Badge variant="success" className="text-[10px]">Locked</Badge>
                                                    ) : isEditing ? (
                                                        <div className="flex gap-1 justify-center">
                                                            <Button size="sm" variant="gradient" onClick={() => saveRow({ ...editRow, closing_stock: closing })} className="h-7 text-xs text-slate-950">Save</Button>
                                                            <Button size="sm" variant="outline" onClick={() => setEditRow(null)} className="h-7 text-xs">Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" onClick={() => setEditRow({ ...r })} className="h-7 text-xs text-amber-600">Edit</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={5} className="font-bold text-slate-900 dark:text-slate-100">REGISTER TOTALS</TableCell>
                                        <TableCell className="text-right font-bold">{totals.qty_received}</TableCell>
                                        <TableCell className="text-right font-bold">{totals.qty_sold}</TableCell>
                                        <TableCell />
                                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                            ₹{totals.sale_value.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="print:hidden" />
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
