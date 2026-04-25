import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("rounded-xl border border-zinc-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
    return <h3 className={cn("text-sm font-semibold text-zinc-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
    return <p className={cn("text-xs text-zinc-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("p-4 pt-0", className)} {...props} />;
}
