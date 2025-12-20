'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover3D?: boolean
  noPadding?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover3D, noPadding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-zinc-100 shadow-luxury transition-all duration-500',
          !noPadding && 'p-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-6 border-b border-zinc-100 mb-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-serif tracking-tight text-zinc-900', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs uppercase tracking-widest text-zinc-500 mt-2', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding, ...props }, ref) => (
    <div ref={ref} className={cn(!noPadding && 'space-y-4', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-8 mt-auto flex items-center justify-between', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export default Card
