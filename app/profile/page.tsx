'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Package, Download, AlertCircle } from 'lucide-react';
import { Order } from '@/lib/types';

interface ProfileData {
  id: number;
  username: string;
  role: string;
  avatar?: string;
  pincode?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const fetchProfileAndOrders = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login?redirect=profile');
        return;
      }
      const meData = await meRes.json();
      if (!meData.user) {
        router.push('/login?redirect=profile');
        return;
      }
      setProfile(meData.user);

      const ordRes = await fetch('/api/orders');
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }
    } catch {
      setError('Could not load profile details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading member profile and orders...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Profile & Bag History</h1>
          <p className="text-xs text-slate-500">
            Manage your account credentials, view order records, and download text invoices.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl uppercase">
                {profile?.username.slice(0, 2)}
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">{profile?.username}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {profile?.role} Account
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account ID</span>
                </span>
                <span className="font-mono font-bold text-slate-800">#{profile?.id}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Pincode</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{profile?.pincode || '400001'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Orders History */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <span>Order History ({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No orders placed yet. Add items to your bag to experience safe checkout!
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {ord.order_no}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Placed on {new Date(ord.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-emerald-800">
                      ₹{ord.total_amount.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      ord.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {ord.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-slate-700">
                      <span>{item.product_name} &times; {item.quantity}</span>
                      <span className="font-medium text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer with Invoice download (VULN-003 IDOR-protected) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="truncate max-w-sm">
                    Deliver to: {ord.delivery_address}
                  </span>

                  <a
                    href={`/api/invoices/${ord.order_no}`}
                    download={`Invoice_${ord.order_no}.txt`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Invoice</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
