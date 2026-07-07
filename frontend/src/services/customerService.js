import api from "../api/api";

export async function getCustomers() {

    const response = await api.get("/customers");

    return response.data;

}

export async function addCustomer(customer) {

    const response = await api.post(
        "/customers",
        customer
    );

    return response.data;

}

export async function updateCustomer(id, customer) {

    const response = await api.put(
        `/customers/${id}`,
        customer
    );

    return response.data;

}

export async function deleteCustomer(id) {

    const response = await api.delete(
        `/customers/${id}`
    );

    return response.data;

}