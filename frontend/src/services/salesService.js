import api from "../api/api";

export async function searchProducts(keyword) {
    const response = await api.get(`/products/search?q=${keyword}`);
    return response.data;
}

export async function createSale(sale) {
    const response = await api.post("/sales", sale);
    return response.data;
}

export async function getSales(page = 1, perPage = 20) {
    const response = await api.get(`/sales?page=${page}&per_page=${perPage}`);
    return response.data;
}

export async function getSaleDetail(saleId) {
    const response = await api.get(`/sales/${saleId}`);
    return response.data;
}

export async function downloadInvoice(saleId, invoiceNo) {
    const response = await api.get(`/sales/${saleId}/invoice`, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${invoiceNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function updateSale(saleId, data) {
    const response = await api.put(`/sales/${saleId}`, data);
    return response.data;
}