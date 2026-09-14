import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-brass text-navy-deep hover:bg-brass-soft",
        navy: "bg-navy text-cream hover:bg-navy-mid",
        ghost: "bg-transparent text-ink hover:bg-cream-deep border border-line",
        danger: "bg-danger text-cream hover:opacity-90",
        link: "bg-transparent text-navy underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-8 px-2.5 text-xs rounded-sm",
        md: "h-9 px-3 text-sm rounded-sm",
        lg: "h-11 px-4 text-sm rounded-md",
        shop: "h-14 px-6 text-base rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
