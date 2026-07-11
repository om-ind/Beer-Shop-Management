import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <Routes>

                {/* Public */}
                <Route path="/login" element={<Login />} />

                {/* Redirect root */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard — all roles */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Products — Owner, Manager */}
                <Route
                    path="/products"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager"]}>
                            <Products />
                        </RoleProtectedRoute>
                    }
                />

                {/* Sales — all roles */}
                <Route
                    path="/sales"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager", "Cashier"]}>
                            <Sales />
                        </RoleProtectedRoute>
                    }
                />

                {/* Purchases — Owner, Manager */}
                <Route
                    path="/purchases"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager"]}>
                            <Purchases />
                        </RoleProtectedRoute>
                    }
                />

                {/* Customers — all roles */}
                <Route
                    path="/customers"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager", "Cashier"]}>
                            <Customers />
                        </RoleProtectedRoute>
                    }
                />

                {/* Suppliers — Owner, Manager */}
                <Route
                    path="/suppliers"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager"]}>
                            <Suppliers />
                        </RoleProtectedRoute>
                    }
                />

                {/* Reports — Owner, Manager */}
                <Route
                    path="/reports"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager"]}>
                            <Reports />
                        </RoleProtectedRoute>
                    }
                />

                {/* Analytics — Owner, Manager */}
                <Route
                    path="/analytics"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner", "Manager"]}>
                            <Analytics />
                        </RoleProtectedRoute>
                    }
                />

                {/* Users — Owner only */}
                <Route
                    path="/users"
                    element={
                        <RoleProtectedRoute allowedRoles={["Owner"]}>
                            <Users />
                        </RoleProtectedRoute>
                    }
                />

                {/* Settings — all roles */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </>
    );

}

export default App;