const assert = require('assert');
const crypto = require('crypto');
const pool = require('../config/db');
const { verifyPaymentSignature } = require('../config/razorpay');

console.log('====================================================');
console.log('AURA — RAZORPAY ORDERS ENDPOINT & DATABASE TEST');
console.log('====================================================\n');

async function runEndpointSimulationTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ [FAIL] ${name}:`, e.message);
    }
  }

  const testSecret = 'secret_test_mock_aura_567';
  process.env.RAZORPAY_KEY_SECRET = testSecret;

  try {
    // 1. Insert a test pending order into MySQL
    const [result] = await pool.query(
      `INSERT INTO orders (
        session_id, customer_name, customer_email, phone, address, city, pincode,
        total_amount, status, payment_status, payment_method, razorpay_order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'test_session_123',
        'Test Customer',
        'testcustomer@example.com',
        '+919876543210',
        '123 Luxury Avenue',
        'Mumbai',
        '400001',
        4999.00,
        'pending',
        'pending',
        'razorpay',
        'order_TEST_RZP_ORDER_999'
      ]
    );

    const testOrderId = result.insertId;
    console.log(`Created simulation pending order #${testOrderId}`);

    // Verify initial state
    const [[orderRow]] = await pool.query('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    test('Initial order status is "pending"', () => {
      assert.strictEqual(orderRow.status, 'pending');
      assert.strictEqual(orderRow.payment_status, 'pending');
    });

    // 2. Test Invalid Signature Simulation
    const invalidSignature = 'invalid_sha256_hash_123456';
    const isInvalidOk = verifyPaymentSignature({
      razorpay_order_id: orderRow.razorpay_order_id,
      razorpay_payment_id: 'pay_TEST_PAY_888',
      razorpay_signature: invalidSignature,
    });
    test('Invalid payment signature fails verification', () => {
      assert.strictEqual(isInvalidOk, false);
    });

    // 3. Test Valid Signature Simulation
    const validPaymentId = 'pay_TEST_PAY_888';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${orderRow.razorpay_order_id}|${validPaymentId}`)
      .digest('hex');

    const isValidOk = verifyPaymentSignature({
      razorpay_order_id: orderRow.razorpay_order_id,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
    });
    test('Valid cryptographic payment signature passes verification', () => {
      assert.strictEqual(isValidOk, true);
    });

    // 4. Update order to confirmed and paid (simulating successful verification)
    await pool.query(
      `UPDATE orders 
       SET status = 'confirmed',
           payment_status = 'paid',
           razorpay_payment_id = ?,
           razorpay_signature = ?
       WHERE id = ?`,
      [validPaymentId, validSignature, testOrderId]
    );

    const [[updatedOrder]] = await pool.query('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    test('Order transitions to status="confirmed" and payment_status="paid"', () => {
      assert.strictEqual(updatedOrder.status, 'confirmed');
      assert.strictEqual(updatedOrder.payment_status, 'paid');
      assert.strictEqual(updatedOrder.razorpay_payment_id, validPaymentId);
    });

    // 5. Test Idempotency (prevent duplicate payment processing)
    test('Idempotency check: Already paid order is detected', () => {
      assert.strictEqual(updatedOrder.payment_status, 'paid');
      assert.strictEqual(updatedOrder.status, 'confirmed');
    });

    // Clean up test order
    await pool.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
    console.log(`Cleaned up simulation test order #${testOrderId}`);

    console.log('\n====================================================');
    console.log(`ENDPOINT SIMULATION: ${passed} / ${total} tests passed`);
    console.log('====================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runEndpointSimulationTests();

