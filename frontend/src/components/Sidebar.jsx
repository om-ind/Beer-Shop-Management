import {
    FaHome,
    FaBox,
    FaShoppingCart,
    FaTruck,
    FaUsers,
    FaChartBar,
    FaRobot,
    FaCog,
} from "react-icons/fa";

const menu = [
    { icon: <FaHome />, label: "Dashboard" },
    { icon: <FaBox />, label: "Products" },
    { icon: <FaShoppingCart />, label: "Sales" },
    { icon: <FaTruck />, label: "Purchases" },
    { icon: <FaUsers />, label: "Customers" },
    { icon: <FaChartBar />, label: "Reports" },
    { icon: <FaRobot />, label: "Analytics" },
    { icon: <FaCog />, label: "Settings" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white p-5">
            <h1 className="text-2xl font-bold mb-8">🍺 Beer Shop ERP</h1>

            <nav className="space-y-2">
                {menu.map((item) => (
                    <button
                        key={item.label}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-700 transition"
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
}