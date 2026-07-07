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