import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RequireAuth — single route guard replacing ProtectedRoute, RoleProtectedRoute, AdminRoute.
 *
 * Usage:
 *   <RequireAuth>                          — any authenticated user
 *   <RequireAuth roles={["Owner"]}>        — specific roles
 *   <RequireAuth roles={["Admin"]}>        — admin only
 */
export default function RequireAuth({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace />;
    }

    return children;
}
