const { BrevoClient } = require('@getbrevo/brevo');
const pool = require('../config/db');
const { getOrderEmailTemplate } = require('../templates/orderEmails');

let brevoClientInstance = null;

/**
 * Returns a singleton BrevoClient using the backend environment variable.
 * Never prints or exposes the API key.
 */
function getBrevoClient() {
  if (!brevoClientInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn('[EmailService] BREVO_API_KEY is not defined in process.env. Email sending will be skipped.');
      return null;
    }
    brevoClientInstance = new BrevoClient({ apiKey });
  }
  return brevoClientInstance;
}

/**
 * Parses and returns the verified sender name and email from environment variables.
 */
function getSenderConfig() {
  const name = process.env.EMAIL_FROM_NAME || 'AURA Fine Jewellery';
  let email = 'srishtihedau@gmail.com';
  if (process.env.EMAIL_FROM) {
    const match = process.env.EMAIL_FROM.match(/<([^>]+)>/);
    email = match ? match[1].trim() : process.env.EMAIL_FROM.trim();
  }
  return { name, email };
}

/**
 * Sends an automatic customer email notification for an order status transition via Brevo.
 *
 * @param {number|string|Object} orderOrId - Order ID or Order record
 * @param {string} status - Target status ('confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')
 * @param {Object} [options] - Optional additional metadata (trackingNumber, trackingUrl)
 * @returns {Promise<{ success: boolean, duplicate?: boolean, skipped?: boolean, reason?: string, error?: string, messageId?: string }>}
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

    // Step 1: Duplicate email protection via database notification log
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
    }

    // Step 2: Fetch order details and resolve real customer email from database
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

    // Step 3: Handle missing customer email safely
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

    // Step 6: Dispatch email through Brevo
    const brevo = getBrevoClient();
    if (!brevo) {
      console.warn('[EmailService] Brevo client unavailable. Skipping email dispatch.');
      return { success: false, reason: 'brevo_client_unavailable' };
    }

    const sender = getSenderConfig();
    const customerName = order.customer_name || order.resolved_name || 'Valued Client';

    let sendResult;
    try {
      sendResult = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: customerEmail, name: customerName }],
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        tags: [`order-${orderId}`, normalizedStatus],
      });
    } catch (brevoErr) {
      const errMsg = brevoErr.message || String(brevoErr);
      console.error(`[EmailService] Brevo API error sending email for order #${orderId} to ${customerEmail}:`, errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = sendResult?.messageId || sendResult?.data?.messageId || null;

    // Step 7: Record notification in database for duplicate protection
    try {
      await pool.query(
        `INSERT IGNORE INTO order_email_notifications (order_id, status, email, resend_id)
         VALUES (?, ?, ?, ?)`,
        [orderId, normalizedStatus, customerEmail, messageId]
      );
    } catch (logErr) {
      console.warn(`[EmailService] Warning: Could not log email notification for order #${orderId}:`, logErr.message);
    }

    console.log(`[EmailService] Successfully sent "${normalizedStatus}" email for order #${orderId} to ${customerEmail} via Brevo (MessageId: ${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    // Top-level catch guarantee: email failure must never break order updates
    console.error('[EmailService] Unexpected error in sendOrderStatusEmail:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderStatusEmail,
};
