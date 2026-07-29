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
import CashRegister from "./pages/CashRegister";
import Expenses from "./pages/Expenses";
import LowStock from "./pages/LowStock";
import AdminDashboard from "./pages/AdminDashboard";
import Shops from "./pages/Shops";
import BrandRegister from "./pages/BrandRegister";
import DailySalesRegister from "./pages/DailySalesRegister";
import ExciseStatement from "./pages/ExciseStatement";
import ImportData from "./pages/ImportData";

import RequireAuth from "./components/RequireAuth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/dashboard"} replace />;
}

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
                <Route path="/" element={<RootRedirect />} />

                {/* All authenticated users */}
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/settings"  element={<RequireAuth><Settings /></RequireAuth>} />

                {/* Owner + Manager + Cashier */}
                <Route path="/sales"     element={<RequireAuth roles={["Owner","Manager","Cashier"]}><Sales /></RequireAuth>} />
                <Route path="/customers" element={<RequireAuth roles={["Owner","Manager","Cashier"]}><Customers /></RequireAuth>} />

                {/* Owner + Manager */}
                <Route path="/products"      element={<RequireAuth roles={["Owner","Manager"]}><Products /></RequireAuth>} />
                <Route path="/purchases"     element={<RequireAuth roles={["Owner","Manager"]}><Purchases /></RequireAuth>} />
                <Route path="/suppliers"     element={<RequireAuth roles={["Owner","Manager"]}><Suppliers /></RequireAuth>} />
                <Route path="/reports"       element={<RequireAuth roles={["Owner","Manager"]}><Reports /></RequireAuth>} />
                <Route path="/analytics"     element={<RequireAuth roles={["Owner","Manager"]}><Analytics /></RequireAuth>} />
                <Route path="/cash-register" element={<RequireAuth roles={["Owner","Manager"]}><CashRegister /></RequireAuth>} />
                <Route path="/expenses"      element={<RequireAuth roles={["Owner","Manager"]}><Expenses /></RequireAuth>} />
                <Route path="/low-stock"     element={<RequireAuth roles={["Owner","Manager"]}><LowStock /></RequireAuth>} />

                {/* Excise Compliance — Owner + Manager */}
                <Route path="/excise/brands"          element={<RequireAuth roles={["Owner","Manager"]}><BrandRegister /></RequireAuth>} />
                <Route path="/excise/daily-register"  element={<RequireAuth roles={["Owner","Manager"]}><DailySalesRegister /></RequireAuth>} />
                <Route path="/excise/monthly-statement" element={<RequireAuth roles={["Owner","Manager"]}><ExciseStatement /></RequireAuth>} />

                {/* Data Import — Owner only */}
                <Route path="/import" element={<RequireAuth roles={["Owner"]}><ImportData /></RequireAuth>} />

                {/* Owner only */}
                <Route path="/users" element={<RequireAuth roles={["Owner"]}><Users /></RequireAuth>} />

                {/* Admin only */}
                <Route path="/admin/dashboard" element={<RequireAuth roles={["Admin"]}><AdminDashboard /></RequireAuth>} />
                <Route path="/admin/shops"     element={<RequireAuth roles={["Admin"]}><Shops /></RequireAuth>} />
            </Routes>
        </>
    );
}

export default App;