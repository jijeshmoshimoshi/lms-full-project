'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import CertificateModal from '../../../components/CertificateModal';
import { 
  Award, ShieldCheck, ArrowLeft, BookOpen, CheckCircle2, 
  Clock, AlertTriangle, Search, Calendar, User, Check
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/enrollments/certificate/${id}`)
      .then((res) => {
        setCert(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Certificate not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium text-sm">Verifying credential on official academy registry...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Certificate Not Found</h2>
            <p className="text-xs text-slate-400 mt-1">
              Credential ID <strong className="font-mono text-slate-200">{id}</strong> could not be verified in our official registry.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left">
            <p><strong>Possible reasons:</strong></p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-500">
              <li>The certificate ID was mistyped.</li>
              <li>The certificate has not yet been issued.</li>
              <li>The credential was modified or forged.</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/certificate"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              Search Another ID
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRevoked = cert.certificateStatus === 'revoked';
  const formattedDate = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently Completed';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <Link
              href="/certificate"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify Another ID</span>
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Learning Academy</span>
            </Link>
          </div>

          <div>
            {isRevoked ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Revoked Credential</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Officially Verified Credential</span>
              </span>
            )}
          </div>
        </div>

        {/* Official Verification Audit Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          isRevoked 
            ? 'bg-rose-950/40 border-rose-800/60' 
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isRevoked 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950'
              }`}>
                {isRevoked ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isRevoked 
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' 
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {isRevoked ? 'Invalid / Revoked' : 'Authentic & Verified'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    {cert.certificateId || id}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {isRevoked ? 'Credential Has Been Revoked' : 'Verified Certificate of Completion'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {isRevoked ? (
                    <span className="text-rose-200">
                      <strong>Revocation Reason:</strong> {cert.certificateRevokedReason || 'Revoked by institution.'}
                    </span>
                  ) : (
                    <span>
                      This credential was officially issued by SkillPulse Learning Academy to{' '}
                      <strong className="text-amber-400 font-bold">{cert.studentName || 'Learner'}</strong>{' '}
                      for successful completion of all curriculum requirements for{' '}
                      <strong className="text-white font-bold">{cert.courseTitle}</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Verification Metadata Attributes */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shrink-0 text-xs space-y-2 min-w-[220px]">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipient</p>
                <p className="font-bold text-slate-200">{cert.studentName || 'Learner'}</p>
              </div>
              <div className="pt-1 border-t border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course</p>
                <p className="font-bold text-slate-200 truncate max-w-[200px]">{cert.courseTitle}</p>
              </div>
              <div className="pt-1 border-t border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instructor</p>
                <p className="font-bold text-slate-200">{cert.instructorName || 'Lead Instructor'}</p>
              </div>
              <div className="pt-1 border-t border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issue Date</p>
                <p className="font-mono text-slate-300">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Render High-Res Certificate Graphic with Export & QR Code */}
        <CertificateModal certificate={cert} isModal={false} />
        
      </div>
    </div>
  );
}
