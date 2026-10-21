const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

/**
 * Returns true if both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured.
 */
function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(keyId && keySecret);
}

/**
 * Returns the public Razorpay Key ID (safe to share with the frontend).
 * Never exposes the key secret.
 */
function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

/**
 * Lazily instantiates and returns the official Razorpay client instance.
 * Throws a clean error if credentials are not configured.
 */
function getRazorpayInstance() {
  if (!isRazorpayConfigured()) {
    throw new Error(
      'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend environment variables.'
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }

  return razorpayInstance;
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256 according to official Razorpay specifications.
 * Signature payload: `${razorpay_order_id}|${razorpay_payment_id}`
 * 
 * @param {Object} params
 * @param {string} params.razorpay_order_id
 * @param {string} params.razorpay_payment_id
 * @param {string} params.razorpay_signature
 * @returns {boolean} True if signature is cryptographically valid, false otherwise.
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    throw new Error('Cannot verify Razorpay signature: RAZORPAY_KEY_SECRET is not configured.');
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  // Use timingSafeEqual to guard against timing attacks
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(razorpay_signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

module.exports = {
  isRazorpayConfigured,
  getRazorpayKeyId,
  getRazorpayInstance,
  verifyPaymentSignature,
};

