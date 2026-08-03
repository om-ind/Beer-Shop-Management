import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getLowStockProducts } from "../services/lowStockService";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin) {
            getLowStockProducts()
                .then(data => setLowStockCount(data.length))
                .catch(() => {});
        }
    }, [isAdmin]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar Header */}
                <Navbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    lowStockCount={lowStockCount}
                />

                {/* Main Scrollable View Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}