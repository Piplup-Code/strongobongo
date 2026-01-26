import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-2 border-transparent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary hover:bg-primary/80 hover:border-primary/80 active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        destructive:
          "bg-destructive text-white border-destructive hover:bg-destructive/80 hover:border-destructive/80 active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        outline:
          "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80 hover:border-secondary/80 active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
        ghost:
          "border-transparent hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default: "h-12 px-6 py-3 has-[>svg]:px-5",
        sm: "h-10 gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-14 px-8 has-[>svg]:px-6 text-base",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
