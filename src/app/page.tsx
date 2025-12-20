'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ShoppingBag, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Product } from '@/types/product'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      subtitle: 'Winter Collection 2024',
      title: 'Timeless\nElegance',
      description: 'Explore our curated selection of high-end essentials designed for the discerning individual.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      cta: 'Shop Collection'
    },
    {
      subtitle: 'The Editorial Series',
      title: 'Modern\nArchetypes',
      description: 'A fusion of artisanal craftsmanship and contemporary silhouettes. Redefining the classics.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?q=80&w=2071&auto=format&fit=crop',
      cta: 'Explore Pieces'
    },
    {
      subtitle: 'Limited Objects',
      title: 'Pure\nSilhouettes',
      description: 'Meticulously sourced fabrics from the world\'s finest mills. Quality that transcends seasons.',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop',
      cta: 'Seek The Core'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  useEffect(() => {
    // Fetch featured products
    fetch('/api/products?is_featured=true&limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeaturedProducts(data.data.products || [])
        }
      })
      .catch(error => console.error('Error fetching products:', error))
      .finally(() => setIsLoading(false))
  }, [])

  const features = [
    {
      title: 'Artisanal Craftsmanship',
      description: 'Each piece is meticulously crafted using time-honored techniques and premium materials.',
    },
    {
      title: 'Ethical Sourcing',
      description: 'We are committed to transparent supply chains and sustainable production methods.',
    },
    {
      title: 'Concierge Service',
      description: 'Personalized styling advice and dedicated support for an effortless experience.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Carousel Section */}
      <section className="relative h-[95vh] flex items-center overflow-hidden bg-zinc-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-zinc-950/20 z-10"></div>
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 12, ease: "linear" }}
              className="w-full h-full bg-cover bg-center grayscale-[0.2]"
              style={{ backgroundImage: `url('${slides[currentSlide].image}')` }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full pt-20">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <span className="text-[10px] uppercase tracking-[0.5em] text-white/60 block mb-8 px-1">
                  {slides[currentSlide].subtitle}
                </span>
                <h1 className="text-6xl md:text-9xl font-serif tracking-tighter text-white mb-10 leading-[0.85] whitespace-pre-line lowercase">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-sm md:text-base text-white/70 mb-14 max-w-md leading-relaxed tracking-widest uppercase">
                  {slides[currentSlide].description}
                </p>
                <Link href="/products" className="inline-block">
                  <button className="group relative flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] font-bold text-white overflow-hidden">
                    <span className="relative z-10">{slides[currentSlide].cta}</span>
                    <div className="h-[1px] w-12 bg-white/30 group-hover:w-20 transition-all duration-500"></div>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-500" />
                  </button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="absolute bottom-12 right-4 sm:right-12 z-30 flex items-center gap-12">
          {/* Pagination Indicators */}
          <div className="flex gap-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="group py-4 px-1"
              >
                <div className={`h-[1px] transition-all duration-700 ${currentSlide === idx ? 'w-12 bg-white' : 'w-4 bg-white/20 group-hover:bg-white/40'}`} />
              </button>
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-4 border-l border-white/10 pl-12 h-12 items-center">
            <button
              onClick={prevSlide}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-6 w-6 stroke-[1px]" />
            </button>
            <button
              onClick={nextSlide}
              className="text-white/40 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center gap-4"
              aria-label="Next Slide"
            >
              Next
              <ChevronRight className="h-6 w-6 stroke-[1px]" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8"
          >
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-4">The Selection</span>
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-zinc-950">Curated Essentials</h2>
            </div>
            <Link href="/products" className="group flex items-center gap-4 text-[11px] uppercase tracking-widest font-bold">
              View All Arrivals
              <div className="h-[1px] w-8 bg-zinc-300 group-hover:w-12 transition-all duration-300"></div>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 3) * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Card noPadding className="border-none shadow-none group">
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 mb-6">
                        <img
                          src={product.primary_image || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4">
                          {product.compare_at_price && (
                            <span className="bg-white px-3 py-1 text-[9px] uppercase tracking-widest font-bold shadow-sm">Sale</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-400">Essential</h3>
                        <h4 className="text-lg font-serif tracking-tight text-zinc-900 group-hover:text-zinc-500 transition-colors">{product.name}</h4>
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
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h3 className="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-950">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed tracking-wide">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Section */}
      <section className="py-32 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative aspect-square lg:aspect-[4/5] overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop"
                alt="Editorial Look"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block">The Manifesto</span>
              <h2 className="text-5xl md:text-6xl font-serif tracking-tight text-zinc-950 leading-[1.1]">Luxury in Every Single Thread</h2>
              <p className="text-zinc-600 leading-relaxed tracking-wide">
                We believe that true luxury lies in simplicity. Our philosophy is rooted in the pursuit of perfection,
                from the initial sketch to the final stitch. Every garment we produce is a testament to our commitment
                to quality and ethical craftsmanship.
              </p>
              <Link href="/about" className="inline-block">
                <Button variant="outline" className="px-12 py-5 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white">
                  Discover Our World
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}