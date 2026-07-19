import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getLowStockProducts } from "../services/lowStockService";
import {
    FaHome,
    FaBox,
    FaShoppingCart,
    FaTruck,
    FaUsers,
    FaChartBar,
    FaRobot,
    FaCog,
    FaUserSecret,
    FaSignOutAlt,
    FaUserShield,
    FaWallet,
    FaReceipt,
    FaExclamationTriangle,
    FaStore,
    FaTachometerAlt,
} from "react-icons/fa";

// Menu visible to shop users (Owner / Manager / Cashier)
const SHOP_MENU = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboard", roles: ["Owner", "Manager", "Cashier"] },
    { icon: <FaBox />, label: "Products", path: "/products", roles: ["Owner", "Manager"] },
    { icon: <FaShoppingCart />, label: "Sales", path: "/sales", roles: ["Owner", "Manager", "Cashier"] },
    { icon: <FaWallet />, label: "Cash Register", path: "/cash-register", roles: ["Owner", "Manager"] },
    { icon: <FaTruck />, label: "Purchases", path: "/purchases", roles: ["Owner", "Manager"] },
    { icon: <FaUsers />, label: "Customers", path: "/customers", roles: ["Owner", "Manager", "Cashier"] },
    { icon: <FaUserSecret />, label: "Suppliers", path: "/suppliers", roles: ["Owner", "Manager"] },
    { icon: <FaExclamationTriangle />, label: "Low Stock", path: "/low-stock", roles: ["Owner", "Manager"], badge: true },
    { icon: <FaReceipt />, label: "Expenses", path: "/expenses", roles: ["Owner", "Manager"] },
    { icon: <FaChartBar />, label: "Reports", path: "/reports", roles: ["Owner", "Manager"] },
    { icon: <FaRobot />, label: "Analytics", path: "/analytics", roles: ["Owner", "Manager"] },
    { icon: <FaUserShield />, label: "Users", path: "/users", roles: ["Owner"] },
    { icon: <FaCog />, label: "Settings", path: "/settings", roles: ["Owner", "Manager", "Cashier"] },
];

// Menu visible to Admin only
const ADMIN_MENU = [
    { icon: <FaTachometerAlt />, label: "Admin Dashboard", path: "/admin/dashboard" },
    { icon: <FaStore />, label: "All Shops", path: "/admin/shops" },
    { icon: <FaUserShield />, label: "Settings", path: "/settings" },
];

const ROLE_STYLE = {
    Owner:   "bg-yellow-400/20 text-yellow-300",
    Manager: "bg-blue-400/20 text-blue-300",
    Cashier: "bg-green-400/20 text-green-300",
    Admin:   "bg-purple-400/20 text-purple-300",
};

export default function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        if (!isAdmin) {
            getLowStockProducts()
                .then(data => setLowStockCount(data.length))
                .catch(() => {});
        }
    }, [isAdmin]);

    const menu = isAdmin
        ? ADMIN_MENU
        : SHOP_MENU.filter(item => !user || item.roles.includes(user.role));

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">

            {/* Logo */}
            <div className="px-5 py-6 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    🍺 <span>Beer Shop ERP</span>
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                    {isAdmin ? "Admin Panel" : "Management System"}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {menu.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? isAdmin
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                                    : "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                            }`
                        }
                    >
                        <span className="text-base">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && lowStockCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow">
                                {lowStockCount}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile + Logout */}
            <div className="px-4 py-4 border-t border-slate-700 space-y-3">
                {user && (
                    <div className="flex items-center gap-3 px-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isAdmin ? "bg-purple-600" : "bg-blue-600"}`}>
                            {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {user.full_name || user.username}
                            </p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLE[user.role] || "bg-gray-500/20 text-gray-300"}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-all"
                >
                    <FaSignOutAlt />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}