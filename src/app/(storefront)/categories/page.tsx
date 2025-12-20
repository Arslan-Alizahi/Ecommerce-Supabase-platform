'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ChevronRight, Package } from 'lucide-react'
import { Category } from '@/types/category'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Build category tree
  const buildCategoryTree = () => {
    const parentCategories = categories.filter(cat => !cat.parent_id)
    return parentCategories.map(parent => ({
      ...parent,
      children: categories.filter(cat => cat.parent_id === parent.id)
    }))
  }

  const categoryTree = buildCategoryTree()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-zinc-950"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-4">Discovery</span>
          <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-zinc-950 mb-6">Collections</h1>
          <p className="text-zinc-500 text-sm tracking-wide max-w-lg leading-relaxed">
            From essential daily wear to editorial statement pieces. Explore our meticulously curated categories.
          </p>
        </motion.div>

        {/* Categories Grid - Refined Editorial Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {categoryTree.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="border-b border-zinc-100 pb-12 h-full flex flex-col">
                <Link
                  href={`/products?category=${category.id}`}
                  className="flex-1"
                >
                  <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl font-serif tracking-tight text-zinc-950 group-hover:text-zinc-400 transition-colors">
                      {category.name}
                    </h2>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-950 group-hover:translate-x-1 transition-all" />
                  </div>

                  {category.description && (
                    <p className="text-zinc-500 text-xs uppercase tracking-widest leading-loose mb-10">
                      {category.description}
                    </p>
                  )}
                </Link>

                {/* Subcategories - Minimalist List */}
                {category.children && category.children.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-300 mb-6">Sub-Collections</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      {category.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/products?category=${child.id}`}
                          className="text-[10px] uppercase tracking-widest font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-10">
                  <Link
                    href={`/products?category=${category.id}`}
                    className="group inline-flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-zinc-950"
                  >
                    View Collection
                    <div className="h-[1px] w-6 bg-zinc-300 group-hover:w-10 transition-all"></div>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {categoryTree.length === 0 && (
          <div className="text-center py-32 border border-dashed border-zinc-100">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest">No collections currently curated</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

