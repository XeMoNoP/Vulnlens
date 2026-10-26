'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowLeft, Download, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order } from '@/lib/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponParam = searchParams.get('coupon') || '';

  const [address, setAddress] = useState('Flat 402, Green Valley Apartments, Andheri West, Mumbai');
  const [pincode, setPincode] = useState('400001');
  const [couponCode, setCouponCode] = useState(couponParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me').then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (!data.user) {
          router.push('/login?redirect=checkout');
        } else if (data.user.pincode) {
          setPincode(data.user.pincode);
        }
      }
    });
  }, [router]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Pincode must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          pincode: pincode.trim(),
          couponCode: couponCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlacedOrder(data.order);
      } else {
        setError(data.error || 'Checkout failed. Please try again.');
      }
    } catch {
      setError('Network communication error during checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
          Order Successfully Placed
        </span>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Thank you for your order!
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Order reference: <span className="font-mono font-bold text-slate-800">{placedOrder.order_no}</span>
        </p>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-left mb-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</p>
              <p className="text-lg font-black text-emerald-800">₹{placedOrder.total_amount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
              <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                {placedOrder.status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Address</p>
            <p className="text-xs text-slate-800 font-medium">{placedOrder.delivery_address} (Pincode: {placedOrder.delivery_pincode})</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Purchased Items</p>
            <div className="space-y-1.5">
              {placedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-700">
                  <span>{item.product_name} &times; {item.quantity}</span>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/api/invoices/${placedOrder.order_no}`}
            download={`Invoice_${placedOrder.order_no}.txt`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Invoice (.txt)</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Cart</span>
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Delivery Address & Checkout</h1>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Full Street Address *
          </label>
          <textarea
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            placeholder="House/Flat No., Apartment, Street, Locality, City"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Postal Pincode (6 digits) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="e.g. 400001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Applied Coupon Code
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="e.g. DMART50"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payment Mode: Cash on Delivery / UPI on Delivery (Simulated CyberLab Transaction).</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? 'Processing Transaction...' : 'Confirm & Place Order'}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-sm text-slate-500">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
