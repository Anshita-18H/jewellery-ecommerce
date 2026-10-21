const assert = require('assert');
const crypto = require('crypto');
const {
  isRazorpayConfigured,
  getRazorpayKeyId,
  verifyPaymentSignature,
} = require('../config/razorpay');

console.log('====================================================');
console.log('AURA FINE JEWELLERY — RAZORPAY INTEGRATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

// ------------------------------------------------------------------
// 1. Signature Verification Unit Tests
// ------------------------------------------------------------------
console.log('--- 1. Cryptographic Signature Verification Tests ---');

// Mock a test secret for mathematical verification
const testSecret = 'test_secret_key_aura_2026';
const originalSecret = process.env.RAZORPAY_KEY_SECRET;
process.env.RAZORPAY_KEY_SECRET = testSecret;

const testOrderId = 'order_DAj24eC95ZpE9G';
const testPaymentId = 'pay_29QQoUBcxrhErF';

// Compute valid signature
const validSignature = crypto
  .createHmac('sha256', testSecret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest('hex');

runTest('Valid HMAC-SHA256 signature is accepted', () => {
  const isValid = verifyPaymentSignature({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: validSignature,
  });
  assert.strictEqual(isValid, true, 'Valid signature should return true');
});

runTest('Tampered signature is rejected', () => {
  const tamperedSignature = validSignature.slice(0, -4) + '0000';
  const isValid = verifyPaymentSignature({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: tamperedSignature,
  });
  assert.strictEqual(isValid, false, 'Tampered signature should return false');
});

runTest('Mismatched order_id in signature payload is rejected', () => {
  const wrongOrderId = 'order_OTHER_ORDER_ID';
  const isValid = verifyPaymentSignature({
    razorpay_order_id: wrongOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: validSignature,
  });
  assert.strictEqual(isValid, false, 'Mismatched order ID should fail verification');
});

runTest('Mismatched payment_id in signature payload is rejected', () => {
  const wrongPaymentId = 'pay_OTHER_PAYMENT_ID';
  const isValid = verifyPaymentSignature({
    razorpay_order_id: testOrderId,
    razorpay_payment_id: wrongPaymentId,
    razorpay_signature: validSignature,
  });
  assert.strictEqual(isValid, false, 'Mismatched payment ID should fail verification');
});

runTest('Missing parameters return false gracefully without crashing', () => {
  assert.strictEqual(verifyPaymentSignature({}), false);
  assert.strictEqual(verifyPaymentSignature({ razorpay_order_id: 'x' }), false);
  assert.strictEqual(verifyPaymentSignature({ razorpay_signature: 'y' }), false);
});

// Restore original secret
process.env.RAZORPAY_KEY_SECRET = originalSecret;

// ------------------------------------------------------------------
// 2. Configuration & Public Key Exposure Safety Tests
// ------------------------------------------------------------------
console.log('\n--- 2. Credentials Exposure & Safety Tests ---');

runTest('getRazorpayKeyId never returns or exposes the secret key', () => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_sampleKey123';
  const keyId = getRazorpayKeyId();
  assert.strictEqual(keyId, 'rzp_test_sampleKey123');
  assert.notStrictEqual(keyId, process.env.RAZORPAY_KEY_SECRET);
});

runTest('isRazorpayConfigured correctly reflects presence of both key and secret', () => {
  const origId = process.env.RAZORPAY_KEY_ID;
  const origSec = process.env.RAZORPAY_KEY_SECRET;

  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  assert.strictEqual(isRazorpayConfigured(), false);

  process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
  assert.strictEqual(isRazorpayConfigured(), false);

  process.env.RAZORPAY_KEY_SECRET = 'secret_456';
  assert.strictEqual(isRazorpayConfigured(), true);

  process.env.RAZORPAY_KEY_ID = origId;
  process.env.RAZORPAY_KEY_SECRET = origSec;
});

// ------------------------------------------------------------------
// 3. Database Schema Verification
// ------------------------------------------------------------------
console.log('\n--- 3. Database Schema Verification ---');

async function testDatabaseSchema() {
  const pool = require('../config/db');
  try {
    const [cols] = await pool.query('DESCRIBE orders');
    const colNames = cols.map((c) => c.Field);

    const requiredColumns = [
      'razorpay_order_id',
      'razorpay_payment_id',
      'razorpay_signature',
      'payment_status',
      'payment_method',
    ];

    for (const col of requiredColumns) {
      runTest(`Database column "orders.${col}" exists`, () => {
        assert.ok(
          colNames.includes(col),
          `Column ${col} must exist in MySQL orders table`
        );
      });
    }

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (dbErr) {
    console.error('Database connection error during test:', dbErr.message);
    process.exit(1);
  }
}

testDatabaseSchema();

