import { cva, type VariantProps } from "class-variance-authority"
import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary via-primary/80 to-primary text-primary-foreground hover:shadow-lg",
        secondary: "bg-gradient-to-r from-secondary via-secondary/80 to-secondary text-secondary-foreground hover:shadow-lg",
        rainbow: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg",
        neon: "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]",
        sunset: "bg-gradient-to-r from-orange-500 via-red-500 to-purple-500 text-white hover:shadow-lg",
        ocean: "bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 text-white hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
      glow: {
        true: "hover:animate-glow",
        false: "",
      },
      shine: {
        true: "hover:animate-shine",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
      shine: true,
    },
  }
)

export interface GradientButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, glow, shine, ...props }, ref) => {
    return (
      <button
        className={cn(gradientButtonVariants({ variant, size, glow, shine, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {props.children}
        </span>

        {/* Animated gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            backgroundSize: "200% 100%",
            animation: "gradient 8s linear infinite",
          }}
        />

        {/* Shine effect */}
        {shine && (
          <div
            className="absolute inset-0 -z-10 translate-x-[-100%] rotate-12 transform-gpu bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all group-hover:translate-x-[100%] group-hover:opacity-100"
            style={{
              transition: "transform 0.6s ease, opacity 0.3s ease",
            }}
          />
        )}

        {/* Glow effect */}
        {glow && (
          <div className="absolute inset-0 -z-20 transform-gpu rounded-lg bg-gradient-to-r opacity-0 blur transition-opacity group-hover:opacity-70" />
        )}
      </button>
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants } 