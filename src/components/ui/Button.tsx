'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-none font-medium tracking-wide border transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs',
  {
    variants: {
      variant: {
        primary:
          'bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800 focus:ring-1 focus:ring-zinc-950',
        secondary:
          'bg-white text-zinc-950 border-zinc-200 hover:border-zinc-950',
        outline:
          'border-zinc-950 bg-transparent text-zinc-950 hover:bg-zinc-950 hover:text-white',
        ghost:
          'border-transparent bg-transparent text-zinc-600 hover:text-zinc-950',
        link:
          'border-transparent bg-transparent underline-offset-8 hover:underline text-zinc-900 lowercase',
        success: 'bg-zinc-900 text-white border-zinc-900',
        danger: 'bg-red-950 text-white border-red-950',
        warning: 'bg-stone-200 text-stone-900 border-stone-200',
      },
      size: {
        sm: 'px-4 py-2',
        md: 'px-6 py-3',
        lg: 'px-10 py-4 text-sm',
        xl: 'px-12 py-5 text-base',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, size, fullWidth, isLoading, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button