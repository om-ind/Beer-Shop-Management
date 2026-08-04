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
    try {
        const user = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!user || !token || user === "undefined" || user === "null") {
            return null;
        }
        return JSON.parse(user);
    } catch (e) {
        console.error("Corrupted session data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
    }
}

export function isLoggedIn() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return !!(token && user && user !== "undefined");
}