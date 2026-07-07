import api from "../api/api";

export async function searchProducts(keyword) {
    const response = await api.get(`/products/search?q=${keyword}`);
    return response.data;
}

export async function createSale(sale) {
    const response = await api.post("/sales", sale);
    return response.data;
}