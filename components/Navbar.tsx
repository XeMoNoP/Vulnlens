'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  ShieldAlert,
  Search,
  User as UserIcon,
  MapPin,
  LogOut,
  Settings,
  ShieldCheck,
  ChevronDown,
  FlaskConical,
} from 'lucide-react';
import { SecurityMode } from '@/lib/types';

interface NavUser {
  id: number;
  username: string;
  role: 'admin' | 'customer';
  avatar?: string;
  pincode?: string;
}

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<NavUser | null>(null);
  const [securityMode, setSecurityMode] = useState<SecurityMode>('SECURE');
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincode, setPincode] = useState('400001');
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.securityMode) setSecurityMode(data.securityMode);
        if (data.user?.pincode) setPincode(data.user.pincode);
      }
    } catch {
      // ignore
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.count || 0);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleMode = async (targetMode: SecurityMode) => {
    setToggling(true);
    try {
      const res = await fetch('/api/vulnlens/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode }),
      });
      if (res.ok) {
        setSecurityMode(targetMode);
        router.refresh();
        window.location.reload();
      }
    } catch {
      alert('Error changing security mode');
    } finally {
      setToggling(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const categories = [
    { name: 'All Products', slug: '' },
    { name: 'Rice, Atta & Dals', slug: 'rice-atta-dals' },
    { name: 'Cooking Oils & Ghee', slug: 'oils-ghee' },
    { name: 'Beverages', slug: 'beverages' },
    { name: 'Snacks & Biscuits', slug: 'snacks-biscuits' },
    { name: 'Dairy & Packaged Food', slug: 'dairy-packaged' },
    { name: 'Personal Care & Household', slug: 'personal-household' },
  ];

  const currentCategory = searchParams.get('category') || '';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Simulation Banner */}
      {securityMode === 'LAB' ? (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              <strong>LAB SIMULATION MODE:</strong> Vulnerabilities are enabled for testing.
            </span>
          </div>
          <button
            onClick={() => handleToggleMode('SECURE')}
            disabled={toggling}
            className="px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-black hover:bg-slate-800 transition-colors"
          >
            {toggling ? 'Switching...' : 'Switch to SECURE Mode'}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950 text-emerald-300 px-4 py-1 text-[11px] font-semibold flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SECURE BASELINE: All security defenses active.</span>
          </div>
          <button
            onClick={() => handleToggleMode('LAB')}
            disabled={toggling}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline"
          >
            <FlaskConical className="w-3 h-3 text-amber-400" />
            <span>{toggling ? 'Switching...' : 'Switch to LAB Mode'}</span>
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
              D
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-emerald-800">DMART</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block leading-none">
                CyberLab
              </span>
            </div>
          </Link>

          {/* Delivery Pincode */}
          <button
            onClick={() => setShowPincodeModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-emerald-500 transition-colors shrink-0"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Deliver to</span>
              <span className="font-bold text-slate-800">{pincode}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groceries..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Admin Management Panel */}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* User Account */}
            {user ? (
              <div className="relative group">
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-500 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span className="max-w-[80px] truncate">{user.username}</span>
                </Link>
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-100 py-1 hidden group-hover:block z-50">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs">
                    <p className="font-bold text-slate-800">{user.username}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role} Account</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    My Orders & Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Supervisor Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 font-extrabold text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          {categories.map((c) => {
            const isActive = currentCategory === c.slug;
            return (
              <Link
                key={c.slug}
                href={c.slug ? `/?category=${c.slug}` : '/'}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pincode Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-slate-800">
            <h3 className="font-bold text-base mb-1">Choose your Delivery Location</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your 6-digit Indian postal code to view localized product availability.
            </p>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 400001"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold tracking-widest text-center focus:ring-2 focus:ring-emerald-600 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPincodeModal(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowPincodeModal(false)}
                className="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                Set Location
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
