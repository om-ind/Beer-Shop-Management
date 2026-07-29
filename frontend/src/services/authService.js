import api from "../api/api";

export async function login(username, password) {
    const response = await api.post("/login", { username, password });
    return response.data;
}

export function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

}

export function getCurrentUser() {

    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;

}

export function isLoggedIn() {

    return !!localStorage.getItem("token");

}