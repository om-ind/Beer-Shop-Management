import api from "../api/api";

export async function login(username, password) {

    console.log("4. Sending request to backend");

    const response = await api.post("/login", {

        username,

        password,

    });

    console.log("5. Backend response", response);

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