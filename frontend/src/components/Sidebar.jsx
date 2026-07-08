import { NavLink } from "react-router-dom";
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
} from "react-icons/fa";

const menu = [
    { icon: <FaHome />, label: "Dashboard", path: "/dashboard" },
    { icon: <FaBox />, label: "Products", path: "/products" },
    { icon: <FaShoppingCart />, label: "Sales", path: "/sales" },
    { icon: <FaTruck />, label: "Purchases", path: "/purchases" },
    { icon: <FaUsers />, label: "Customers", path: "/customers" },
    { icon: <FaChartBar />, label: "Reports", path: "/reports" },
    { icon: <FaRobot />, label: "Analytics", path: "/analytics" },
    { icon: <FaCog />, label: "Settings", path: "/settings" },
    { icon: <FaUserSecret />, label: "Suppliers", path: "/suppliers" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white p-5">
            <h1 className="text-2xl font-bold mb-8">🍺 Beer Shop ERP</h1>

            <nav className="space-y-2">
                {menu.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 w-full p-3 rounded-lg transition ${isActive ? "bg-blue-600" : "hover:bg-slate-700"
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}