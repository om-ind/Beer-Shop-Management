import api from "../api/api";

export async function getCustomers() {
    const response = await api.get("/customers");
    return response.data;
}