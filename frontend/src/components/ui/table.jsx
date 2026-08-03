import * as React from "react";
import { cn } from "../../lib/utils";

const Table = React.forwardRef(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
        />
    </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            "border-t bg-slate-100/50 font-medium [&>tr]:last-child:border-b-0 dark:bg-slate-800/50",
            className
        )}
        {...props}
    />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b border-slate-100 transition-colors hover:bg-slate-50/80 data-[state=selected]:bg-slate-100 dark:border-slate-800/60 dark:hover:bg-slate-800/50 dark:data-[state=selected]:bg-slate-800",
            className
        )}
        {...props}
    />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-11 px-4 text-left align-middle font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700 dark:text-slate-200", className)}
        {...props}
    />
));
TableCell.displayName = "TableCell";

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
};
