import api from "../api/api";

export async function getCashSummary() {
    const res = await api.get("/cash-register/summary");
    return res.data;
}

export async function getCashEntries({ page = 1, perPage = 30, type = "", from = "", to = "" } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (type) params.append("type", type);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const res = await api.get(`/cash-register?${params}`);
    return res.data;
}

export async function addCashEntry(entry) {
    const res = await api.post("/cash-register", entry);
    return res.data;
}

export async function deleteCashEntry(id) {
    const res = await api.delete(`/cash-register/${id}`);
    return res.data;
}
