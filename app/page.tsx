'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Product, Category } from '@/lib/types';

function CatalogContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [q, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      if (q) url.searchParams.set('q', q);
      if (category) url.searchParams.set('category', category);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) return;
    setAddingId(product.id);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        showToast(`Added ${product.name} to your bag!`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Could not add product');
      }
    } catch {
      showToast('Network error adding to cart');
    } finally {
      setAddingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentCategoryObj = categories.find((c) => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner / Promo */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/50 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DMART Daily Super Savers</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Fresh Groceries at Guaranteed Low Prices
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm">
            Save up to 40% on daily staples, premium cooking oils, aromatic basmati rice, and household essentials.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-emerald-950/60 backdrop-blur border border-emerald-600/40 p-4 rounded-xl text-center">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">Use Coupon</span>
            <span className="text-base font-black text-amber-300 tracking-wider font-mono">DMART50</span>
            <span className="text-[10px] text-emerald-300 block">₹50 OFF on orders above ₹500</span>
          </div>
        </div>
      </div>

      {/* Results Header (VULN-002: Safely rendered via React contextual encoding) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {currentCategoryObj ? currentCategoryObj.name : q ? `Search results for "${q}"` : 'All Groceries'}
          </h2>
          <p className="text-xs text-slate-500">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'} available for delivery
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
              <div className="w-full h-44 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 mb-1">No products found</h3>
          <p className="text-xs text-slate-500 mb-4">
            We couldn&apos;t find any grocery items matching your query. Try clearing your filters.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800"
          >
            Clear Filters & View All
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => {
            const savings = p.mrp - p.dmart_price;
            const savingsPercent = Math.round((savings / p.mrp) * 100);

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200/80 hover:border-emerald-500/60 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Card Top */}
                <div className="p-4">
                  {/* Category Pill & Discount Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      {p.category_name}
                    </span>
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {savingsPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <Link href={`/product/${p.id}`} className="block relative w-full h-40 my-2 overflow-hidden rounded-lg bg-slate-50">
                    <Image
                      src={p.image && p.image !== 'placeholder.png' ? `/images/${p.image}` : '/images/basmati_rice.png'}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                    />
                  </Link>

                  {/* Title & Description */}
                  <Link href={`/product/${p.id}`} className="block group-hover:text-emerald-700 transition-colors">
                    <h3 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                    {p.description}
                  </p>
                </div>

                {/* Pricing & Add to Cart Action */}
                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-base md:text-lg font-black text-slate-900">
                      ₹{p.dmart_price.toFixed(2)}
                    </span>
                    {p.mrp > p.dmart_price && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{p.mrp.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock status */}
                  <div className="text-[11px] mb-3">
                    {p.stock > 0 ? (
                      <span className="text-emerald-700 font-semibold">In Stock ({p.stock} units)</span>
                    ) : (
                      <span className="text-red-600 font-bold">Out of Stock</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={p.stock <= 0 || addingId === p.id}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      p.stock <= 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : addingId === p.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{p.stock <= 0 ? 'Out of Stock' : addingId === p.id ? 'Adding...' : 'Add to Bag'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-sm text-slate-500">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
