import api from "../api/api";

export async function getDashboard(date = "") {
    const response = await api.get(`/dashboard${date ? `?date=${date}` : ""}`);
    return response.data;
}