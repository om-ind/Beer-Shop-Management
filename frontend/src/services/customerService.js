import api from "../api/api";

export async function getCustomers() {
    const response = await api.get("/customers");
    return response.data;
}

export async function addCustomer(customer) {
    const response = await api.post("/customers", customer);
    return response.data;
}

export async function updateCustomer(id, customer) {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data;
}

export async function deleteCustomer(id) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
}

export async function checkCustomerLinks(id) {
    const response = await api.get(`/customers/${id}/check`);
    return response.data;
}

export async function forceDeleteCustomer(id) {
    const response = await api.delete(`/customers/${id}?force=true`);
    return response.data;
}

export async function getCreditHistory(customerId) {
    const response = await api.get(`/customers/${customerId}/credit-history`);
    return response.data;
}

export async function addCreditPayment(customerId, amount, remarks) {
    const response = await api.post(`/customers/${customerId}/credit-payment`, {
        amount,
        remarks,
    });
    return response.data;
}

export async function addCreditTransaction(customerId, { type, amount, remarks, date }) {
    const response = await api.post(`/customers/${customerId}/credit-transaction`, {
        type,
        amount,
        remarks,
        date,
    });
    return response.data;
}