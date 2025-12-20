'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Menu, X, Package, Heart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { NavItem } from '@/types/nav'
import * as LucideIcons from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navLinks, setNavLinks] = useState<NavItem[]>([])
  const { itemCount } = useCart()
  const { count: favoritesCount } = useFavorites()

  useEffect(() => {
    // Fetch navigation items from API
    fetch('/api/nav?location=header&active_only=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter to only show top-level items (no parent_id)
          const topLevelItems = (data.data || []).filter((item: NavItem) => !item.parent_id)
          setNavLinks(topLevelItems)
        }
      })
      .catch((error) => console.error('Error fetching nav items:', error))
  }, [])

  // Get icon component from lucide-react
  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const Icon = (LucideIcons as any)[iconName]
    return Icon ? Icon : null
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <span className="text-2xl font-serif tracking-tight text-zinc-950 group-hover:text-zinc-600 transition-colors">ZinyasRang</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => {
              const Icon = getIcon(link.icon)
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  target={link.target || '_self'}
                  className="text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-500 hover:text-zinc-950 transition-colors duration-300"
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Favorites, Cart & Mobile Menu */}
          <div className="flex items-center space-x-6">
            <Link
              href="/favorites"
              className="relative p-2 text-zinc-600 hover:text-zinc-950 transition-colors"
              title="Favorites"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 bg-zinc-950 text-white text-[8px] rounded-0 h-3 w-3 flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-zinc-600 hover:text-zinc-950 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-zinc-950 text-white text-[8px] rounded-0 h-3 w-3 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {navLinks.map((link) => {
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    target={link.target || '_self'}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              })}

              {/* Favorites & Cart Links */}
              <div className="border-t border-zinc-100 pt-8 mt-8 space-y-6">
                <Link
                  href="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  <span>Favorites</span>
                  {favoritesCount > 0 && (
                    <span className="bg-zinc-950 text-white text-[8px] h-4 w-4 flex items-center justify-center font-bold">
                      {favoritesCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  <span>Shopping Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-zinc-950 text-white text-[8px] h-4 w-4 flex items-center justify-center font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}