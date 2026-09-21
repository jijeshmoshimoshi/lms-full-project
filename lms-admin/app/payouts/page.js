'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, ShieldCheck, AlertTriangle, CheckCircle2, Clock, 
  Building, RefreshCw, ChevronRight, HelpCircle, ArrowUpRight, 
  Banknote, Sparkles, Lock, FileText, Check, TrendingUp, DollarSign,
  Layers, Filter, Users, ArrowDownRight, Tag, BookOpen, Search,
  RotateCcw, Shield, Award, CheckCircle
} from 'lucide-react';

export default function PayoutsPage() {
  const { user } = useAuth();

  if (!user) return <p className="p-8 text-center text-slate-500">Please log in to manage payouts.</p>;

  return user.role === 'admin' 
    ? <AdminFinancialsDashboard /> 
    : <InstructorPayoutsDashboard user={user} />;
}

/* =========================================================================
   1. ADMIN PLATFORM FINANCIALS, SETTLEMENTS & REFUND CENTER
   ========================================================================= */
function AdminFinancialsDashboard() {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'instructors'
  const [earningsData, setEarningsData] = useState(null);
  const [instructorsData, setInstructorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Refund Modal State
  const [refundTx, setRefundTx] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [alertNotice, setAlertNotice] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      const [earningsRes, instRes] = await Promise.all([
        api.get('/payments/instructor/earnings?all=true'),
        api.get('/admin/instructors-overview'),
      ]);
      setEarningsData(earningsRes.data || null);
      setInstructorsData(instRes.data || []);
    } catch (err) {
      console.error('Failed to load admin financials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundTx) return;

    setRefunding(true);
    setAlertNotice({ type: '', text: '' });
    try {
      const res = await api.post('/payments/refund', {
        transactionId: refundTx.id,
        reason: refundReason.trim() || 'Admin initiated refund',
      });

      setAlertNotice({
        type: 'success',
        text: res.data.message || 'Refund issued successfully and student access revoked.',
      });
      setRefundTx(null);
      setRefundReason('');
      await loadData();
    } catch (err) {
      setAlertNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to process refund',
      });
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Aggregating platform financial ledger...</p>
      </div>
    );
  }

  const summary = earningsData?.summary || {
    grossSales: 0,
    netInstructorEarnings: 0,
    platformFeesPaid: 0,
    gatewayFeesTotal: 0,
    settledEarnings: 0,
    pendingSettlement: 0,
    refundedCount: 0,
    totalSalesCount: 0,
  };

  const transactions = earningsData?.transactions || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter !== 'all' && tx.status !== txFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.courseTitle?.toLowerCase().includes(q) ||
        tx.studentName?.toLowerCase().includes(q) ||
        tx.studentEmail?.toLowerCase().includes(q) ||
        tx.instructorName?.toLowerCase().includes(q) ||
        tx.orderId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Super Admin Top Financial Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Platform Financial Treasury</span>
              <span className="text-slate-400">• Multi-Vendor Settlements</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Platform Financials & Revenue</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Consolidated Gross Merchandise Volume (GMV), 30% platform commission retained, Razorpay Route creator disbursements, and refund administration.
            </p>
          </div>

          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing Ledger...' : 'Sync Financials'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {alertNotice.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn shadow-xs ${
          alertNotice.type === 'error' 
            ? 'bg-rose-50 border border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {alertNotice.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{alertNotice.text}</span>
        </div>
      )}

      {/* 4 Financial Master KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gross GMV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Platform Sales</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">
              ₹{summary.grossSales.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Gross Marketplace GMV</span>
              <span className="text-emerald-600 font-semibold">{summary.totalSalesCount} Orders</span>
            </div>
          </div>
        </div>

        {/* Platform 30% Commission */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-indigo-500">Platform Commission (30%)</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-600">
              ₹{summary.platformFeesPaid.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Retained platform profit
            </p>
          </div>
        </div>

        {/* Creator Settlements (70%) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Instructor Share (70%)</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600">
              ₹{summary.netInstructorEarnings.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Settled: ₹{summary.settledEarnings.toLocaleString('en-IN')}</span>
              <span className="text-amber-600 font-semibold">Pending: ₹{summary.pendingSettlement.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Gateway & Refunds */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Gateway Fees & Refunds</span>
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">
              {summary.refundedCount}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Refunded Orders</span>
              <span className="text-slate-400">Fee: ₹{summary.gatewayFeesTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Platform Transaction Ledger ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('instructors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'instructors'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Instructor Payout Accounts Directory ({instructorsData.length})</span>
        </button>
      </div>

      {activeTab === 'ledger' ? (
        /* TAB 1: Platform Master Transaction Ledger */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Immutable Platform Financial Ledger</h3>
              <p className="text-xs text-slate-500">Every student checkout with automated 70/30 Route linked account split</p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, instructor, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-60"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {['all', 'paid', 'settled', 'refunded'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                      txFilter === f
                        ? 'bg-white text-indigo-600 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No transactions match criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Learner</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Gross Paid</th>
                    <th className="px-6 py-4">Platform (30%)</th>
                    <th className="px-6 py-4">Instructor (70%)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                        {t.courseTitle}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{t.studentName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{t.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{t.instructorName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{t.instructorEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{t.amountPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-indigo-600">
                        ₹{t.platformCut.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-emerald-600">
                        ₹{t.instructorCut.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'settled' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : t.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'refunded'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                        {t.refundReason && (
                          <span className="text-[10px] text-rose-500 block mt-0.5 max-w-[120px] truncate" title={t.refundReason}>
                            {t.refundReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.status !== 'refunded' ? (
                          <button
                            onClick={() => {
                              setRefundTx(t);
                              setRefundReason('');
                            }}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Issue Refund
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Instructor Payout Accounts Registry */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Instructor Razorpay Route Accounts</h3>
              <p className="text-xs text-slate-500">KYC verification status, bank linked details, and revenue distribution schedules</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {instructorsData.length} Instructors
            </span>
          </div>

          {instructorsData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No registered instructors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">KYC Payout Status</th>
                    <th className="px-6 py-4">Route Account ID</th>
                    <th className="px-6 py-4">Bank Details</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4">Total Earnings</th>
                    <th className="px-6 py-4">Clawbacks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instructorsData.map((inst) => (
                    <tr key={inst._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{inst.name}</span>
                          {inst.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Instructor" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{inst.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inst.payoutStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inst.payoutStatus === 'pending_kyc'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {inst.payoutStatus === 'active' ? 'Active' : inst.payoutStatus === 'pending_kyc' ? 'Pending KYC' : 'Not Onboarded'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                        {inst.razorpayAccountId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-[11px]">
                        {inst.payoutDetails?.accountNumberLast4 ? (
                          <div>
                            <span className="font-mono text-slate-800 font-semibold block">
                              •••• {inst.payoutDetails.accountNumberLast4} ({inst.payoutDetails.ifsc})
                            </span>
                            <span className="text-[10px] text-slate-400 block">{inst.payoutDetails.beneficiaryName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No Bank Linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 capitalize">
                        {inst.payoutSchedule || 'Weekly'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-emerald-600 block">
                          ₹{(inst.totalEarnings || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{inst.salesCount || 0} sales</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-600">
                        ₹{(inst.unsettledClawbackAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin Refund Confirmation Modal */}
      {refundTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <RotateCcw className="w-5 h-5" />
                <span>Issue Student Refund</span>
              </div>
              <button
                onClick={() => setRefundTx(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1 leading-relaxed">
              <p className="font-bold">Caution: This action cannot be undone.</p>
              <p>
                Issuing a refund will:
                <br />• Revoke the student's access to <strong>{refundTx.courseTitle}</strong>
                <br />• Reverse Razorpay Route transfer or record a clawback against <strong>{refundTx.instructorName}</strong>
                <br />• Refund <strong>₹{refundTx.amountPaid.toLocaleString('en-IN')}</strong> to the learner's payment method
              </p>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Refund *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Student requested cancellation / Course content discrepancy"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTx(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {refunding ? 'Processing Refund...' : 'Confirm Full Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================================================================
   2. INSTRUCTOR PERSONAL PAYOUTS & BANK KYC HUB
   ========================================================================= */
function InstructorPayoutsDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings' | 'kyc'
  const [accountStatus, setAccountStatus] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [txFilter, setTxFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessType: 'individual',
    beneficiaryName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    pan: '',
    payoutSchedule: 'weekly',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, earningsRes] = await Promise.all([
        api.get('/payments/account-status'),
        api.get('/payments/instructor/earnings'),
      ]);

      setAccountStatus(statusRes.data);
      setEarningsData(earningsRes.data);

      if (statusRes.data.payoutDetails) {
        setForm((prev) => ({
          ...prev,
          businessName: statusRes.data.payoutDetails.businessName || '',
          businessType: statusRes.data.payoutDetails.businessType || 'individual',
          beneficiaryName: statusRes.data.payoutDetails.beneficiaryName || '',
          ifsc: statusRes.data.payoutDetails.ifsc || '',
          pan: statusRes.data.payoutDetails.pan || '',
          payoutSchedule: statusRes.data.payoutSchedule || 'weekly',
        }));
      }
    } catch (err) {
      console.error('Failed to load payout data:', err);
      setError(err.response?.data?.message || 'Failed to fetch payout records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (form.accountNumber !== form.confirmAccountNumber) {
      setError('Bank Account Number and Confirm Account Number do not match');
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(form.pan.trim())) {
      setError('Invalid PAN format. Must be a valid 10-character Indian PAN (e.g. ABCDE1234F)');
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(form.ifsc.trim())) {
      setError('Invalid IFSC format. Expected standard 11-character code (e.g. HDFC0001234)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        beneficiaryName: form.beneficiaryName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifsc: form.ifsc.trim().toUpperCase(),
        pan: form.pan.trim().toUpperCase(),
        payoutSchedule: form.payoutSchedule,
      };

      const res = await api.post('/payments/onboard-account', payload);
      setSuccessMsg(res.data.message || 'Onboarding completed successfully!');
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete Razorpay Route onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleChange = async (schedule) => {
    setUpdatingSchedule(true);
    setError('');
    try {
      await api.put('/payments/payout-schedule', { payoutSchedule: schedule });
      setAccountStatus((prev) => ({ ...prev, payoutSchedule: schedule }));
      setSuccessMsg(`Payout schedule updated to ${schedule}`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const isConnected = accountStatus?.payoutStatus === 'active';
  const isPendingKYC = accountStatus?.payoutStatus === 'pending_kyc';
  const summary = earningsData?.summary || {
    grossSales: 0,
    netInstructorEarnings: 0,
    platformFeesPaid: 0,
    gatewayFeesTotal: 0,
    pendingSettlement: 0,
    settledEarnings: 0,
    unsettledClawbacks: 0,
    netPayable: 0,
    totalSalesCount: 0,
    refundedCount: 0,
  };

  const transactions = earningsData?.transactions || [];
  const courseBreakdown = earningsData?.courseBreakdown || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter !== 'all' && tx.status !== txFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.courseTitle?.toLowerCase().includes(q) ||
        tx.studentName?.toLowerCase().includes(q) ||
        tx.studentEmail?.toLowerCase().includes(q) ||
        tx.orderId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      
      {/* Top Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Razorpay Route Partner</span>
              <span className="text-slate-400">• Automated 70% Split</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Earnings & Route Settlements</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Track course revenues, incoming bank account disbursements, and individual offering performance.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {isConnected ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Active Route Account</span>
              </div>
            ) : isPendingKYC ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>KYC Under Review</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('kyc');
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Connect Razorpay Route Account</span>
              </button>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Settlements</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'earnings'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Earnings & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Bank & KYC Settings</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'earnings' ? (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Your Earnings</span>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">
                  ₹{summary.netInstructorEarnings.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Gross: ₹{summary.grossSales.toLocaleString('en-IN')}</span>
                  <span className="text-emerald-600 font-semibold">{summary.totalSalesCount} Sales</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Settled to Bank</span>
              <div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  ₹{summary.settledEarnings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-1">Direct Route Bank Settlements</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Pending Settlement</span>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">
                  ₹{summary.pendingSettlement.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-1 capitalize">Schedule: {earningsData?.payoutSchedule || 'Weekly'}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Clawbacks</span>
              <div>
                <div className={`text-3xl font-extrabold ${summary.unsettledClawbacks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  ₹{summary.unsettledClawbacks.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-1">{summary.unsettledClawbacks > 0 ? 'Deducted from sales' : 'No outstanding clawbacks'}</p>
              </div>
            </div>
          </div>

          {/* Per-Course Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Course Revenue Breakdown</h3>
                <p className="text-xs text-slate-500">Sales and revenue share generated by each course</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {courseBreakdown.length} Courses with Sales
              </span>
            </div>

            {courseBreakdown.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No course transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Course Title</th>
                      <th className="px-6 py-4">Enrolled Sales</th>
                      <th className="px-6 py-4">Gross Revenue</th>
                      <th className="px-6 py-4">Your Cut (70%)</th>
                      <th className="px-6 py-4">Platform Cut (30%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseBreakdown.map((c) => (
                      <tr key={c.courseId} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-sm truncate">{c.title}</td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">{c.salesCount} learners</td>
                        <td className="px-6 py-4 font-bold text-slate-900">₹{c.grossRevenue.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-extrabold text-emerald-600">₹{c.instructorCut.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-500">₹{c.platformCut.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Bank & KYC Settings */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bank & KYC Verification Details</h2>
                <p className="text-xs text-slate-500">Government compliance and payout destination credentials</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                {isConnected ? 'Update Details' : 'Complete KYC'}
              </button>
            </div>

            {isConnected || accountStatus?.payoutDetails?.accountNumberLast4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Beneficiary Name</span>
                  <p className="text-sm font-bold text-slate-800">{accountStatus?.payoutDetails?.beneficiaryName || user.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Business Type</span>
                  <p className="text-sm font-bold text-slate-800 capitalize">{accountStatus?.payoutDetails?.businessType || 'Individual'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Bank Account</span>
                  <p className="text-sm font-mono font-bold text-slate-800">
                    •••• •••• •••• {accountStatus?.payoutDetails?.accountNumberLast4 || '****'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">IFSC Code</span>
                  <p className="text-sm font-mono font-bold text-slate-800">{accountStatus?.payoutDetails?.ifsc || 'N/A'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">PAN Card</span>
                  <p className="text-sm font-mono font-bold text-slate-800">{accountStatus?.payoutDetails?.pan || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Bank Account Connected</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You cannot publish paid courses or receive revenue payouts until your bank account and PAN details are onboarded with Razorpay Route.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Onboard Payout Account Now</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Settlement Schedule</h2>
            <div className="space-y-2.5">
              {[
                { id: 'daily', title: 'Daily Settlements', desc: 'Settles verified earnings every business day' },
                { id: 'weekly', title: 'Weekly Settlements (Recommended)', desc: 'Consolidated transfer every Monday' },
                { id: 'monthly', title: 'Monthly Settlements', desc: 'Transfers accumulated earnings on 1st of month' },
              ].map((sch) => {
                const isSelected = (accountStatus?.payoutSchedule || 'weekly') === sch.id;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    disabled={updatingSchedule || !isConnected}
                    onClick={() => handleScheduleChange(sch.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    } disabled:opacity-60 cursor-pointer`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{sch.title}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">{sch.desc}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding KYC Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Razorpay Route Account Onboarding</h3>
                <p className="text-xs text-slate-500">Enter your banking and PAN details to activate revenue splits</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full name matching your bank account"
                  value={form.beneficiaryName}
                  onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Type *</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="individual">Individual / Freelancer</option>
                    <option value="proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="private_limited">Private Limited Company</option>
                    <option value="llp">LLP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Card Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={form.pan}
                    onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Account Number *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter full account number"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Re-enter bank account number"
                    value={form.confirmAccountNumber}
                    onChange={(e) => setForm({ ...form, confirmAccountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="e.g. HDFC0001234"
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Save & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
