import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-slate-900 text-white shadow hover:bg-slate-800",
                secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
                destructive: "border-transparent bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-500/20 dark:text-red-400",
                success: "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400",
                warning: "border-transparent bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400",
                purple: "border-transparent bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 dark:bg-purple-500/20 dark:text-purple-400",
                outline: "text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
