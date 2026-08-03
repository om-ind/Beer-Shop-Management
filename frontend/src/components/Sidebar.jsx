import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLowStockProducts } from "../services/lowStockService";
import { usePWAInstall } from "../hooks/usePWAInstall";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    Users,
    BarChart3,
    Sparkles,
    Settings,
    LogOut,
    Shield,
    Wallet,
    Receipt,
    AlertTriangle,
    Building2,
    BookOpen,
    ClipboardList,
    FileSpreadsheet,
    FileUp,
    Download,
    X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const SHOP_MENU = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["Owner", "Manager", "Cashier"] },
    { icon: Package, label: "Products", path: "/products", roles: ["Owner", "Manager"] },
    { icon: ShoppingCart, label: "Sales & POS", path: "/sales", roles: ["Owner", "Manager", "Cashier"] },
    { icon: Wallet, label: "Cash Register", path: "/cash-register", roles: ["Owner", "Manager"] },
    { icon: Truck, label: "Purchases", path: "/purchases", roles: ["Owner", "Manager"] },
    { icon: Users, label: "Customers", path: "/customers", roles: ["Owner", "Manager", "Cashier"] },
    { icon: Building2, label: "Suppliers", path: "/suppliers", roles: ["Owner", "Manager"] },
    { icon: AlertTriangle, label: "Low Stock", path: "/low-stock", roles: ["Owner", "Manager"], badge: true },
    { icon: Receipt, label: "Expenses", path: "/expenses", roles: ["Owner", "Manager"] },
    { icon: BarChart3, label: "Reports", path: "/reports", roles: ["Owner", "Manager"] },
    { icon: Sparkles, label: "AI Analytics", path: "/analytics", roles: ["Owner", "Manager"] },
    { icon: Shield, label: "User Control", path: "/users", roles: ["Owner"] },
    { icon: FileUp, label: "Import Data", path: "/import", roles: ["Owner"] },
    { icon: Settings, label: "Settings", path: "/settings", roles: ["Owner", "Manager", "Cashier"] },
    // ── Excise Compliance ──
    { divider: true, label: "Excise Compliance", roles: ["Owner", "Manager"] },
    { icon: BookOpen, label: "Brand Register", path: "/excise/brands", roles: ["Owner", "Manager"] },
    { icon: ClipboardList, label: "Daily Register", path: "/excise/daily-register", roles: ["Owner", "Manager"] },
    { icon: FileSpreadsheet, label: "Monthly Statement", path: "/excise/monthly-statement", roles: ["Owner", "Manager"] },
];

const ADMIN_MENU = [
    { icon: LayoutDashboard, label: "Admin Dashboard", path: "/admin/dashboard" },
    { icon: Building2, label: "All Shops", path: "/admin/shops" },
    { icon: Shield, label: "All Users", path: "/users" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [lowStockCount, setLowStockCount] = useState(0);
    const { isInstallable, promptInstall } = usePWAInstall();

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
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                />
            )}

            <aside
                className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Logo + Mobile Close */}
                <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xl shadow-lg shadow-amber-500/20">
                            🍺
                        </div>
                        <div>
                            <h1 className="font-display text-base font-bold text-white tracking-tight truncate max-w-[150px]" title={user?.shop_name || "Beer Shop ERP"}>
                                {user?.shop_name || "Beer Shop ERP"}
                            </h1>
                            <p className="text-slate-400 text-xs font-medium">
                                {isAdmin ? "Admin Console" : "Beer Shop Management"}
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {menu.map((item, index) => {
                        if (item.divider) {
                            return (
                                <div key={item.label || index} className="pt-4 pb-2 px-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        }

                        const IconComponent = item.icon;

                        return (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? isAdmin
                                                ? "bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/25"
                                                : "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25"
                                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                                    }`
                                }
                            >
                                <IconComponent className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 truncate">{item.label}</span>
                                {item.badge && lowStockCount > 0 && (
                                    <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-[10px] rounded-full">
                                        {lowStockCount}
                                    </Badge>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer User Info & Actions */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-3">
                    {isInstallable && (
                        <Button
                            onClick={promptInstall}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-500/20 rounded-xl"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            <span>Install Web App</span>
                        </Button>
                    )}

                    {user && (
                        <div className="flex items-center gap-3 px-2 py-1">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${isAdmin ? "bg-purple-600" : "bg-amber-600"}`}>
                                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold truncate">
                                    {user.full_name || user.username}
                                </p>
                                <p className="text-slate-400 text-xs truncate">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </aside>
        </>
    );
}