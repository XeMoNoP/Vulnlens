'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowRight, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product } from '@/lib/types';

interface CartItemWithProduct {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('DMART50');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
      }
    } catch {
      setError('Failed to fetch cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId: number, newQty: number) => {
    // VULN-006 Client & server parameter bounds
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      if (res.ok) {
        fetchCart();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update quantity');
      }
    } catch {
      alert('Error updating quantity');
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCart();
      }
    } catch {
      alert('Error removing item');
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();

    if (code === 'DMART50') {
      if (subtotal >= 500) {
        setAppliedCoupon('DMART50');
        setDiscount(50);
      } else {
        setCouponError('DMART50 requires a minimum order subtotal of ₹500.');
      }
    } else if (code === 'SAVER100') {
      if (subtotal >= 1000) {
        setAppliedCoupon('SAVER100');
        setDiscount(100);
      } else {
        setCouponError('SAVER100 requires a minimum order subtotal of ₹1000.');
      }
    } else {
      setCouponError('Invalid coupon code.');
    }
  };

  const finalTotal = Math.max(0, subtotal - discount);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading your shopping bag...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Your shopping bag is empty</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
          Explore our wide range of groceries and Indian household staples to start adding items.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-sm transition-all"
        >
          <span>Start Shopping Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-emerald-700" />
        <span>My Shopping Bag ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
      </h1>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const prod = item.product;
            const itemTotal = prod.dmart_price * item.quantity;
            const itemSavings = (prod.mrp - prod.dmart_price) * item.quantity;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                {/* Product info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 bg-slate-50 rounded-lg p-2 shrink-0 border border-slate-100">
                    <Image
                      src={prod.image && prod.image !== 'placeholder.png' ? `/images/${prod.image}` : '/images/basmati_rice.png'}
                      alt={prod.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {prod.category_name}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {prod.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-black text-slate-900">
                        ₹{prod.dmart_price.toFixed(2)}
                      </span>
                      {prod.mrp > prod.dmart_price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prod.mrp.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {itemSavings > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                        You save ₹{itemSavings.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => handleUpdateQty(prod.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-800 bg-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(prod.id, item.quantity + 1)}
                      disabled={item.quantity >= prod.stock}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-sm transition-colors disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-black text-sm text-slate-900 block">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              All transactions in DMART CyberLab are protected by prepared database statements,
              SameSite CSRF safeguards, and transaction rollback handlers.
            </span>
          </div>
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-6">
          {/* Apply Coupon Box */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Apply Promo Coupon</span>
            </h3>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. DMART50"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Apply
              </button>
            </form>
            {appliedCoupon && (
              <p className="text-[11px] font-semibold text-emerald-700 mt-2">
                Coupon &quot;{appliedCoupon}&quot; applied! ₹{discount} discount.
              </p>
            )}
            {couponError && (
              <p className="text-[11px] font-semibold text-red-600 mt-2">
                {couponError}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Bag Subtotal</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Coupon Discount ({appliedCoupon})</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>Delivery Charge</span>
              <span className="font-bold text-emerald-700">FREE</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <div>
                <span className="font-bold text-sm text-slate-900 block">Total Amount</span>
                <span className="text-[10px] text-slate-400">Inclusive of all taxes</span>
              </div>
              <span className="text-xl font-black text-emerald-800">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => router.push(`/checkout?coupon=${encodeURIComponent(appliedCoupon || '')}`)}
              className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
