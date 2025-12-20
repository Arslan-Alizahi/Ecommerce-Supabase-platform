'use client'

import { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-none px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-900 border-zinc-100',
        secondary: 'bg-white text-zinc-500 border-zinc-200',
        success: 'bg-zinc-950 text-white border-zinc-950',
        warning: 'bg-stone-100 text-stone-800 border-stone-200',
        danger: 'bg-red-50 text-red-900 border-red-100',
        info: 'bg-zinc-50 text-zinc-700 border-zinc-100',
        outline: 'border border-zinc-950 bg-transparent text-zinc-950',
      },
      size: {
        sm: 'text-[9px] px-1.5 py-0.5',
        md: 'text-[10px] px-2 py-0.5',
        lg: 'text-[11px] px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> { }

export default function Badge({
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export function StatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'paid':
      case 'delivered':
        return 'success'
      case 'pending':
      case 'processing':
        return 'warning'
      case 'inactive':
      case 'cancelled':
      case 'failed':
      case 'refunded':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <Badge variant={getVariant()}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function StockBadge({ quantity, threshold = 5 }: { quantity: number; threshold?: number }) {
  const getVariant = () => {
    if (quantity <= 0) return 'danger'
    if (quantity <= threshold) return 'warning'
    return 'success'
  }

  const getText = () => {
    if (quantity <= 0) return 'Out of Stock'
    if (quantity <= threshold) return `Low Stock (${quantity})`
    return `In Stock (${quantity})`
  }

  return (
    <Badge variant={getVariant()}>
      {getText()}
    </Badge>
  )
}