import api from "../api/api";

export async function getSupplierBills(supplierId) {
    const res = await api.get(`/suppliers/${supplierId}/bills`);
    return res.data;
}

export async function getSupplierBillsOverview() {
    const res = await api.get("/supplier-bills/overview");
    return res.data;
}

export async function addSupplierBill(bill) {
    const res = await api.post("/supplier-bills", bill);
    return res.data;
}

export async function paySupplierBill(billId, amount) {
    const res = await api.put(`/supplier-bills/${billId}/pay`, { amount });
    return res.data;
}

export async function deleteSupplierBill(billId) {
    const res = await api.delete(`/supplier-bills/${billId}`);
    return res.data;
}

export async function getPendingBills() {
    const res = await api.get("/supplier-bills/pending");
    return res.data;
}
