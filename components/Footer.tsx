import Link from 'next/link';
import { Shield, Lock, Terminal, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                D
              </div>
              <span className="text-white font-extrabold text-base tracking-tight">DMART CyberLab</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Simulated Indian grocery e-commerce web platform for local OWASP penetration testing,
              security research, and vulnerability remediation analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Storefront</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-400 transition-colors">
                  My Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-emerald-400 transition-colors">
                  Customer Orders
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Member Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* VulnLens Platform */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">VulnLens Security</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/vulnlens" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security Console</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>OWASP Top 10:2025 Auditing</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Credentials Info */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Lab Access Credentials</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400">Customer: </span>
                <code className="text-amber-300 font-mono">customer</code> / <code className="text-amber-300 font-mono">customer123</code>
              </div>
              <div>
                <span className="text-slate-400">Admin: </span>
                <code className="text-amber-300 font-mono">admin</code> / <code className="text-amber-300 font-mono">admin123</code>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 DMART CyberLab & VulnLens. Built for Cybersecurity Education.</p>
          <p className="text-slate-500">Converted to Modern Next.js Fullstack Architecture.</p>
        </div>
      </div>
    </footer>
  );
}
