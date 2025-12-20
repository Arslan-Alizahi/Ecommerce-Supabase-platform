'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { AdminAuth } from '@/components/ui/AdminAuth'
import { useToast } from '@/components/ui/Toast'
import {
  ArrowLeft, Settings, Percent, DollarSign,
  Store, Package, Truck, Save, RefreshCw
} from 'lucide-react'

interface StoreSetting {
  value: any
  type: string
  description: string
  updated_at: string
}

interface SettingsData {
  tax_rate?: StoreSetting
  currency_symbol?: StoreSetting
  store_name?: StoreSetting
  low_stock_threshold?: StoreSetting
  free_shipping_threshold?: StoreSetting
  shipping_cost?: StoreSetting
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    tax_rate: '',
    currency_symbol: '',
    store_name: '',
    low_stock_threshold: '',
    free_shipping_threshold: '',
    shipping_cost: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings')
      const data = await res.json()

      if (data.success) {
        setSettings(data.data.settings)
        setFormData({
          tax_rate: data.data.settings.tax_rate?.value?.toString() || '18',
          currency_symbol: data.data.settings.currency_symbol?.value || 'Rs. ',
          store_name: data.data.settings.store_name?.value || 'ZinyasRang',
          low_stock_threshold: data.data.settings.low_stock_threshold?.value?.toString() || '5',
          free_shipping_threshold: data.data.settings.free_shipping_threshold?.value?.toString() || '0',
          shipping_cost: data.data.settings.shipping_cost?.value?.toString() || '200',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      addToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      const data = await res.json()

      if (data.success) {
        addToast(`${key.replace('_', ' ')} updated successfully`, 'success')
        fetchSettings() // Refresh settings
      } else {
        addToast(data.error || 'Failed to update setting', 'error')
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      addToast('Failed to save setting', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)

      // Save all settings and check responses
      const results = await Promise.all(
        Object.entries(formData).map(async ([key, value]) => {
          const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          })
          const data = await res.json()
          return { key, success: data.success, error: data.error }
        })
      )

      const failed = results.filter(r => !r.success)

      if (failed.length > 0) {
        console.error('Failed to save some settings:', failed)
        addToast(`Failed to save: ${failed.map(f => f.key).join(', ')}. ${failed[0]?.error || ''}`, 'error')
      } else {
        addToast('All settings saved successfully', 'success')
      }

      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      addToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminAuth>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </AdminAuth>
    )
  }

  return (
    <AdminAuth>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="h-8 w-8" />
                  Store Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure your store settings including tax rate, currency, and more
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={saving}
                leftIcon={saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>

          {/* Tax Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary-600" />
                Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    This tax rate will be applied to all customer orders. For example, enter 18 for 18% tax.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        placeholder="Enter tax rate"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleSave('tax_rate', formData.tax_rate)}
                      disabled={saving}
                    >
                      Update Tax
                    </Button>
                  </div>
                  {settings.tax_rate?.updated_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last updated: {new Date(settings.tax_rate.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">How Tax is Applied</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>Tax is calculated on the subtotal of items in the cart</li>
                    <li>Formula: Tax Amount = Subtotal x (Tax Rate / 100)</li>
                    <li>Example: If subtotal is Rs. 1,000 and tax rate is {formData.tax_rate || 18}%, tax will be Rs. {(1000 * (parseFloat(formData.tax_rate) || 18) / 100).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary-600" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <Input
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="Enter store name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Symbol
                  </label>
                  <Input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                    placeholder="e.g., Rs. or $"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                Inventory Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Products with stock below this number will show a low stock warning
                </p>
                <Input
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  placeholder="Enter threshold"
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-600" />
                Shipping Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    The shipping cost charged when order is below free shipping threshold.
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.currency_symbol || 'Rs. '}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                      placeholder="Enter shipping cost"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Orders above this amount qualify for free shipping. Set to 0 for always free shipping.
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.currency_symbol || 'Rs. '}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={formData.free_shipping_threshold}
                      onChange={(e) => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                      placeholder="Enter amount"
                      className="pl-12"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">How Shipping Works</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>If Free Shipping Threshold = 0, shipping is always FREE</li>
                    <li>If order subtotal &lt; threshold, shipping cost of {formData.currency_symbol}{formData.shipping_cost || '200'} applies</li>
                    <li>If order subtotal &gt;= threshold, shipping is FREE</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Tax Preview */}
          <Card className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-600" />
                Current Tax Rate Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-primary-600">{formData.tax_rate || 0}%</p>
                  <p className="text-sm text-gray-500">Tax Rate</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-gray-900">Rs. 1,000</p>
                  <p className="text-sm text-gray-500">Sample Subtotal</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-orange-600">
                    Rs. {(1000 * (parseFloat(formData.tax_rate) || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Tax Amount</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-green-600">
                    Rs. {(1000 + 1000 * (parseFloat(formData.tax_rate) || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminAuth>
  )
}
