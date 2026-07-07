import api from "../api/api";

export async function getDashboardReport() {

    const response = await api.get(
        "/reports/dashboard"
    );

    return response.data;
}

export async function getSalesTrend() {

    const response = await api.get(
        "/reports/sales-trend"
    );

    return response.data;
}

export async function getTopProducts() {

    const response = await api.get(
        "/reports/top-products"
    );

    return response.data;

}
export async function getLowStockProducts() {

    const response = await api.get(
        "/reports/low-stock"
    );

    return response.data;

}
export async function getProfitSummary() {

    const response = await api.get(
        "/reports/profit-summary"
    );

    return response.data;

}