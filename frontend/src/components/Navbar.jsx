import React from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, Bell, Search, User, LogOut, ShieldAlert, Store } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function Navbar({ onOpenSidebar, lowStockCount = 0 }) {
    const { user, logout, isAdmin } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            {/* Mobile Menu Trigger */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onOpenSidebar}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Title / Brand Tag on mobile */}
            <div className="flex items-center gap-2 lg:hidden font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                <span>🍺</span>
                <span>Beer Shop ERP</span>
            </div>

            {/* Quick Search Bar for larger screens */}
            <div className="hidden md:flex flex-1 items-center max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products, sales, reports..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-1.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-amber-400"
                    />
                </div>
            </div>

            {/* Right Action Items */}
            <div className="flex flex-1 items-center justify-end gap-3">
                {/* Low Stock Warning Indicator */}
                {lowStockCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-medium dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Low Stock:</span>
                        <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
                            {lowStockCount}
                        </Badge>
                    </div>
                )}

                {/* Role indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Store className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isAdmin ? "Admin Console" : user?.role || "User"}</span>
                </div>

                {/* User Profile */}
                {user && (
                    <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${isAdmin ? "bg-purple-600" : "bg-amber-600"}`}>
                            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="hidden xl:block text-left">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                                {user.full_name || user.username}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                                {user.shop_name || "Main Branch"}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}