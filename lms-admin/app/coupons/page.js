'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Tag, Plus, Trash2, Edit3, CheckCircle2, XCircle, Sparkles,
  Calendar, Percent, DollarSign, Copy, Check, Search, Filter,
  Layers, Clock, AlertCircle, RefreshCw, ChevronRight, BookOpen
} from 'lucide-react';

export default function CouponsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive | expired
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 500,
    minOrderAmount: 0,
    expiresAt: '',
    maxUses: '',
    applicableTo: 'all',
    courses: [],
    isActive: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      const list = Array.isArray(res.data) ? res.data : (res.data?.coupons || []);
      setCoupons(list);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses?all=true');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses for coupon selector:', err);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadCourses();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const prefixes = ['LEARN', 'SAVE', 'FLASH', 'SKILL', 'PROMO', 'BOOST'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 80);
    setFormData(prev => ({ ...prev, code: `${prefix}${num}` }));
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscountAmount: 500,
      minOrderAmount: 0,
      expiresAt: '',
      maxUses: '',
      applicableTo: 'all',
      courses: [],
      isActive: true,
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    let expFormatted = '';
    if (coupon.expiresAt) {
      const d = new Date(coupon.expiresAt);
      expFormatted = d.toISOString().split('T')[0];
    }

    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      minOrderAmount: coupon.minOrderAmount || 0,
      expiresAt: expFormatted,
      maxUses: coupon.maxUses || '',
      applicableTo: coupon.applicableTo || 'all',
      courses: coupon.courses?.map(c => typeof c === 'object' ? c._id : c) || [],
      isActive: coupon.isActive ?? true,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const updatedStatus = !coupon.isActive;
      await api.put(`/coupons/${coupon._id}`, { isActive: updatedStatus });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: updatedStatus } : c));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');

    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      };

      if (!payload.code) {
        throw new Error('Coupon code is required');
      }
      if (payload.discountValue <= 0) {
        throw new Error('Discount value must be greater than 0');
      }

      if (editingCoupon) {
        const res = await api.put(`/coupons/${editingCoupon._id}`, payload);
        const updated = res.data?.coupon || res.data;
        setCoupons(prev => prev.map(c => c._id === editingCoupon._id ? updated : c));
      } else {
        const res = await api.post('/coupons', payload);
        const created = res.data?.coupon || res.data;
        setCoupons(prev => [created, ...prev]);
      }

      setShowModal(false);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  // Filter coupons
  const now = new Date();
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const isExpired = c.expiresAt && new Date(c.expiresAt) < now;

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.isActive && !isExpired;
    if (statusFilter === 'inactive') return !c.isActive;
    if (statusFilter === 'expired') return isExpired;
    return true;
  });

  // Calculate high-level stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= now)).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const avgDiscount = coupons.length > 0
    ? Math.round(coupons.reduce((sum, c) => sum + (c.discountType === 'percentage' ? c.discountValue : 0), 0) / (coupons.filter(c => c.discountType === 'percentage').length || 1))
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${isAdmin ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Tag className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Coupons & Offers Management
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Create discount promotional campaigns, set cart minimums, and track student redemptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCoupons}
            className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            title="Refresh coupons"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 ${
              isAdmin
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Coupons</span>
            <Tag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCoupons}</div>
          <div className="text-xs text-slate-500 mt-1">Configured promo codes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Codes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCoupons}</div>
          <div className="text-xs text-slate-500 mt-1">Available for student checkout</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Redemptions</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalRedemptions}</div>
          <div className="text-xs text-slate-500 mt-1">Lifetime orders used</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg % Discount</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{avgDiscount}%</div>
          <div className="text-xs text-slate-500 mt-1">Across percentage coupons</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'All Coupons' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
            { id: 'expired', label: 'Expired' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? isAdmin ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Coupons Table / Grid */}
      {loading ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading coupon repository...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No coupons found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {searchTerm || statusFilter !== 'all'
              ? 'Try modifying your search or status filter criteria.'
              : 'Create your first promotional discount coupon to boost cart conversions.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Promo Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Scope</th>
                  <th className="px-5 py-3.5">Conditions</th>
                  <th className="px-5 py-3.5">Redemptions</th>
                  <th className="px-5 py-3.5">Expiration</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
                  const isEffectiveActive = coupon.isActive && !isExpired;

                  return (
                    <tr key={coupon._id} className="hover:bg-slate-800/40 transition">
                      {/* Code Badge */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="text-slate-500 hover:text-white transition p-1 rounded"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xs">
                            {coupon.description}
                          </div>
                        )}
                      </td>

                      {/* Discount Amount */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT`}
                        </div>
                        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                          <div className="text-[10px] text-slate-400">
                            Cap: ₹{coupon.maxDiscountAmount} max
                          </div>
                        )}
                      </td>

                      {/* Scope */}
                      <td className="px-5 py-4">
                        {coupon.applicableTo === 'all' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-semibold bg-slate-800 px-2 py-0.5 rounded-md">
                            All Courses
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-md">
                            <BookOpen className="w-3 h-3" />
                            {coupon.courses?.length || 0} Courses
                          </span>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="px-5 py-4">
                        <div className="text-slate-300">
                          {coupon.minOrderAmount > 0 ? `Min ₹${coupon.minOrderAmount}` : 'No minimum'}
                        </div>
                        {coupon.maxUses && (
                          <div className="text-[10px] text-slate-500">
                            Limit: {coupon.maxUses} total uses
                          </div>
                        )}
                      </td>

                      {/* Redemptions Progress */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{coupon.usedCount || 0}</span>
                          {coupon.maxUses && (
                            <span className="text-slate-500">/ {coupon.maxUses}</span>
                          )}
                        </div>
                        {coupon.maxUses && (
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((coupon.usedCount || 0) / coupon.maxUses) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-400' : 'text-slate-400'}`} />
                            <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}>
                              {new Date(coupon.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Never</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            coupon.isActive ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                          title={`Click to ${coupon.isActive ? 'Deactivate' : 'Activate'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              coupon.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <div className="text-[10px] mt-0.5 font-bold">
                          {isExpired ? (
                            <span className="text-red-400">Expired</span>
                          ) : coupon.isActive ? (
                            <span className="text-emerald-400">Active</span>
                          ) : (
                            <span className="text-slate-500">Disabled</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">
                  {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : 'Create Promotional Coupon'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCoupon} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Promo Code & Generator */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Coupon Code <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Description / Marketing Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% discount for introductory launch"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}{' '}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? 100 : 100000}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Max Cap (if percentage) & Min Order Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Max Discount Cap (₹)
                    <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500 (0 for no cap)"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    disabled={formData.discountType !== 'percentage'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 299"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Expiry Date & Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Expiry Date
                    <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Max Usage Limit
                    <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 redemptions"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Applicable Courses</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      formData.applicableTo === 'all'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicableTo"
                      value="all"
                      checked={formData.applicableTo === 'all'}
                      onChange={() => setFormData({ ...formData, applicableTo: 'all' })}
                      className="hidden"
                    />
                    <span className="font-bold">All Courses (Sitewide)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      formData.applicableTo === 'specific'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicableTo"
                      value="specific"
                      checked={formData.applicableTo === 'specific'}
                      onChange={() => setFormData({ ...formData, applicableTo: 'specific' })}
                      className="hidden"
                    />
                    <span className="font-bold">Specific Courses Only</span>
                  </label>
                </div>

                {formData.applicableTo === 'specific' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                    {courses.map((course) => {
                      const isSelected = formData.courses.includes(course._id);
                      return (
                        <label
                          key={course._id}
                          className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-1"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, courses: [...formData.courses, course._id] });
                              } else {
                                setFormData({
                                  ...formData,
                                  courses: formData.courses.filter(id => id !== course._id),
                                });
                              }
                            }}
                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="truncate">{course.title}</span>
                          <span className="text-slate-500 text-[10px] ml-auto">₹{course.price}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-bold text-white">Enable Coupon Immediately</div>
                  <div className="text-[10px] text-slate-400">Make this coupon available for checkout right away</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
