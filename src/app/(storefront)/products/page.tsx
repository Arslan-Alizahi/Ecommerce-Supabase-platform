'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { ProductCardSkeleton } from '@/components/ui/Spinner'
import { ShoppingCart, Search, Filter } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Product, ProductFilter } from '@/types/product'
import { Category } from '@/types/category'
import { useCart } from '@/hooks/useCart'
import { useDebounce } from '@/hooks/useDebounce'
import { StockBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize filters from URL params immediately
  const categoryParam = searchParams.get('category')
  const initialCategoryId = categoryParam ? parseInt(categoryParam) : undefined

  const [filters, setFilters] = useState<ProductFilter>({
    category_id: initialCategoryId,
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  })
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  const debouncedSearch = useDebounce(filters.search || '', 500)
  const { addToCart } = useCart()
  const { addToast } = useToast()

  // Update filters when URL changes
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const newCategoryId = categoryParam ? parseInt(categoryParam) : undefined

    setFilters(prev => ({
      ...prev,
      category_id: newCategoryId
    }))
    setCurrentPage(1) // Reset to first page when category changes
  }, [searchParams])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [debouncedSearch, filters.category_id, filters.sort_by, filters.sort_order, currentPage])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filters.category_id) params.append('category_id', filters.category_id.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (data.success) {
        setProducts(data.data.products || [])
        setTotalPages(data.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      addToast('Product is out of stock', 'error')
      return
    }

    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.primary_image || product.images?.[0]?.image_url,
      product_sku: product.sku,
      quantity: 1,
      unit_price: product.price,
      stock_quantity: product.stock_quantity,
    })

    addToast(`${product.name} added to cart!`, 'success')
  }

  const sortOptions = [
    { value: 'created_at:desc', label: 'Newest First' },
    { value: 'created_at:asc', label: 'Oldest First' },
    { value: 'price:asc', label: 'Price: Low to High' },
    { value: 'price:desc', label: 'Price: High to Low' },
    { value: 'name:asc', label: 'Name: A to Z' },
    { value: 'name:desc', label: 'Name: Z to A' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-4">Collection</span>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-zinc-900 mb-4">The Editorial Selection</h1>
          <p className="text-zinc-500 text-sm tracking-wide">Curated garments designed for the modern silhouette.</p>
        </div>

        {/* Filters & Sort - Minimalist */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pb-8 border-b border-zinc-100">
          <div className="flex flex-wrap items-center gap-6">
            {/* Category Filter - Simple Text Links */}
            <button
              onClick={() => {
                setFilters({ ...filters, category_id: undefined })
                router.push(pathname)
              }}
              className={cn(
                "text-[10px] uppercase tracking-widest font-bold transition-colors",
                !filters.category_id ? "text-zinc-950 border-b-2 border-zinc-950 pb-1" : "text-zinc-400 hover:text-zinc-950"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`${pathname}?category=${cat.id}`)}
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold transition-colors",
                  filters.category_id === cat.id ? "text-zinc-950 border-b-2 border-zinc-950 pb-1" : "text-zinc-400 hover:text-zinc-950"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-48">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
              <input
                type="text"
                placeholder="SEARCH"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-transparent border-none pl-6 text-[10px] tracking-widest uppercase focus:ring-0 placeholder-zinc-300"
              />
            </div>
            <div className="h-4 w-[1px] bg-zinc-200 hidden md:block"></div>
            <select
              value={`${filters.sort_by}:${filters.sort_order}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':')
                setFilters({
                  ...filters,
                  sort_by: sortBy as any,
                  sort_order: sortOrder as any,
                })
              }}
              className="bg-transparent border-none text-[10px] tracking-widest uppercase font-bold focus:ring-0 cursor-pointer pr-8"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-zinc-100 mb-4"></div>
                <div className="h-4 bg-zinc-100 w-2/3 mb-2"></div>
                <div className="h-4 bg-zinc-100 w-1/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-zinc-100">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest">No garments found in this selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 4) * 0.05, duration: 0.6 }}
              >
                <Card noPadding className="border-none shadow-none group">
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 mb-6">
                      <img
                        src={product.primary_image || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        {product.stock_quantity <= 0 ? (
                          <StockBadge quantity={0} />
                        ) : product.compare_at_price && (
                          <span className="bg-zinc-950 text-white px-3 py-1 text-[8px] uppercase tracking-widest font-bold">Sale</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="space-y-3">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] font-medium text-zinc-400">Garment</h3>
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/products/${product.slug}`}>
                        <h4 className="text-base font-serif tracking-tight text-zinc-900 group-hover:text-zinc-500 transition-colors">{product.name}</h4>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product)
                        }}
                        disabled={product.stock_quantity <= 0}
                        className="text-zinc-950 hover:text-zinc-500 p-1 disabled:text-zinc-200"
                      >
                        <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-950">
                        {formatCurrency(product.price)}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatCurrency(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination - Minimalist */}
        {totalPages > 1 && (
          <div className="mt-32 flex justify-center items-center gap-12">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-[10px] uppercase tracking-widest font-bold text-zinc-950 disabled:text-zinc-200 transition-colors"
            >
              Prev
            </button>
            <div className="flex items-center gap-6">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-bold transition-colors",
                    currentPage === i + 1 ? "text-zinc-950" : "text-zinc-300 hover:text-zinc-950"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-[10px] uppercase tracking-widest font-bold text-zinc-950 disabled:text-zinc-200 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin h-8 w-8 border-b-2 border-zinc-950"></div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}