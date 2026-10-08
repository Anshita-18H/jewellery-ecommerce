const { Resend } = require('resend');
const pool = require('../config/db');
const { getOrderEmailTemplate } = require('../templates/orderEmails');

let resendInstance = null;

/**
 * Returns a singleton Resend client using the backend environment variable.
 * Never prints or exposes the API key.
 */
function getResendClient() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EmailService] RESEND_API_KEY is not defined in process.env. Email sending will be skipped.');
      return null;
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Sends an automatic customer email notification for an order status transition.
 *
 * @param {number|string|Object} orderOrId - Order ID or Order record
 * @param {string} status - Target status (e.g., 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')
 * @param {Object} [options] - Optional additional metadata (e.g., trackingNumber, trackingUrl)
 * @returns {Promise<{ success: boolean, duplicate?: boolean, skipped?: boolean, reason?: string, error?: string, resendId?: string }>}
 */
async function sendOrderStatusEmail(orderOrId, status, options = {}) {
  try {
    const orderId = typeof orderOrId === 'object' && orderOrId !== null ? orderOrId.id : Number(orderOrId);
    if (!orderId || isNaN(orderId)) {
      console.warn('[EmailService] Invalid orderId provided:', orderOrId);
      return { success: false, reason: 'invalid_order_id' };
    }

    const normalizedStatus = String(status || '').toLowerCase().trim();
    if (!normalizedStatus) {
      return { success: false, reason: 'missing_status' };
    }

    // Step 1: Check duplicate notification in database
    try {
      const [existingNotifications] = await pool.query(
        'SELECT id, sent_at FROM order_email_notifications WHERE order_id = ? AND status = ?',
        [orderId, normalizedStatus]
      );
      if (existingNotifications.length > 0) {
        console.log(`[EmailService] Notification for order #${orderId} with status "${normalizedStatus}" was already sent on ${existingNotifications[0].sent_at}. Skipping duplicate.`);
        return { success: true, duplicate: true, skipped: true };
      }
    } catch (dbErr) {
      console.warn('[EmailService] Error checking duplicate notification table:', dbErr.message);
      // Proceed cautiously if table check fails
    }

    // Step 2: Fetch order details and resolve real customer email
    const [orderRows] = await pool.query(
      `SELECT o.*, 
              COALESCE(o.customer_email, u.email) AS resolved_email,
              COALESCE(u.name, o.customer_name) AS resolved_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      console.warn(`[EmailService] Order #${orderId} not found in database.`);
      return { success: false, reason: 'order_not_found' };
    }

    const order = orderRows[0];
    const customerEmail = (order.resolved_email || '').trim();

    // Step 3: Handle missing or invalid customer email safely (Test 9)
    if (!customerEmail || !customerEmail.includes('@')) {
      console.log(`[EmailService] Order #${orderId} has no associated customer email address. Skipping email notification safely.`);
      return { success: false, reason: 'missing_email', skipped: true };
    }

    // Step 4: Fetch order line items
    let lineItems = [];
    try {
      const [itemRows] = await pool.query(
        'SELECT product_name, price, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );
      lineItems = itemRows;
    } catch (itemErr) {
      console.warn(`[EmailService] Could not fetch line items for order #${orderId}:`, itemErr.message);
    }

    // Step 5: Generate the appropriate AURA luxury email template
    const templateData = {
      customerName: order.customer_name || order.resolved_name || 'Valued Client',
      orderNumber: order.id,
      orderDate: order.created_at,
      orderItems: lineItems,
      subtotal: order.total_amount,
      shipping: 0,
      total: order.total_amount,
      shippingAddress: {
        address: order.address,
        city: order.city,
        pincode: order.pincode,
        phone: order.phone,
      },
      trackingNumber: options.trackingNumber || order.tracking_number || null,
      trackingUrl: options.trackingUrl || order.tracking_url || null,
      frontendUrl: process.env.FRONTEND_URL || 'https://anshita-18h.github.io/jewellery-ecommerce/',
    };

    const emailContent = getOrderEmailTemplate(normalizedStatus, templateData);
    if (!emailContent) {
      console.log(`[EmailService] No email template configured for order status "${normalizedStatus}".`);
      return { success: false, reason: 'unsupported_status', skipped: true };
    }

    // Step 6: Dispatch email through Resend with deterministic idempotency key
    const resend = getResendClient();
    if (!resend) {
      console.warn('[EmailService] Resend client unavailable. Skipping email dispatch.');
      return { success: false, reason: 'resend_client_unavailable' };
    }

    const fromAddress = process.env.EMAIL_FROM || 'AURA Fine Jewellery <onboarding@resend.dev>';
    const idempotencyKey = `order-${orderId}-${normalizedStatus}`;

    let sendResult;
    try {
      sendResult = await resend.emails.send({
        from: fromAddress,
        to: [customerEmail],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        headers: {
          'X-Entity-Ref-ID': idempotencyKey,
        },
      });
    } catch (resendNetworkErr) {
      console.error(`[EmailService] Network error sending Resend email for order #${orderId}:`, resendNetworkErr.message);
      return { success: false, error: resendNetworkErr.message };
    }

    if (sendResult?.error) {
      console.error(`[EmailService] Resend returned error for order #${orderId}:`, sendResult.error.message || sendResult.error);
      return { success: false, error: sendResult.error.message || 'Resend error' };
    }

    const resendId = sendResult?.data?.id || null;

    // Step 7: Record notification in database for duplicate protection
    try {
      await pool.query(
        `INSERT IGNORE INTO order_email_notifications (order_id, status, email, resend_id)
         VALUES (?, ?, ?, ?)`,
        [orderId, normalizedStatus, customerEmail, resendId]
      );
    } catch (logErr) {
      console.warn(`[EmailService] Warning: Could not log email notification for order #${orderId}:`, logErr.message);
    }

    console.log(`[EmailService] Successfully sent "${normalizedStatus}" email for order #${orderId} to ${customerEmail}`);
    return { success: true, resendId };
  } catch (err) {
    // Top-level catch guarantee: never break order management
    console.error('[EmailService] Unexpected error in sendOrderStatusEmail:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderStatusEmail,
};
