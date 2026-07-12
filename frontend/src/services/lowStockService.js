import api from "../api/api";

export async function getLowStockProducts() {
    const res = await api.get("/analytics/restock");
    return res.data;
}
