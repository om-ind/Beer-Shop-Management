import api from "../api/api";

export async function getDashboard() {
    const response = await api.get("/dashboard");
    return response.data;
}