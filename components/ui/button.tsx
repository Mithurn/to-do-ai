import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 backdrop-blur border border-white/40 bg-white/60 text-gray-900 dark:bg-white/10 dark:text-white hover:bg-white/80 dark:hover:bg-white/20 shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "bg-white/60 border border-white/40 text-gray-900 dark:bg-white/10 dark:text-white px-4 py-2 rounded-lg backdrop-blur hover:bg-white/80 dark:hover:bg-white/20 shadow-sm hover:shadow-md transition",
        destructive:
          "bg-red-500/20 border border-red-500/30 text-red-700 hover:bg-red-500/30 backdrop-blur rounded-lg transition",
        outline:
          "bg-white/30 border border-white/50 text-gray-900 dark:bg-white/5 dark:text-white hover:bg-white/50 dark:hover:bg-white/15 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition",
        secondary:
          "bg-blue-500/10 border border-blue-500/20 text-blue-700 hover:bg-blue-500/20 rounded-lg backdrop-blur transition",
        ghost: "bg-transparent border border-transparent text-white hover:bg-white/10 rounded-lg backdrop-blur transition",
        link: "text-blue-400 underline-offset-4 hover:underline bg-transparent border-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
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
