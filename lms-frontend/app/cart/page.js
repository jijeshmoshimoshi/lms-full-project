'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import RazorpayCheckoutModal from '../../components/RazorpayCheckoutModal';
import { 
  ShoppingCart, Trash2, ArrowRight, Star, ShieldCheck, 
  Lock, Tag, Check, Sparkles, BookOpen, AlertCircle, 
  CheckCircle2, RefreshCw, CreditCard, ChevronRight
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, cartOriginalTotal, mounted } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    api.get('/coupons/active')
      .then((res) => {
        setAvailableCoupons(res.data?.coupons || []);
      })
      .catch(() => {
        setAvailableCoupons([]);
      });
  }, []);

  // Checkout states
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Calculate discount and final price
  let discountAmount = 0;
  if (couponData) {
    if (typeof couponData.discountAmount === 'number') {
      discountAmount = couponData.discountAmount;
    } else if (couponData.discountPercent) {
      discountAmount = Math.round((cartTotal * couponData.discountPercent) / 100);
    }
  }
  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const totalSavings = (cartOriginalTotal - cartTotal) + discountAmount;

  const applySpecificCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const courseIds = cart.map(c => c._id);
      let res;
      try {
        res = await api.post('/coupons/validate', {
          code,
          courseIds,
          cartTotal,
        });
      } catch (validateErr) {
        // Fallback to legacy payments/validate-coupon endpoint
        res = await api.post('/payments/validate-coupon', {
          code,
          courseId: courseIds[0],
        });
      }

      setCouponData(res.data);
      setCouponCode(code);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    applySpecificCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponError('');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    if (cart.length === 0) return;

    setCheckingOut(true);
    setCheckoutError('');

    // If all courses in cart are free:
    if (finalTotal === 0) {
      try {
        for (const item of cart) {
          await api.post('/enrollments', { courseId: item._id });
        }
        clearCart();
        setCheckoutSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err) {
        setCheckoutError(err.response?.data?.message || 'Failed to complete free enrollment');
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    // Paid checkout:
    try {
      const courseIds = cart.map((c) => c._id);
      const res = await api.post('/payments/create-order', {
        courseId: courseIds[0],
        courseIds,
        couponCode: couponData?.code || undefined,
      });

      const orderInfo = res.data;
      setActiveOrderData(orderInfo);

      const rzpKey = orderInfo.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TXrmSOvTmddOrM';
      const isLoaded = await loadRazorpayScript();

      if (isLoaded && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: rzpKey,
          amount: orderInfo.amount,
          currency: orderInfo.currency || 'INR',
          name: 'SkillPulse Learning',
          description: `Checkout for ${cart.length} course${cart.length > 1 ? 's' : ''}`,
          order_id: orderInfo.orderId,
          handler: async function (response) {
            await handleVerifyPayment(response, orderInfo);
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              setCheckingOut(false);
            },
          },
        };

        const razorpayWindow = new window.Razorpay(options);
        razorpayWindow.on('payment.failed', function (resp) {
          setCheckoutError(`Payment failed: ${resp.error?.description || 'Declined'}`);
          setCheckingOut(false);
        });
        razorpayWindow.open();
      } else {
        // Fallback simulation modal
        setShowCheckoutModal(true);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.response?.data?.message || 'Failed to initiate checkout order');
      setCheckingOut(false);
    }
  };

  const handleVerifyPayment = async (razorpayResponse, orderInfo) => {
    try {
      await api.post('/payments/verify-payment', {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        courseId: cart[0]?._id,
      });

      clearCart();
      setShowCheckoutModal(false);
      setCheckoutSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Payment verification failed:', err);
      setCheckoutError(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading your cart...</p>
      </div>
    );
  }

  // EMPTY CART VIEW (Matching Udemy)
  if (cart.length === 0 && !checkoutSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8 font-heading">
          Shopping Cart
        </h1>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs space-y-4 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <ShoppingCart className="w-10 h-10 opacity-75" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Explore thousands of courses from top creators and start mastering new skills today.
          </p>
          <div className="pt-2">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition duration-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>Keep shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          Shopping Cart
        </h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          {cart.length} Course{cart.length !== 1 ? 's' : ''} in Cart
        </p>
      </div>

      {checkoutError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {checkoutSuccess && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-3xl text-center space-y-3 shadow-md animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-emerald-950">Enrollment Confirmed!</h2>
          <p className="text-xs text-emerald-800">
            You now have lifetime access to your courses. Redirecting you to your learner dashboard...
          </p>
        </div>
      )}

      {/* Main Cart Grid: Left Items List, Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const hasDiscount = item.originalPrice > item.price;
            const discountPercent = hasDiscount
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 0;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-slate-300"
              >
                {/* Course Thumbnail */}
                <Link
                  href={`/courses/${item.slug || item._id}`}
                  className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative group"
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-tr from-slate-900 to-indigo-950">
                      <BookOpen className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                </Link>

                {/* Course Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    href={`/courses/${item.slug || item._id}`}
                    className="font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition line-clamp-2 leading-snug"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-slate-500 truncate">
                    By {item.instructor?.name || 'Instructor'}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                      {item.category || 'General'}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase">
                      {item.level || 'Beginner'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs ml-1">
                      <span>{item.rating || 4.8}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.reviewsCount > 0 && (
                        <span className="text-slate-400 font-normal text-[10px]">
                          ({item.reviewsCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Remove Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : <span className="text-emerald-600">Free</span>}
                    </div>
                    {hasDiscount && (
                      <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400 line-through">
                          ₹{item.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                          {discountPercent}% OFF
                        </span>
                      </div>
                    )}
                    {item.isOfferActive && (
                      <div className="sm:text-right mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          <span>{item.offerBadgeText || 'Special Offer'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer sm:mt-3"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xl space-y-6 lg:sticky lg:top-24">
            
            {/* Total Block */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Order Summary:
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                  {finalTotal > 0 ? `₹${finalTotal.toLocaleString('en-IN')}` : 'Free'}
                </span>
                {cartOriginalTotal > finalTotal && (
                  <span className="text-base text-slate-400 line-through">
                    ₹{cartOriginalTotal.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-1.5 pt-2 text-xs border-t border-slate-50">
                {cartOriginalTotal > cartTotal && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Original Course MRP:</span>
                    <span>₹{cartOriginalTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {cartOriginalTotal > cartTotal && (
                  <div className="flex items-center justify-between text-rose-600 font-semibold">
                    <span>Promotional Offer Discount:</span>
                    <span>-₹{(cartOriginalTotal - cartTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({couponData?.code}):</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {totalSavings > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                  <span>Total Savings:</span>
                  <span>₹{totalSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {finalTotal > 0 ? 'Checkout Now' : 'Enroll for Free'}
                    </span>
                  </>
                )}
              </button>

              {!user && (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  You'll be prompted to sign in before finalizing payment.
                </p>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Promotions & Coupons
                </span>
                <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Verified Deals</span>
                </span>
              </div>

              {couponData ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-2 transition-all">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 font-mono">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{couponData.code} APPLIED</span>
                    </span>
                    <p className="text-xs font-bold text-emerald-700">
                      {couponData.savingsText || (couponData.discountPercent ? `${couponData.discountPercent}% discount applied` : `₹${couponData.discountAmount} savings applied`)}
                    </p>
                    {couponData.description && (
                      <p className="text-[10px] text-emerald-600">
                        {couponData.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-slate-400 hover:text-rose-600 transition font-bold p-1 rounded-lg hover:bg-emerald-100/50"
                    title="Remove coupon"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Promo Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                  {/* Real Active Offers from DB only (No dummy coupons shown) */}
                  {availableCoupons && availableCoupons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Available Offers
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.map((promo) => (
                          <button
                            key={promo._id || promo.code}
                            type="button"
                            onClick={() => applySpecificCoupon(promo.code)}
                            disabled={couponLoading}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="font-mono">{promo.code}</span>
                            <span className="text-[10px] text-indigo-500 font-normal">
                              ({promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {couponError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Guarantees & Perks */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Full lifetime access on desktop and mobile. Recognized certificate issued upon completion.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Fallback Simulation Modal if native Razorpay isn't triggered */}
      {showCheckoutModal && activeOrderData && (
        <RazorpayCheckoutModal
          isOpen={showCheckoutModal}
          orderData={activeOrderData}
          course={cart[0]}
          user={user}
          onClose={() => setShowCheckoutModal(false)}
          onPaymentSuccess={async (simulatedResponse) => {
            await handleVerifyPayment(simulatedResponse, activeOrderData);
          }}
          onPaymentFailure={(err) => {
            setCheckoutError(err?.message || 'Payment simulation failed');
            setShowCheckoutModal(false);
          }}
        />
      )}

    </div>
  );
}
