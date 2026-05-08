"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-[color:var(--color-fg)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);

Label.displayName = "Label";
