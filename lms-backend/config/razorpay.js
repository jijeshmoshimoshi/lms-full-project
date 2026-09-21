const Razorpay = require('razorpay');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

const isRazorpayConfigured = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(key_id && key_secret && !key_id.includes('placeholder'));
};

module.exports = {
  getRazorpayInstance,
  isRazorpayConfigured,
};
