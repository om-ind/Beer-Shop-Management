import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminRoute — only renders children if user has role "Admin".
 * Anyone else is redirected to /dashboard.
 */
export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (user.role !== "Admin") return <Navigate to="/dashboard" replace />;

    return children;
}
