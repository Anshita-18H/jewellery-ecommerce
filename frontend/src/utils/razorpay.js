/**
 * Helper to dynamically load the official Razorpay Checkout SDK if not already loaded.
 * Returns a promise that resolves to true once window.Razorpay is available.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

