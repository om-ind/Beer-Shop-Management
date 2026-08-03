import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = ({ isOpen, onClose, title, description, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in-95",
                    className
                )}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </button>

                {(title || description) && (
                    <div className="mb-4 space-y-1">
                        {title && <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>}
                        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                    </div>
                )}

                <div>{children}</div>
            </div>
        </div>
    );
};

export { Dialog };
