import api from "../api/api";

export async function getExpenses(month, year) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get("/expenses", { params });
    return res.data;
}

export async function addExpense(data) {
    const res = await api.post("/expenses", data);
    return res.data;
}

export async function updateExpense(id, data) {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data;
}

export async function deleteExpense(id) {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
}

export async function getExpenseSummary(month, year) {
    const res = await api.get("/expenses/summary", { params: { month, year } });
    return res.data;
}
