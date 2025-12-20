'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { formatCurrency, calculateTotal } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import { motion } from 'framer-motion'

export default function CartPage() {
  const router = useRouter()
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal } = useCart()
  const { addToast } = useToast()

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [taxRate, setTaxRate] = useState(18) // Default 18%
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0)
  const [shippingCost, setShippingCost] = useState(200) // Default shipping cost
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch settings (tax rate, shipping threshold, shipping cost)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success && data.data?.settings) {
          const settings = data.data.settings
          setTaxRate(settings.tax_rate?.value || 18)
          setFreeShippingThreshold(settings.free_shipping_threshold?.value || 0)
          setShippingCost(settings.shipping_cost?.value || 200)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Calculate tax based on dynamic rate
  const tax = subtotal * (taxRate / 100)
  // Calculate shipping - free if subtotal >= threshold (and threshold > 0)
  const shipping = (freeShippingThreshold > 0 && subtotal < freeShippingThreshold) ? shippingCost : 0
  const total = calculateTotal(subtotal, tax, shipping, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Your cart is empty', 'error')
      return
    }

    if (!customerInfo.name || !customerInfo.email) {
      addToast('Please fill in your name and email', 'error')
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create order with pending payment status
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          shipping_address: customerInfo.address,
          items: cart.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            product_image: item.product_image,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          tax,
          shipping_cost: shipping,
          payment_method: 'stripe', // Stripe payment
        }),
      })

      const orderData = await orderRes.json()

      if (!orderData.success) {
        addToast(orderData.message || 'Failed to create order', 'error')
        setIsProcessing(false)
        return
      }

      const order = orderData.data

      // Step 2: Create Stripe payment link
      addToast('Order created! Creating payment link...', 'success')

      const paymentRes = await fetch('/api/stripe/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id
        }),
      })

      const paymentData = await paymentRes.json()

      if (!paymentData.success) {
        addToast(paymentData.message || 'Failed to create payment link', 'error')
        setIsProcessing(false)
        return
      }

      // Clear cart before redirecting to payment
      clearCart()

      // Step 3: Redirect to Stripe payment page
      if (paymentData.data.paymentUrl) {
        addToast('Redirecting to Stripe payment...', 'success')
        // Redirect to Stripe payment link
        window.location.href = paymentData.data.paymentUrl
      } else {
        // Fallback: redirect to success page if no payment URL
        addToast('Payment link not available, redirecting...', 'info')
        setTimeout(() => {
          router.push(`/order/success?orderId=${order.id}`)
        }, 1500)
      }

    } catch (error) {
      console.error('Error placing order:', error)
      addToast('Failed to place order', 'error')
      setIsProcessing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-12">
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-6">Archive</span>
              <h2 className="text-4xl md:text-5xl font-serif text-zinc-950 mb-4">Your Selection is Empty</h2>
              <p className="text-zinc-500 text-sm tracking-widest max-w-xs mx-auto leading-relaxed">Seek inspiration in our latest collections and editorial selection.</p>
            </div>
            <Link href="/products">
              <Button className="bg-zinc-950 text-white hover:bg-zinc-800 tracking-widest uppercase text-[11px] px-12 py-6">
                Explore The Selection
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="mb-20">
          <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 block mb-4">Shopping Bag</span>
          <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-zinc-950">Your Selection</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-16">
              {cart.map((item, index) => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group"
                >
                  <div className="flex gap-8 sm:gap-12 pb-12 border-b border-zinc-100 h-full">
                    <div className="w-24 h-32 sm:w-32 sm:h-44 bg-zinc-50 flex-shrink-0 overflow-hidden">
                      <img
                        src={item.product_image || '/placeholder.png'}
                        alt={item.product_name}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                      />
                    </div>

                    <div className="flex-1 flex flex-col pt-2">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-serif tracking-tight text-zinc-950">{item.product_name}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Ref: {item.product_sku}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex items-center gap-6 border-b border-zinc-100 pb-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="text-zinc-400 hover:text-zinc-950 disabled:opacity-20"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold min-w-[1rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                            className="text-zinc-400 hover:text-zinc-950 disabled:opacity-20"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right space-y-1">
                          <span className="text-xs text-zinc-400 block uppercase tracking-widest">Amount</span>
                          <span className="text-sm font-bold text-zinc-950">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-12">
              <Link href="/products" className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400 hover:text-zinc-950 transition-all flex items-center gap-4 group">
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                Seek More Pieces
              </Link>
              <button
                onClick={clearCart}
                className="text-[10px] uppercase tracking-widest font-bold text-zinc-300 hover:text-red-500 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Checkout Column */}
          <div className="lg:col-span-4 space-y-16">
            <div className="space-y-12">
              <div className="space-y-8">
                <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-950">Summary</h2>
                <div className="space-y-6 pb-8 border-b border-zinc-100 text-[11px] uppercase tracking-[0.2em] font-medium">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Service Tax ({taxRate}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                  </div>
                  {freeShippingThreshold > 0 && subtotal < freeShippingThreshold && (
                    <div className="text-[10px] text-zinc-400 mt-1">
                      Add {formatCurrency(freeShippingThreshold - subtotal)} more for free shipping
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-serif text-zinc-950">Grand Total</span>
                  <span className="text-xl font-bold text-zinc-950">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-10 pt-12 border-t border-zinc-100">
                <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-950">Delivery Registry</h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400">Recipient Name</label>
                    <input
                      className="w-full bg-zinc-50 border-none px-4 py-4 text-xs tracking-widest text-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all outline-none"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="FULL NAME"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400">Electronic Mail</label>
                    <input
                      className="w-full bg-zinc-50 border-none px-4 py-4 text-xs tracking-widest text-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all outline-none"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="ADDRESS@STORE.COM"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400">Direct Contact</label>
                    <input
                      className="w-full bg-zinc-50 border-none px-4 py-4 text-xs tracking-widest text-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all outline-none"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="+00 (000) 000-0000"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400">Permanent Address</label>
                    <textarea
                      className="w-full bg-zinc-50 border-none px-4 py-4 text-xs tracking-widest text-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all outline-none min-h-[100px] resize-none"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      placeholder="FULL SHIPPING ADDRESS"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-zinc-100">
                  <Button
                    size="lg"
                    fullWidth
                    className="py-8 bg-zinc-950 text-white hover:bg-zinc-800 tracking-[0.3em] uppercase text-[11px] font-bold"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Validating Registry...' : 'Authorize Payment'}
                  </Button>
                  <div className="flex items-center justify-center gap-6 opacity-30">
                    <span className="text-[9px] uppercase tracking-widest">SSL Encrypted</span>
                    <span className="h-3 w-[1px] bg-zinc-950"></span>
                    <span className="text-[9px] uppercase tracking-widest">Global Flagship Store</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}