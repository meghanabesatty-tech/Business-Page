import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '2mb' }));

// Simple in-memory rate limiter for API routes
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'local';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60;

  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment and try again.',
    });
  }
  record.count += 1;
  return next();
}

app.use('/api', apiRateLimiter);

function isRealSecret(val: string | undefined, placeholderPrefix: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.includes('YOUR_') || trimmed.startsWith(placeholderPrefix)) return false;
  return true;
}

// Public payment & studio configuration endpoint (NEVER exposes secrets)
app.get('/api/payment-config', (_req: Request, res: Response) => {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const paypalClientId = process.env.PAYPAL_CLIENT_ID?.trim() || '';
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  const paypalMode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';

  const razorpayConfigured =
    isRealSecret(razorpayKeyId, 'rzp_test_YOUR') &&
    isRealSecret(razorpayKeySecret, 'YOUR_RAZORPAY');

  const paypalConfigured =
    isRealSecret(paypalClientId, 'YOUR_PAYPAL') &&
    isRealSecret(paypalClientSecret, 'YOUR_PAYPAL');

  res.json({
    razorpayConfigured,
    razorpayKeyId: razorpayConfigured ? razorpayKeyId : '',
    paypalConfigured,
    paypalClientId: paypalConfigured ? paypalClientId : '',
    paypalMode,
    studioEmail: process.env.STUDIO_EMAIL || 'mdartstudio0608@gmail.com',
    studioWhatsapp: process.env.STUDIO_WHATSAPP || '919876543210',
  });
});

// Razorpay: Create Server-Side Order
app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!isRealSecret(keyId, 'rzp_test_YOUR') || !isRealSecret(keySecret, 'YOUR_RAZORPAY')) {
      return res.status(503).json({
        error: 'RAZORPAY_CREDENTIALS_MISSING',
        message:
          'Razorpay API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured on the server yet. Add your live or test Razorpay keys in the Secrets panel to enable live Razorpay checkout.',
      });
    }

    const { amountInr, receipt } = req.body;
    const numericAmount = Number(amountInr);
    if (!Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 500000) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'Order amount must be between ₹1 and ₹5,00,000.',
      });
    }

    const amountPaise = Math.round(numericAmount * 100);
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: String(receipt || `mdart_${Date.now()}`).slice(0, 40),
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok || !data.id) {
      return res.status(response.status || 500).json({
        error: 'RAZORPAY_ORDER_CREATION_FAILED',
        message: 'Failed to create Razorpay order with the configured credentials.',
        details: data,
      });
    }

    return res.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error while creating Razorpay order.',
    });
  }
});

// Razorpay: Cryptographic Payment Signature Verification
app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!isRealSecret(keySecret, 'YOUR_RAZORPAY') || !keySecret) {
      return res.status(503).json({
        verified: false,
        error: 'RAZORPAY_CREDENTIALS_MISSING',
        message: 'Razorpay server secret is not configured.',
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string' ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        verified: false,
        error: 'INVALID_PAYLOAD',
        message: 'Missing required Razorpay verification fields.',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(razorpay_signature, 'utf8');

    const isMatch =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isMatch) {
      return res.status(400).json({
        verified: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Razorpay payment signature verification failed.',
      });
    }

    return res.json({
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return res.status(500).json({
      verified: false,
      error: 'VERIFICATION_ERROR',
      message: 'Failed to verify Razorpay payment on server.',
    });
  }
});

// Razorpay: Webhook Signature Verification
app.post('/api/payments/razorpay/webhook', (req: Request, res: Response) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  const signature = req.headers['x-razorpay-signature'];

  if (!webhookSecret || !isRealSecret(webhookSecret, 'YOUR_RAZORPAY') || typeof signature !== 'string') {
    return res.status(400).json({ status: 'unverified_webhook' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');

  if (
    expectedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    return res.status(401).json({ error: 'INVALID_WEBHOOK_SIGNATURE' });
  }

  return res.json({ status: 'webhook_verified' });
});

// PayPal Helper: Get OAuth2 Access Token
async function getPayPalAccessToken(): Promise<{ token: string; baseUrl: string } | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!isRealSecret(clientId, 'YOUR_PAYPAL') || !isRealSecret(clientSecret, 'YOUR_PAYPAL')) {
    return null;
  }

  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) return null;
  return { token: data.access_token, baseUrl };
}

// PayPal: Create Order (International Customers)
app.post('/api/payments/paypal/create-order', async (req: Request, res: Response) => {
  try {
    const authData = await getPayPalAccessToken();
    if (!authData) {
      return res.status(503).json({
        error: 'PAYPAL_CREDENTIALS_MISSING',
        message:
          'PayPal API credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET) are not configured on the server yet. Add your PayPal credentials in the Secrets panel to enable international PayPal payments.',
      });
    }

    const { amountInr } = req.body;
    const numericInr = Number(amountInr);
    if (!Number.isFinite(numericInr) || numericInr < 1) {
      return res.status(400).json({ error: 'INVALID_AMOUNT', message: 'Invalid order amount.' });
    }

    // Convert INR to approximate USD for international PayPal checkout (min $1.00)
    const usdAmount = Math.max(1, Number((numericInr / 84).toFixed(2))).toFixed(2);

    const response = await fetch(`${authData.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: 'MD ART STUDIO Handmade Custom Artwork Order',
            amount: {
              currency_code: 'USD',
              value: usdAmount,
            },
          },
        ],
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok || !data.id) {
      return res.status(response.status || 500).json({
        error: 'PAYPAL_ORDER_FAILED',
        message: 'Could not create PayPal order.',
        details: data,
      });
    }

    return res.json({ orderId: data.id, usdAmount });
  } catch (err) {
    console.error('PayPal create-order error:', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error creating PayPal order.',
    });
  }
});

// PayPal: Capture & Verify Order on Server
app.post('/api/payments/paypal/capture-order', async (req: Request, res: Response) => {
  try {
    const authData = await getPayPalAccessToken();
    if (!authData) {
      return res.status(503).json({
        verified: false,
        error: 'PAYPAL_CREDENTIALS_MISSING',
        message: 'PayPal server credentials are not configured.',
      });
    }

    const { orderId } = req.body;
    if (typeof orderId !== 'string' || !orderId) {
      return res.status(400).json({
        verified: false,
        error: 'INVALID_ORDER_ID',
        message: 'Missing PayPal order ID.',
      });
    }

    const response = await fetch(
      `${authData.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.token}`,
        },
      }
    );

    const data = (await response.json()) as { id?: string; status?: string };
    if (!response.ok || data.status !== 'COMPLETED') {
      return res.status(400).json({
        verified: false,
        error: 'PAYPAL_CAPTURE_NOT_COMPLETED',
        message: 'PayPal order capture could not be verified as COMPLETED.',
      });
    }

    return res.json({
      verified: true,
      paymentId: data.id || orderId,
      status: data.status,
    });
  } catch (err) {
    console.error('PayPal capture error:', err);
    return res.status(500).json({
      verified: false,
      error: 'PAYPAL_CAPTURE_ERROR',
      message: 'Server error while capturing PayPal order.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MD ART STUDIO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
