'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, ShieldCheck, Check, Star } from 'lucide-react';
import { Product } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const found = (data.products as Product[]).find((p) => p.id === productId);
        setProduct(found || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    setAdding(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (res.ok) {
        setToast(`Added ${quantity} ${product.name} to bag!`);
        setTimeout(() => setToast(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add item');
      }
    } catch {
      alert('Network error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested grocery item does not exist or has been removed.</p>
        <Link href="/" className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg">
          Return to Storefront
        </Link>
      </div>
    );
  }

  const savings = product.mrp - product.dmart_price;
  const savingsPercent = Math.round((savings / product.mrp) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Catalog</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Product Image */}
        <div className="relative w-full h-72 sm:h-96 bg-slate-50 rounded-xl p-4 flex items-center justify-center border border-slate-100">
          <Image
            src={product.image && product.image !== 'placeholder.png' ? `/images/${product.image}` : '/images/basmati_rice.png'}
            alt={product.name}
            fill
            className="object-contain p-4"
          />
        </div>

        {/* Product Details */}
        <div className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {product.category_name}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs font-semibold text-slate-500 ml-1">(5.0 Verified Customer Reviews)</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Pricing */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-emerald-800">
                ₹{product.dmart_price.toFixed(2)}
              </span>
              {product.mrp > product.dmart_price && (
                <span className="text-sm text-slate-400 line-through">
                  MRP: ₹{product.mrp.toFixed(2)}
                </span>
              )}
              {savings > 0 && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {savingsPercent}% OFF
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-xs font-semibold text-emerald-700">
                You Save: ₹{savings.toFixed(2)} per unit
              </p>
            )}
          </div>

          {/* Inventory Stock */}
          <div className="text-xs">
            {product.stock > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>In Stock & Ready for Immediate Dispatch ({product.stock} units available)</span>
              </span>
            ) : (
              <span className="text-red-600 font-bold">Currently Out of Stock</span>
            )}
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold text-sm"
              >
                -
              </button>
              <span className="px-4 py-2 text-xs font-bold text-slate-900 bg-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold text-sm disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className="flex-1 py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{adding ? 'Adding to Bag...' : 'Add to Shopping Bag'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DMART CyberLab Quality Assurance: 100% genuine products with safe packaging.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
