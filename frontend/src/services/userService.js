import api from "../api/api";

export async function getUsers() {
    const res = await api.get("/users");
    return res.data;
}

export async function createUser(userData) {
    const res = await api.post("/users", userData);
    return res.data;
}

export async function updateUser(id, fields) {
    const res = await api.put(`/users/${id}`, fields);
    return res.data;
}

export async function deleteUser(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
}

export async function resetUserPassword(id, newPassword) {
    const res = await api.put(`/users/${id}/reset-password`, {
        new_password: newPassword,
    });
    return res.data;
}

export async function changeMyPassword(username, currentPassword, newPassword) {
    const res = await api.put("/auth/change-password", {
        username,
        current_password: currentPassword,
        new_password: newPassword,
    });
    return res.data;
}
