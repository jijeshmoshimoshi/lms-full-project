'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import CertificateModal from '../../components/CertificateModal';
import { 
  Award, Search, ShieldCheck, CheckCircle2, Clock, XCircle, 
  RefreshCw, Download, ExternalLink, Trash2, AlertTriangle, Eye, 
  BookOpen, Users, Copy, Check, Filter, Sparkles, UserX, UserCheck
} from 'lucide-react';

export default function CertificatesManagementPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [metrics, setMetrics] = useState({ totalIssued: 0, activeCount: 0, revokedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'revoked'
  const [selectedCert, setSelectedCert] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Revocation Modal State
  const [revokeModalCert, setRevokeModalCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const studentPortalUrl = process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3000';

  const loadCertificates = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);

    api.get(`/enrollments/certificates/manage?${params.toString()}`)
      .then((res) => {
        setCertificates(res.data?.certificates || []);
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
      })
      .catch((err) => {
        console.error('Failed to load certificates:', err);
        setCertificates([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user, statusFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadCertificates();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCopy = (certId) => {
    navigator.clipboard.writeText(certId);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (cert, newStatus, reason = '') => {
    setProcessingId(cert._id);
    try {
      await api.patch(`/enrollments/certificates/${cert._id}/status`, {
        status: newStatus,
        reason,
      });
      loadCertificates();
      if (revokeModalCert) {
        setRevokeModalCert(null);
        setRevokeReason('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update certificate status');
    } finally {
      setProcessingId(null);
      setRevoking(false);
    }
  };

  const handleOpenPreview = (c) => {
    setSelectedCert({
      certificateId: c.certificateId,
      studentName: c.student?.name || 'Learner',
      courseTitle: c.course?.title || 'Mastery Course',
      instructorName: c.course?.instructorName || 'Lead Instructor',
      issueDate: c.issueDate,
      certificateStatus: c.certificateStatus,
      certificateRevokedReason: c.certificateRevokedReason,
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-2 border border-amber-200">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Academic Credential Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Certificate Governance & Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit issued certificates, inspect student credentials, download high-res PDFs, and manage validity.
          </p>
        </div>

        <button
          onClick={loadCertificates}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Issued</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalIssued}</span>
            <span className="text-[11px] text-slate-500 font-medium">Completed graduates</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Active & Verified</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.activeCount}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Valid public credentials</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Revoked</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.revokedCount}</span>
            <span className="text-[11px] text-rose-500 font-medium">Withdrawn credentials</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Certificates</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {metrics.totalIssued}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Valid</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'active' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
              {metrics.activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('revoked')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Revoked</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'revoked' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-800'}`}>
              {metrics.revokedCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search learner, course, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* Certificates Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-medium">Fetching certificates registry...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base mb-1">No Certificates Found</h3>
            <p className="text-slate-400 text-xs mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search query or status filter.' 
                : 'No course certificates have been completed or issued yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200/80">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Student / Recipient</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Credential Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {certificates.map((cert) => {
                  const isRevoked = cert.certificateStatus === 'revoked';
                  const formattedDate = cert.issueDate 
                    ? new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={cert._id} className="hover:bg-slate-50/60 transition">
                      {/* Certificate ID */}
                      <td className="px-6 py-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{cert.certificateId}</span>
                          <button
                            onClick={() => handleCopy(cert.certificateId)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
                            title="Copy ID"
                          >
                            {copiedId === cert.certificateId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{cert.student?.name || 'Learner'}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cert.student?.email}</div>
                      </td>

                      {/* Course */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{cert.course?.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Instructor: {cert.course?.instructorName || 'Platform'}</div>
                      </td>

                      {/* Issue Date */}
                      <td className="px-6 py-4 text-slate-600">
                        {formattedDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isRevoked ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Revoked</span>
                            </span>
                            {cert.certificateRevokedReason && (
                              <p className="text-[10px] text-rose-500 mt-0.5 max-w-[150px] truncate" title={cert.certificateRevokedReason}>
                                {cert.certificateRevokedReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active & Verified</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview & Download */}
                          <button
                            onClick={() => handleOpenPreview(cert)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                            title="Preview certificate & download PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          {/* Open Public Verification */}
                          <a
                            href={`${studentPortalUrl}/certificate/${cert.certificateId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Open public verification page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Revoke / Reactivate Action */}
                          {isRevoked ? (
                            <button
                              onClick={() => handleToggleStatus(cert, 'active')}
                              disabled={processingId === cert._id}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reactivate this certificate"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reinstate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setRevokeModalCert(cert);
                                setRevokeReason('');
                              }}
                              disabled={processingId === cert._id}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Revoke certificate"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* Revocation Confirmation Modal */}
      {revokeModalCert && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Revoke Certificate?</h3>
                <p className="text-xs text-slate-500">
                  ID: <strong className="font-mono text-slate-700">{revokeModalCert.certificateId}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Revoking this credential will immediately mark it as invalid on the public verification registry.
              The learner will no longer be able to download this certificate.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Revocation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Course enrollment refunded, milestone verification issue..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevokeModalCert(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={() => {
                  setRevoking(true);
                  handleToggleStatus(revokeModalCert, 'revoked', revokeReason);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {revoking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                <span>Confirm Revocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
