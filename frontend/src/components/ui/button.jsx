import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200",
                destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20",
                outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
                ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
                gradient: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-10 w-10 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button, buttonVariants };
