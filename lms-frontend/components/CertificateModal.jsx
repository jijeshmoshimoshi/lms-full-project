'use client';
import { useRef, useEffect, useState } from 'react';
import { 
  Award, CheckCircle2, Download, Printer, Share2, X, ShieldCheck, 
  RefreshCw, Image as ImageIcon, AlertTriangle, ExternalLink, Check, Copy
} from 'lucide-react';

export default function CertificateModal({ certificate, onClose, isModal = true }) {
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Generate QR Code for live third-party verification
  useEffect(() => {
    const certId = certificate?.certificateId || certificate?._id;
    if (!certId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const verifyUrl = `${origin}/certificate/${certId}`;

    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(verifyUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
    }).catch(console.error);
  }, [certificate]);

  // Close on Escape key press
  useEffect(() => {
    if (!isModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isModal]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModal]);

  if (!certificate) return null;

  const isRevoked = certificate.certificateStatus === 'revoked';

  // 1. DIRECT HIGH-RES ISOLATED PDF DOWNLOAD (ONLY THE CERTIFICATE CONTAINER)
  const handleDownloadPDF = async () => {
    if (!certRef.current || isRevoked) return;
    setDownloading(true);
    setDownloadProgress('Rendering high-res certificate...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = certRef.current;

      // Render solely the certificate node with 3x DPI for ultra-crisp vector-like resolution
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfcfd',
        logging: false,
        windowWidth: 1200,
      });

      setDownloadProgress('Generating PDF document...');

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Standard A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 297;
      const pdfHeight = 210;

      // Fit with 10mm borders
      const maxW = pdfWidth - 20;
      const maxH = pdfHeight - 20;
      const imgRatio = canvas.width / canvas.height;

      let renderW = maxW;
      let renderH = renderW / imgRatio;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH * imgRatio;
      }

      const posX = (pdfWidth - renderW) / 2;
      const posY = (pdfHeight - renderH) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderW, renderH, undefined, 'FAST');

      const safeStudent = (certificate.studentName || 'Learner').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeCourse = (certificate.courseTitle || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeId = (certificate.certificateId || 'credential').replace(/[^a-zA-Z0-9_-]/g, '_');

      pdf.save(`Certificate_${safeCourse}_${safeStudent}_${safeId}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again or use the print option.');
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // 2. DIRECT HIGH-RES PNG IMAGE DOWNLOAD
  const handleDownloadPNG = async () => {
    if (!certRef.current || isRevoked) return;
    setDownloading(true);
    setDownloadProgress('Generating high-res image...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfcfd',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const safeTitle = (certificate.courseTitle || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Certificate_${safeTitle}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('PNG download error:', err);
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // 3. ISOLATED IFRAME PRINT (ONLY THE CERTIFICATE, NO WEBSITE SURROUNDINGS)
  const handlePrintIsolated = () => {
    if (!certRef.current || isRevoked) return;
    const certHtml = certRef.current.outerHTML;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${certificate.courseTitle || 'Certificate'} - ${certificate.studentName || 'Learner'}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10mm;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .certificate-container {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: 8px double #d97706 !important;
              background-color: #fcfcfd !important;
              border-radius: 0 !important;
            }
          </style>
          <link rel="stylesheet" href="/globals.css" />
        </head>
        <body>
          ${certHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  };

  const handleCopyLink = () => {
    const certId = certificate.certificateId || certificate._id || '';
    const url = `${window.location.origin}/certificate/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formattedDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const content = (
    <div className="my-auto bg-slate-900 text-white rounded-3xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-hidden">

      {/* Modal Top Actions */}
      <div className="p-4 px-6 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex items-center gap-2">
            <span>Certificate of Completion</span>
            {isRevoked ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Revoked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Credential
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Verification Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Copy verification link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* Download Isolated PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || isRevoked}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            title="Download crisp landscape PDF (certificate only)"
          >
            {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{downloading ? downloadProgress || 'Downloading...' : 'Download PDF'}</span>
          </button>

          {/* Download PNG Image */}
          <button
            onClick={handleDownloadPNG}
            disabled={downloading || isRevoked}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
            title="Download PNG image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Image</span>
          </button>

          {/* Isolated Print */}
          <button
            onClick={handlePrintIsolated}
            disabled={downloading || isRevoked}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
            title="Print certificate only in landscape"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Revocation Banner if revoked */}
      {isRevoked && (
        <div className="p-3 px-6 bg-rose-950/80 border-b border-rose-800 flex items-center gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <strong className="text-white font-bold">This credential has been revoked:</strong>{' '}
            {certificate.certificateRevokedReason || 'Revoked by administrator.'}
          </div>
        </div>
      )}

      {/* The Printable Certificate Container */}
      <div className="p-4 sm:p-6 md:p-8 bg-slate-950 flex items-center justify-center overflow-x-auto">
        <div
          ref={certRef}
          className="certificate-container relative w-full aspect-[1.414/1] max-w-3xl bg-[#fcfcfd] text-slate-900 p-6 sm:p-10 md:p-12 rounded-2xl shadow-2xl border-8 border-double border-amber-600/60 flex flex-col justify-between overflow-hidden"
          style={{ minHeight: '440px' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
            <Award className="w-[380px] h-[380px] text-amber-900" />
          </div>

          {/* Corner Decorative Ornaments */}
          <div className="absolute top-3 left-3 w-8 sm:w-10 h-8 sm:h-10 border-t-2 border-l-2 border-amber-600/70" />
          <div className="absolute top-3 right-3 w-8 sm:w-10 h-8 sm:h-10 border-t-2 border-r-2 border-amber-600/70" />
          <div className="absolute bottom-3 left-3 w-8 sm:w-10 h-8 sm:h-10 border-b-2 border-l-2 border-amber-600/70" />
          <div className="absolute bottom-3 right-3 w-8 sm:w-10 h-8 sm:h-10 border-b-2 border-r-2 border-amber-600/70" />

          {/* Certificate Header */}
          <div className="text-center space-y-1 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-md mb-1 sm:mb-2">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-700">
              Official Certification of Achievement
            </p>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight text-slate-900">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-1 sm:mt-1.5" />
          </div>

          {/* Recipient Body */}
          <div className="text-center space-y-2 sm:space-y-3 my-2 sm:my-3 relative z-10">
            <p className="text-xs sm:text-sm font-serif italic text-slate-500">
              This prestigious credential is proudly awarded to
            </p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight underline decoration-amber-500/50 decoration-2 underline-offset-8">
              {certificate.studentName || 'Learner'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-1 sm:pt-2">
              for successfully fulfilling all curriculum requirements, video lectures, coursework, and milestones for
            </p>
            <h3 className="text-base sm:text-xl font-bold text-slate-900 max-w-xl mx-auto">
              {certificate.courseTitle || 'Mastery Course'}
            </h3>
          </div>

          {/* Footer / Signatures & Seal */}
          <div className="grid grid-cols-3 items-end pt-4 sm:pt-6 border-t border-slate-200/80 relative z-10 text-xs">
            {/* Instructor */}
            <div className="text-center space-y-1">
              <div className="font-serif italic font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
                {certificate.instructorName || 'Lead Instructor'}
              </div>
              <div className="w-24 sm:w-32 h-px bg-slate-300 mx-auto" />
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-400">Instructor</p>
            </div>

            {/* Official Gold Seal & QR Code Verification */}
            <div className="text-center flex flex-col items-center justify-end">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-amber-600 bg-amber-50 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-amber-700" />
                </div>
                {qrCodeUrl && (
                  <div className="p-0.5 sm:p-1 bg-white border border-slate-300 rounded-md shadow-xs">
                    <img src={qrCodeUrl} alt="Scan to Verify" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
                  </div>
                )}
              </div>
              <span className="text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider text-amber-900 mt-1">
                Verified LMS • Scan to Verify
              </span>
            </div>

            {/* Issue Date & ID */}
            <div className="text-center space-y-1">
              <div className="font-mono text-slate-800 text-[11px] sm:text-xs font-semibold">
                {formattedDate}
              </div>
              <div className="w-24 sm:w-32 h-px bg-slate-300 mx-auto" />
              <p className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                ID: {certificate.certificateId || certificate._id || 'CERT-ISSUED'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Bottom Actions */}
      <div className="p-4 px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>
          Certificate ID: <strong className="text-slate-200 font-mono">{certificate.certificateId || certificate._id}</strong>
        </span>
        <div className="flex items-center gap-3">
          <a
            href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.courseTitle || 'Certification')}&organizationName=${encodeURIComponent('SkillPulse LMS')}&certId=${encodeURIComponent(certificate.certificateId || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>Add to LinkedIn</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {content}
    </div>
  );
}
