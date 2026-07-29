import api from "../api/api";

export async function getPurchases() {
    const response = await api.get("/purchases");
    return response.data;
}

export async function getSuppliers() {
    const response = await api.get("/suppliers");
    return response.data;
}

export async function createPurchase(data) {
    const response = await api.post("/purchases", data);
    return response.data;
}

export async function scanBill(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/purchases/scan-bill", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 120s timeout for AI processing
    });
    return response.data;
}