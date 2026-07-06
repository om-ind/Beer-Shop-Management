import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Products */}
        <Route path="/products" element={<Products />} />

        {/* Customers */}
        <Route path="/customers" element={<Customers />} />

        {/* Sales */}
        <Route path="/sales" element={<Sales />} />

        {/* Purchases */}
        <Route path="/purchases" element={<Purchases />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Analytics */}
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;