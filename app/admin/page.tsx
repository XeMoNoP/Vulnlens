'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Layers,
  FileText,
  Shield,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Product, Order, AuditLog } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'logs'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New product form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('1');
  const [newProdMrp, setNewProdMrp] = useState('200');
  const [newProdPrice, setNewProdPrice] = useState('160');
  const [newProdStock, setNewProdStock] = useState('50');

  useEffect(() => {
    checkAdminAndFetch();
  }, [activeTab]);

  const checkAdminAndFetch = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      if (activeTab === 'products') {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.products || []);
      } else if (activeTab === 'orders') {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/audit-logs');
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      setError('Could not load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName,
          description: newProdDesc,
          category_id: Number(newProdCat),
          mrp: Number(newProdMrp),
          dmart_price: Number(newProdPrice),
          stock: Number(newProdStock),
        }),
      });
      if (res.ok) {
        setSuccess('Product successfully created!');
        setShowAddModal(false);
        checkAdminAndFetch();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create product');
      }
    } catch {
      setError('Error creating product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Product deleted.');
        checkAdminAndFetch();
      }
    } catch {
      setError('Error deleting product.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        setSuccess('Order status updated!');
        checkAdminAndFetch();
      }
    } catch {
      setError('Error updating order');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supervisor Admin Panel</h1>
          <p className="text-xs text-slate-500">
            DMART CyberLab product catalog management, inventory levels, order workflows, and audit trails.
          </p>
        </div>

        <Link
          href="/vulnlens"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Open VulnLens Security Console &rarr;</span>
        </Link>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg mb-6 flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg mb-6 flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 mb-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'products'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Customer Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-b-2 border-emerald-700 text-emerald-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-sm text-slate-900">Manage Catalog & Stock</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">MRP (₹)</th>
                  <th className="p-3">DMART Price (₹)</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">#{p.id}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-500">{p.category_name}</td>
                    <td className="p-3 text-slate-400 line-through">₹{p.mrp.toFixed(2)}</td>
                    <td className="p-3 font-black text-emerald-800">₹{p.dmart_price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        p.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6">
          <h2 className="font-bold text-sm text-slate-900 mb-4">Customer Order Lifecycle</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Pincode</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{o.order_no}</td>
                    <td className="p-3 font-semibold text-slate-700">{o.username}</td>
                    <td className="p-3 font-black text-emerald-800">₹{o.total_amount.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-500">{o.delivery_pincode}</td>
                    <td className="p-3 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6">
          <h2 className="font-bold text-sm text-slate-900 mb-4">System Security Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-slate-600">{l.user_id ? `#${l.user_id}` : 'GUEST'}</td>
                    <td className="p-3 font-bold text-emerald-700">{l.event_type}</td>
                    <td className="p-3 text-slate-800 font-sans">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-slate-900">
            <h3 className="font-bold text-base mb-4">Add Product to Catalog</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Product Title</label>
                <input
                  required
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                  placeholder="e.g. Masoor Dal (1kg)"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                  placeholder="Nutritious pulse..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="1">Rice, Atta & Dals</option>
                    <option value="2">Cooking Oils & Ghee</option>
                    <option value="3">Beverages</option>
                    <option value="4">Snacks & Biscuits</option>
                    <option value="5">Dairy & Packaged Food</option>
                    <option value="6">Personal Care</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">DMART Price (₹)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border rounded font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 text-white rounded font-bold"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
