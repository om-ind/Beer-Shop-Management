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

import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {

  return (

    <Routes>

      {/* Public Route */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* Redirect */}

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Products */}

      <Route
        path="/products"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager"]}
          >
            <Products />
          </RoleProtectedRoute>
        }
      />

      {/* Sales */}

      <Route
        path="/sales"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager", "Cashier"]}
          >
            <Sales />
          </RoleProtectedRoute>
        }
      />

      {/* Purchases */}

      <Route
        path="/purchases"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager"]}
          >
            <Purchases />
          </RoleProtectedRoute>
        }
      />

      {/* Customers */}

      <Route
        path="/customers"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager", "Cashier"]}
          >
            <Customers />
          </RoleProtectedRoute>
        }
      />

      {/* Suppliers */}

      <Route
        path="/suppliers"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager"]}
          >
            <Suppliers />
          </RoleProtectedRoute>
        }
      />

      {/* Reports */}

      <Route
        path="/reports"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner", "Manager"]}
          >
            <Reports />
          </RoleProtectedRoute>
        }
      />

      {/* Users */}

      <Route
        path="/users"
        element={
          <RoleProtectedRoute
            allowedRoles={["Owner"]}
          >
            <Users />
          </RoleProtectedRoute>
        }
      />

    </Routes>

  );

}

export default App;