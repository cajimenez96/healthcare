import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "bg-green-500 text-white hover:bg-green-600",
        destructive:
          "bg-red-700 text-white hover:bg-red-800",
        outline:
          "border border-dark-500 bg-dark-400 text-white hover:bg-dark-500/50 cursor-pointer",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        ghost:
          "text-white hover:bg-dark-500/50 hover:text-white",
        link: "text-green-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  // TASK-049: loading state moved here from the now-retired SubmitButton
  // wrapper. Ignored when asChild is true — an asChild usage (e.g. a
  // Link-wrapped nav button) renders as its single child via Radix Slot,
  // which requires exactly one child element; injecting the spinner+text
  // wrapper would break that contract, and asChild call sites are
  // navigational, not async actions waiting on a loading state anyway.
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText = "Cargando...",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const showLoading = isLoading && !asChild;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? disabled : disabled || isLoading}
        {...props}
      >
        {showLoading ? (
          <div className="flex items-center gap-4">
            <Image
              src="/assets/icons/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="animate-spin"
            />
            {loadingText}
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
