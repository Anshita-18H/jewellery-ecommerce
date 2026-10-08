/**
 * AURA Fine Jewellery — Transactional Email Templates
 *
 * Dedicated template generator for order lifecycle notifications:
 * - Confirmed
 * - Processing
 * - Shipped
 * - Out for Delivery
 * - Delivered
 * - Cancelled
 * - Refunded
 *
 * Designed with luxury aesthetics: dark palette (#0b0a08, #14120e), gold accents (#c9a45c),
 * inline styling and table layouts for maximum email-client compatibility.
 */

// Helper to escape HTML dynamic content against injection
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to format currency in Indian Rupees
function formatINR(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

// Helper to format date
function formatDate(dateVal) {
  if (!dateVal) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Metadata configuration for each order status
 */
const STATUS_CONFIG = {
  confirmed: {
    title: 'Order Confirmed',
    badgeColor: '#c9a45c',
    badgeBg: 'rgba(201, 164, 92, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Has Been Confirmed`,
    headline: 'Your order has been confirmed',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Thank you for choosing AURA Fine Jewellery. Your order has been successfully confirmed and we are preparing it with care.',
    actionLabel: 'View Your Order',
  },
  processing: {
    title: 'Order Processing',
    badgeColor: '#e4c88a',
    badgeBg: 'rgba(228, 200, 138, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Is Being Processed`,
    headline: 'Your order is being processed',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your order is now being carefully prepared by our master craftspeople.',
    actionLabel: 'Track Order Status',
  },
  shipped: {
    title: 'Order Shipped',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96, 165, 250, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Has Been Shipped`,
    headline: 'Your piece is on its way',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your order has shipped and is on its way to you in secure, tamper-evident luxury packaging.',
    actionLabel: 'Track Delivery',
  },
  out_for_delivery: {
    title: 'Out for Delivery',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Is Out for Delivery`,
    headline: 'Out for delivery today',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your AURA order is now out for delivery. Please ensure someone is available at your delivery address to receive the package.',
    actionLabel: 'View Order Details',
  },
  delivered: {
    title: 'Delivered',
    badgeColor: '#4ade80',
    badgeBg: 'rgba(74, 222, 128, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Has Been Delivered`,
    headline: 'Your order has arrived',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your order has been delivered. We hope you love your AURA piece for generations to come.',
    actionLabel: 'View Order History',
  },
  cancelled: {
    title: 'Order Cancelled',
    badgeColor: '#f87171',
    badgeBg: 'rgba(248, 113, 113, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Has Been Cancelled`,
    headline: 'Your order has been cancelled',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your order has been cancelled as requested or according to the current order status. If any payment was captured, a refund will be initiated promptly.',
    actionLabel: 'Contact Concierge',
  },
  refunded: {
    title: 'Refund Processed',
    badgeColor: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    subject: (orderNumber) => `Your AURA Order #${orderNumber} Has Been Refunded`,
    headline: 'Your refund has been processed',
    greeting: (name) => `Hello ${escapeHtml(name)},`,
    message: 'Your refund has been processed according to the current order information. Please allow 3–5 business days for the credit to reflect on your original payment method.',
    actionLabel: 'View Order History',
  },
};

/**
 * Builds the complete responsive HTML email for a given order status.
 *
 * @param {string} status - One of confirmed, processing, shipped, out_for_delivery, delivered, cancelled, refunded
 * @param {Object} data - Dynamic order information
 * @returns {{ subject: string, html: string, text: string }}
 */
function getOrderEmailTemplate(status, data = {}) {
  const normalizedStatus = String(status || '').toLowerCase().trim();
  const config = STATUS_CONFIG[normalizedStatus];

  if (!config) {
    return null;
  }

  const {
    customerName = 'Valued Client',
    orderNumber = '',
    orderDate = '',
    orderItems = [],
    subtotal = 0,
    shipping = 0,
    total = 0,
    shippingAddress = null,
    trackingNumber = null,
    trackingUrl = null,
    frontendUrl = 'https://anshita-18h.github.io/jewellery-ecommerce/',
  } = data;

  const cleanOrderNumber = escapeHtml(orderNumber);
  const cleanCustomerName = escapeHtml(customerName);
  const subject = config.subject(cleanOrderNumber);
  const orderUrl = `${String(frontendUrl).replace(/\/+$/, '')}/my-orders`;

  // Build items rows
  let itemsHtml = '';
  let itemsText = '';
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    itemsHtml = orderItems
      .map((item) => {
        const name = escapeHtml(item.product_name || item.name || 'Fine Jewellery Piece');
        const qty = Number(item.quantity) || 1;
        const price = formatINR(item.price);
        const itemTotal = formatINR((Number(item.price) || 0) * qty);

        return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #221c13;">
              <div style="font-size: 14px; font-weight: 500; color: #ede8df;">${name}</div>
              <div style="font-size: 12px; color: #8a8275; margin-top: 3px;">Qty: ${qty} &times; ${price}</div>
            </td>
            <td align="right" style="padding: 14px 0; border-bottom: 1px solid #221c13; font-size: 14px; font-weight: 600; color: #ede8df; vertical-align: top;">
              ${itemTotal}
            </td>
          </tr>
        `;
      })
      .join('');

    itemsText = orderItems
      .map((item) => `- ${item.product_name || item.name} (Qty: ${item.quantity || 1}) — ${formatINR((Number(item.price) || 0) * (item.quantity || 1))}`)
      .join('\n');
  }

  // Address HTML block
  let addressHtml = '';
  let addressText = '';
  if (shippingAddress && (shippingAddress.address || shippingAddress.city)) {
    const addr = escapeHtml(shippingAddress.address || '');
    const city = escapeHtml(shippingAddress.city || '');
    const pin = escapeHtml(shippingAddress.pincode || '');
    const phone = escapeHtml(shippingAddress.phone || '');

    addressHtml = `
      <!-- Shipping Address Block -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; background-color: #1a1712; border: 1px solid #2d261b; border-radius: 6px; padding: 16px 20px;">
        <tr>
          <td>
            <div style="font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9a45c; font-weight: 600; margin-bottom: 8px;">
              Delivery Destination
            </div>
            <div style="font-size: 13px; color: #ede8df; line-height: 1.5;">
              <strong>${cleanCustomerName}</strong><br />
              ${addr}${addr && city ? ', ' : ''}${city} ${pin ? `— ${pin}` : ''}<br />
              ${phone ? `<span style="color: #8a8275;">Contact: ${phone}</span>` : ''}
            </div>
          </td>
        </tr>
      </table>
    `;

    addressText = `\nDelivery Destination:\n${cleanCustomerName}\n${addr}, ${city} ${pin}\nContact: ${phone}\n`;
  }

  // Tracking block if available
  let trackingHtml = '';
  let trackingText = '';
  if (trackingNumber || trackingUrl) {
    trackingHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; background-color: #121926; border: 1px solid #1e3a5f; border-radius: 6px; padding: 14px 18px;">
        <tr>
          <td>
            <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #60a5fa; font-weight: 600; margin-bottom: 4px;">
              Shipment Tracking Details
            </div>
            ${trackingNumber ? `<div style="font-size: 13px; color: #ede8df;">Tracking Number: <strong>${escapeHtml(trackingNumber)}</strong></div>` : ''}
            ${trackingUrl ? `<div style="margin-top: 6px;"><a href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; font-size: 13px; text-decoration: underline;">Track live shipment &rarr;</a></div>` : ''}
          </td>
        </tr>
      </table>
    `;
    trackingText = `\nTracking: ${trackingNumber || ''} ${trackingUrl || ''}\n`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0a08; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #ede8df; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0a08; padding: 36px 14px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #14120e; border: 1px solid #2d261b; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 48px rgba(0,0,0,0.75);">
          
          <!-- Luxury Brand Header -->
          <tr>
            <td align="center" style="padding: 38px 32px 24px; border-bottom: 1px solid #221c13; background: linear-gradient(180deg, #1b1712 0%, #14120e 100%);">
              <div style="font-size: 22px; color: #c9a45c; line-height: 1; margin-bottom: 6px;">♦</div>
              <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.22em; text-transform: uppercase; color: #fdfaf4; font-weight: 600;">AURA</div>
              <div style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #c9a45c; margin-top: 4px;">FINE JEWELLERY</div>
            </td>
          </tr>

          <!-- Status Highlight Bar -->
          <tr>
            <td style="padding: 24px 32px 10px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${config.badgeColor}; background-color: ${config.badgeBg}; border: 1px solid ${config.badgeColor}40;">
                      ● ${config.title}
                    </span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #8a8275;">
                    Order #${cleanOrderNumber} &bull; ${formatDate(orderDate)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 12px 32px 24px;">
              <h1 style="margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 400; color: #fdfaf4; letter-spacing: 0.02em;">
                ${config.headline}
              </h1>
              <p style="margin: 0 0 10px; font-size: 15px; line-height: 1.6; color: #d4cec3;">
                ${config.greeting(customerName)}
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #a9a193;">
                ${config.message}
              </p>

              ${trackingHtml}

              <!-- Items Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; border-top: 1px solid #221c13;">
                ${itemsHtml}
              </table>

              <!-- Totals Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; padding-top: 12px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #8a8275;">Subtotal</td>
                  <td align="right" style="padding: 4px 0; font-size: 13px; color: #ede8df;">${formatINR(subtotal || total)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #8a8275;">Delivery &amp; Packaging</td>
                  <td align="right" style="padding: 4px 0; font-size: 13px; color: #c9a45c;">Complimentary Express</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 600; color: #fdfaf4; border-top: 1px solid #221c13;">Total Amount</td>
                  <td align="right" style="padding: 12px 0 0; font-size: 17px; font-weight: 700; color: #c9a45c; border-top: 1px solid #221c13;">${formatINR(total)}</td>
                </tr>
              </table>

              ${addressHtml}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 12px;">
                <tr>
                  <td align="center">
                    <a href="${orderUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #c9a45c; color: #0b0a08; font-weight: 600; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 14px 34px; border-radius: 4px; box-shadow: 0 4px 16px rgba(201, 164, 92, 0.35);">
                      ${config.actionLabel}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Luxury Brand Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px 28px; border-top: 1px solid #221c13; background-color: #0e0d0a;">
              <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #c9a45c; font-weight: 600;">
                AURA Fine Jewellery Concierge
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; line-height: 1.5; color: #7a7266;">
                Every creation is hallmark certified and delivered with our signature authenticity certificate.
              </p>
              <p style="margin: 0; font-size: 11px; color: #5a544b;">
                &copy; 2026 AURA Fine Jewellery. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
AURA FINE JEWELLERY
${config.title.toUpperCase()}
Order #${orderNumber} (${formatDate(orderDate)})

${config.greeting(customerName)}

${config.message}

${trackingText}
Order Items:
${itemsText}

Total: ${formatINR(total)}
${addressText}
View your order history: ${orderUrl}

---
AURA Fine Jewellery Concierge
© 2026 AURA Fine Jewellery. All rights reserved.
`.trim();

  return { subject, html, text };
}

module.exports = {
  getOrderEmailTemplate,
  STATUS_CONFIG,
};

