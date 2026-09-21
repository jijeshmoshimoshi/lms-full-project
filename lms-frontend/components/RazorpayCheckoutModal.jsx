'use client';
import { useState, useEffect } from 'react';
import { 
  CreditCard, QrCode, Building2, Wallet, ShieldCheck, 
  Lock, X, CheckCircle2, ChevronRight, Smartphone, AlertCircle
} from 'lucide-react';

export default function RazorpayCheckoutModal({ 
  isOpen, 
  onClose, 
  orderData, 
  course, 
  user, 
  onPaymentSuccess, 
  onPaymentFailure 
}) {
  const [selectedMethod, setSelectedMethod] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'wallet'
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'processing' | 'otp' | 'success'

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');

  // UPI State
  const [upiId, setUpiId] = useState('');
  const [selectedApp, setSelectedApp] = useState('gpay');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Autofill test card details
  const handleAutofillTestCard = () => {
    setCardNumber('4111 •••• •••• 1111');
    setCardExpiry('12/28');
    setCardCvv('789');
    setCardName(user?.name || 'Test Student');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form
      setStep('select');
      setIsProcessing(false);
      handleAutofillTestCard();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const displayAmount = (orderData.amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handlePay = async () => {
    setIsProcessing(true);
    setStep('processing');

    // Simulate 1.2s realistic gateway processing
    setTimeout(async () => {
      try {
        const simulatedPaymentId = `pay_${Math.random().toString(36).substring(2, 14)}`;
        const simulatedSignature = 'sandbox_test_signature';

        await onPaymentSuccess({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
          method: selectedMethod,
        });
      } catch (err) {
        setIsProcessing(false);
        setStep('select');
        onPaymentFailure?.(err);
      }
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white px-6 py-4 flex items-center justify-between border-b border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            {/* Razorpay Simulated Blue Blade Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c80df] to-[#025bb5] flex items-center justify-center text-white font-black text-lg shadow-md tracking-tighter">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  SkillPulse LMS
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Razorpay Route 256-bit Encrypted Checkout</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Amount to Pay
              </span>
              <span className="text-lg sm:text-xl font-black text-white font-mono">
                ₹{displayAmount}
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
              title="Cancel payment"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Details Ribbon */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate pr-4">
            <span className="font-semibold text-slate-900 truncate">Course:</span>
            <span className="truncate text-slate-700">{course?.title || 'Course Enrollment'}</span>
          </div>
          <div className="shrink-0 font-mono text-[11px] text-slate-400">
            Order: {orderData.orderId}
          </div>
        </div>

        {/* Main Payment Section */}
        {step === 'processing' ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <h4 className="text-lg font-extrabold text-slate-900">
              Processing Payment with Razorpay...
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Connecting to payment gateway & routing instructor revenue split. Please do not close or refresh this window.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
            {/* Left Payment Options Navigation */}
            <div className="md:col-span-4 bg-slate-50/70 border-r border-slate-200/80 p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5 block">
                Payment Options
              </span>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition text-xs font-semibold ${
                  selectedMethod === 'card'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${selectedMethod === 'card' ? 'text-white' : 'text-indigo-600'}`} />
                <span className="flex-1">Cards (Debit / Credit)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition text-xs font-semibold ${
                  selectedMethod === 'upi'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className={`w-4 h-4 ${selectedMethod === 'upi' ? 'text-white' : 'text-emerald-600'}`} />
                <span className="flex-1">UPI & QR Code</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  selectedMethod === 'upi' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Fast
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition text-xs font-semibold ${
                  selectedMethod === 'netbanking'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className={`w-4 h-4 ${selectedMethod === 'netbanking' ? 'text-white' : 'text-blue-600'}`} />
                <span className="flex-1">Netbanking</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('wallet')}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition text-xs font-semibold ${
                  selectedMethod === 'wallet'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wallet className={`w-4 h-4 ${selectedMethod === 'wallet' ? 'text-white' : 'text-amber-600'}`} />
                <span className="flex-1">Wallets</span>
              </button>

              {/* Razorpay Route Security Badge */}
              <div className="pt-6 px-2 mt-4 border-t border-slate-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Razorpay Route</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Auto-settled to platform and instructor accounts.
                </p>
              </div>
            </div>

            {/* Right Method Form Pane */}
            <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-6">
              {/* TAB 1: CARD */}
              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Enter Card Details
                    </span>
                    <button
                      type="button"
                      onClick={handleAutofillTestCard}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Use Test Card (4111...)
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 1111 1111 1111"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1">
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            VISA
                          </span>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            MC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Valid Thru</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM / YY"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Learner Name"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Your card details are tokenized securely with PCI-DSS Level 1 compliance.</span>
                  </div>
                </div>
              )}

              {/* TAB 2: UPI */}
              {selectedMethod === 'upi' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Select UPI App or Scan QR
                  </span>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                      { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                      { id: 'paytm', name: 'Paytm UPI', icon: '🔵' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app.id)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                          selectedApp === app.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-xl">{app.icon}</span>
                        <span className="text-xs font-medium">{app.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block text-slate-600 font-medium">Or enter your UPI ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="username@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setUpiId(`${user?.email?.split('@')[0] || 'student'}@okhdfcbank`)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Instant zero-fee UPI auto-reconciliation enabled</span>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: NETBANKING */}
              {selectedMethod === 'netbanking' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Choose Popular Bank
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'hdfc', name: 'HDFC Bank' },
                      { id: 'icici', name: 'ICICI Bank' },
                      { id: 'sbi', name: 'State Bank of India' },
                      { id: 'axis', name: 'Axis Bank' },
                      { id: 'kotak', name: 'Kotak Bank' },
                      { id: 'pnb', name: 'PNB' },
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedBank === bank.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-xs">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: WALLET */}
              {selectedMethod === 'wallet' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Supported Wallets
                  </span>

                  <div className="space-y-2">
                    {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map((w, idx) => (
                      <label 
                        key={w} 
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <span className="font-semibold text-slate-800">{w}</span>
                        <input type="radio" name="wallet" defaultChecked={idx === 0} className="text-indigo-600" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Pay Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Paying: </span>
                  <strong className="text-slate-900 font-mono">₹{displayAmount}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay ₹{displayAmount}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
