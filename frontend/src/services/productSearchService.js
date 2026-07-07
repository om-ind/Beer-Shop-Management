import api from "../api/api";

export async function searchProducts(keyword) {

    const response = await api.get(
        `/products/search?q=${keyword}`
    );

    return response.data;

}