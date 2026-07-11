import api from "../api/api";

export async function getBrandProfit() {
    const res = await api.get("/analytics/brand-profit");
    return res.data;
}

export async function getTopSellingProducts() {
    const res = await api.get("/analytics/top-products");
    return res.data;
}

export async function getRestockAlerts() {
    const res = await api.get("/analytics/restock");
    return res.data;
}

export async function getAnalyticsSalesTrend() {
    const res = await api.get("/analytics/sales-trend");
    return res.data;
}

export async function getHighestProfitBrand() {
    const res = await api.get("/analytics/highest-profit-brand");
    return res.data;
}

export async function getLowestProfitBrand() {
    const res = await api.get("/analytics/lowest-profit-brand");
    return res.data;
}
