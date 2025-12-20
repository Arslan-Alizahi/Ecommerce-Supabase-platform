'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart, Share2, ChevronRight, Minus, Plus, Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, cn } from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites()
  const { addToast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/slug/${params.slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/products')
            return
          }
          throw new Error('Failed to fetch product')
        }
        const data = await response.json()
        setProduct(data)
      } catch (error) {
        console.error('Error:', error)
        addToast('Failed to load product', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchProduct()
    }
  }, [params.slug, router, addToast])

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.images?.[0]?.image_url || '/placeholder.png',
      product_sku: product.sku,
      quantity: quantity,
      unit_price: product.price,
      stock_quantity: product.stock_quantity,
    })

    addToast(`${product.name} added to cart!`, 'success')
  }

  const handleToggleFavorite = () => {
    if (!product) return

    const isNowFavorite = toggleFavorite({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.images?.[0]?.image_url || '/placeholder.png',
      product_sku: product.sku,
      price: product.price,
      compare_at_price: product.compare_at_price,
      stock_quantity: product.stock_quantity,
    })

    if (isNowFavorite) {
      addToast(`${product.name} added to favorites!`, 'success')
    } else {
      addToast(`${product.name} removed from favorites`, 'info')
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    }

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        addToast('Product shared successfully!', 'success')
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        addToast('Link copied to clipboard!', 'success')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        addToast('Failed to copy link', 'error')
      }
    }
  }

  const incrementQuantity = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-zinc-950"></div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const inStock = product.stock_quantity > 0

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Immersive Gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="aspect-[3/4] relative bg-zinc-50 overflow-hidden">
              <img
                src={product.images?.[selectedImage]?.image_url || '/placeholder.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image: any, index: number) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "aspect-[3/4] relative overflow-hidden transition-all duration-300",
                      selectedImage === index ? "opacity-100 ring-1 ring-zinc-950" : "opacity-40 hover:opacity-100"
                    )}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info - Editorial Style */}
          <div className="flex flex-col h-full py-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block">Garment Details</span>
                <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-zinc-950 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-6 pt-2">
                  <span className="text-2xl font-medium text-zinc-950">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-lg text-zinc-300 line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-zinc-600 leading-loose tracking-wide text-sm">
                  {product.description}
                </p>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 flex items-center gap-4">
                  <span>Reference: {product.sku}</span>
                  <span className="h-3 w-[1px] bg-zinc-100"></span>
                  <span className={inStock ? "text-zinc-950" : "text-red-500"}>
                    {inStock ? "Available in Selection" : "Temporarily Archived"}
                  </span>
                </div>
              </div>

              {inStock && (
                <div className="space-y-10 pt-4">
                  {/* Quantity - Minimalist */}
                  <div className="flex items-center gap-12">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Quantity</span>
                    <div className="flex items-center gap-8 border-b border-zinc-200 pb-2">
                      <button onClick={decrementQuantity} disabled={quantity <= 1} className="text-zinc-400 hover:text-zinc-950 disabled:opacity-20"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-bold min-w-[1rem] text-center">{quantity}</span>
                      <button onClick={incrementQuantity} disabled={quantity >= product.stock_quantity} className="text-zinc-400 hover:text-zinc-950 disabled:opacity-20"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 py-6 bg-zinc-950 text-white hover:bg-zinc-800 tracking-widest uppercase text-[11px]"
                    >
                      Add To Selection
                    </Button>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={handleToggleFavorite}
                        className={cn(
                          "p-6 border-zinc-200",
                          checkIsFavorite(product.id) ? "text-red-500 border-red-100 bg-red-50" : "text-zinc-950"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", checkIsFavorite(product.id) && "fill-current")} />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="p-6 border-zinc-200 text-zinc-950"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Details sections */}
              <div className="space-y-8 pt-12 border-t border-zinc-100">
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-950">Materials & Care</h3>
                  <p className="text-xs text-zinc-500 leading-loose tracking-wide">
                    Meticulously sourced fabrics combined with expert craftsmanship.
                    Dry clean only to maintain the garment's structural integrity.
                  </p>
                </div>
                {product.long_description && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-950">Manifesto</h3>
                    <p className="text-xs text-zinc-500 leading-loose tracking-wide">
                      {product.long_description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Related - Minimalist Carousel feel */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-40 border-t border-zinc-100 pt-32">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-4">Discovery</span>
                <h2 className="text-3xl font-serif tracking-tight text-zinc-950">You May Also Seek</h2>
              </div>
              <Link href="/products" className="text-[10px] uppercase tracking-widest font-bold border-b border-zinc-950 pb-1">View All</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {product.relatedProducts.map((related: any) => (
                <Link key={related.id} href={`/products/${related.slug}`} className="group">
                  <div className="aspect-[3/4] bg-zinc-50 overflow-hidden mb-6">
                    <img
                      src={related.primary_image || '/placeholder.png'}
                      alt={related.name}
                      className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-serif text-zinc-950 group-hover:text-zinc-500 transition-colors">{related.name}</h3>
                    <span className="text-xs text-zinc-400 font-medium">{formatCurrency(related.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

