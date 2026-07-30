import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaBars } from "react-icons/fa";

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header Bar */}
                <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white transition"
                        >
                            <FaBars className="text-lg" />
                        </button>
                        <span className="font-bold text-lg">🍺 Beer Shop ERP</span>
                    </div>
                </div>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}