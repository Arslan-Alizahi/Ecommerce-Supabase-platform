'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Heart,
} from 'lucide-react'
import type { SocialMediaLink } from '@/types/social-media'

const iconMap: { [key: string]: any } = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
}

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([])

  useEffect(() => {
    // Fetch social media links
    fetch('/api/social-media?active_only=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSocialLinks(data.data.links || [])
        }
      })
      .catch((error) => console.error('Error fetching social links:', error))
  }, [])

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'Featured', href: '/products?featured=true' },
        { label: 'Categories', href: '/categories' },
        { label: 'New Arrivals', href: '/products?sort=newest' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/policies/returns' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
        { label: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/policies/privacy' },
        { label: 'Terms of Service', href: '/policies/terms' },
        { label: 'Cookie Policy', href: '/policies/cookies' },
        { label: 'Accessibility', href: '/accessibility' },
      ],
    },
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-20">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center mb-6 group">
              <span className="text-3xl font-serif tracking-tight text-white group-hover:text-zinc-400 transition-colors">
                ZinyasRang
              </span>
            </Link>
            <p className="text-zinc-400 mb-8 leading-relaxed text-sm tracking-wide">
              Defining modern elegance through curated luxury fashion. ZinyasRang represents the intersection of timeless silhouettes and contemporary editorial design.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <a
                href="mailto:concierge@zinyasrang.com"
                className="flex items-center text-zinc-400 hover:text-white transition-colors group text-xs tracking-widest uppercase"
              >
                <Mail className="h-3 w-3 mr-4 text-zinc-500" />
                <span>concierge@zinyasrang.com</span>
              </a>
              <div className="flex items-start text-zinc-400 text-xs tracking-widest uppercase py-2">
                <MapPin className="h-3 w-3 mr-4 text-zinc-500 mt-1 flex-shrink-0" />
                <span>Global Flagship Store<br />Editorial District, NY</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-zinc-400 hover:text-white transition-colors text-sm inline-block hover:translate-x-1 duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-zinc-800"
        >
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-serif mb-4">The Editorial List</h3>
            <p className="text-zinc-400 mb-8 text-xs uppercase tracking-widest">
              Join for exclusive collection previews and editorial updates
            </p>
            <div className="flex flex-col sm:flex-row gap-0 border border-zinc-800 overflow-hidden">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="flex-1 px-6 py-4 bg-transparent text-white placeholder-zinc-500 text-[10px] tracking-widest uppercase focus:outline-none"
              />
              <button className="px-10 py-4 bg-white text-zinc-950 text-[10px] tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-8 lg:space-y-0 text-zinc-400 text-[10px] tracking-widest uppercase">
            {/* Copyright */}
            <div className="flex flex-col items-center lg:items-start space-y-2">
              <p>© {new Date().getFullYear()} ZinyasRang. All rights reserved.</p>
              <p className="text-zinc-500">Curated with excellence in New York</p>
            </div>

            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-8">
                {socialLinks.map((link) => {
                  const IconComponent = iconMap[link.icon.toLowerCase()] || ShoppingBag
                  return (
                    <Link
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      <span className="sr-only">{link.platform}</span>
                      <IconComponent className="h-4 w-4" strokeWidth={1.5} />
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Payment Methods */}
            <div className="flex items-center space-x-6 text-zinc-500">
              {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map((method) => (
                <span key={method}>{method}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-10 right-10 p-3 border border-zinc-200 bg-white/80 backdrop-blur-md text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all duration-500 z-50 group shadow-luxury"
        aria-label="Scroll to top"
      >
        <svg
          className="h-5 w-5 transform group-hover:-translate-y-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </footer>
  )
}
