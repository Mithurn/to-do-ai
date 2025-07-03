import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold bg-primary text-primary-foreground px-4 py-2 shadow-card transition-colors duration-200 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/90 hover:scale-105 hover:shadow-md active:scale-95 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-card hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 transition-transform hover:scale-105 hover:shadow-md active:scale-95",
        destructive:
          "bg-destructive/20 border border-destructive text-destructive hover:bg-destructive/30",
        outline:
          "bg-background border border-border text-foreground hover:bg-accent/30",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
        ghost: "bg-transparent text-primary hover:bg-accent/30 border border-transparent",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-none",
      },
      size: {
        default: "h-9 px-4 py-2 text-base",
        sm: "h-8 rounded-lg px-3 text-sm",
        lg: "h-10 rounded-xl px-8 text-lg",
        icon: "h-9 w-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
