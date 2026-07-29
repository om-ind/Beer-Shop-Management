import api from "../api/api";

export async function getAllShops() {
    const response = await api.get("/shops");
    return response.data;
}

export async function getShopStats(shopId) {
    const response = await api.get(`/shops/${shopId}/stats`);
    return response.data;
}

export async function getAdminOverview() {
    const response = await api.get("/admin/overview");
    return response.data;
}

export async function createShop(data) {
    const response = await api.post("/shops", data);
    return response.data;
}

export async function updateShop(shopId, data) {
    const response = await api.put(`/shops/${shopId}`, data);
    return response.data;
}

export async function deactivateShop(shopId) {
    const response = await api.delete(`/shops/${shopId}`);
    return response.data;
}
