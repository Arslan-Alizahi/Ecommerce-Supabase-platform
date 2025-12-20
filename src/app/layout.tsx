import type { Metadata } from 'next'
import { Inter, Bodoni_Moda } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
})

export const metadata: Metadata = {
  title: 'ZinyasRang | Premium Luxury Fashion',
  description: 'Experience the essence of elegance with ZinyasRang. Curated luxury fashion collections designed for the modern individual.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bodoni.variable}`}>
      <body className={`${inter.className} min-h-screen bg-white text-zinc-900 antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}