import React, { useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatusType } from '../types';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export const CheckoutView: React.FC = () => {
  const {
    cartItems,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    user,
    userProfile,
    userPrivate,
    savedAddresses,
    saveAddress,
    createVerifiedOrder,
    navigateTo,
    showToast,
    paymentConfig,
  } = useStore();

  const [fullName, setFullName] = useState(userProfile?.displayName || user?.displayName || '');
  const [email, setEmail] = useState(userPrivate?.email || user?.email || '');
  const [phone, setPhone] = useState(userPrivate?.phone || user?.phoneNumber || '');
  const [houseFlat, setHouseFlat] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [country, setCountry] = useState('India');
  const [saveThisAddress, setSaveThisAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">No Items to Checkout</h1>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2]"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const autofillSavedAddress = (addrId: string) => {
    const found = savedAddresses.find((a) => a.id === addrId);
    if (!found) return;
    setFullName(found.fullName);
    setPhone(found.phone);
    setHouseFlat(found.houseFlat);
    setStreet(found.street);
    setArea(found.area);
    setCity(found.city);
    setState(found.state);
    setPinCode(found.pinCode);
    setCountry(found.country);
  };

  const formatFullAddress = () =>
    `${houseFlat}, ${street}, ${area}, ${city}, ${state} - ${pinCode}, ${country}`;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayNotice(null);

    if (!user || !user.emailVerified) {
      showToast(
        'Please sign in with Google or a verified email account before placing your order.',
        'error'
      );
      navigateTo('login');
      return;
    }

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !houseFlat.trim() ||
      !street.trim() ||
      !area.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pinCode.trim()
    ) {
      showToast('Please complete all delivery address fields.', 'error');
      return;
    }

    setProcessingPayment(true);

    try {
      if (saveThisAddress) {
        await saveAddress({
          fullName,
          phone,
          houseFlat,
          street,
          area,
          city,
          state,
          pinCode,
          country,
          isDefault: true,
        });
      }

      if (paymentMethod === 'razorpay') {
        const orderRes = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountInr: cartTotal,
            receipt: `mdart_${Date.now()}`,
          }),
        });

        const orderPayload = await orderRes.json();
        if (!orderRes.ok) {
          setGatewayNotice(
            orderPayload.message ||
              'Razorpay server credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are required in the Secrets panel.'
          );
          showToast('Razorpay credentials required in server configuration.', 'error');
          setProcessingPayment(false);
          return;
        }

        if (!window.Razorpay) {
          setGatewayNotice(
            'Razorpay Checkout SDK could not be loaded. Please check your network connection.'
          );
          setProcessingPayment(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: orderPayload.keyId,
          amount: orderPayload.amount,
          currency: orderPayload.currency,
          name: 'MD ART STUDIO',
          description: 'Handmade Custom Art & Personalized Gifts',
          order_id: orderPayload.orderId,
          prefill: {
            name: fullName,
            email,
            contact: phone,
          },
          theme: {
            color: '#1E3F2F',
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            // Cryptographically verify payment signature on the server before marking Paid
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.verified) {
              showToast(
                verifyData.message || 'Server payment signature verification failed.',
                'error'
              );
              setProcessingPayment(false);
              return;
            }

            await createVerifiedOrder({
              customerName: fullName,
              customerEmail: email,
              customerPhone: phone,
              shippingAddress: formatFullAddress(),
              paymentMethod: 'razorpay',
              paymentGatewayId: verifyData.paymentId,
            });

            setProcessingPayment(false);
            navigateTo('order-confirmation');
          },
          modal: {
            ondismiss: () => {
              setProcessingPayment(false);
            },
          },
        });

        rzp.open();
        return;
      }

      // PayPal International Checkout Flow
      if (paymentMethod === 'paypal') {
        const ppRes = await fetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountInr: cartTotal }),
        });

        const ppData = await ppRes.json();
        if (!ppRes.ok) {
          setGatewayNotice(
            ppData.message ||
              'PayPal server credentials (PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET) are required in the Secrets panel.'
          );
          showToast('PayPal credentials required in server configuration.', 'error');
          setProcessingPayment(false);
          return;
        }

        const captureRes = await fetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: ppData.orderId }),
        });
        const captureData = await captureRes.json();

        if (!captureRes.ok || !captureData.verified) {
          setGatewayNotice(
            captureData.message ||
              `PayPal Order #${ppData.orderId} created ($${ppData.usdAmount} USD). Complete buyer approval in PayPal to capture.`
          );
          setProcessingPayment(false);
          return;
        }

        await createVerifiedOrder({
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: formatFullAddress(),
          paymentMethod: 'paypal',
          paymentGatewayId: captureData.paymentId,
        });

        setProcessingPayment(false);
        navigateTo('order-confirmation');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout error occurred.', 'error');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">Encrypted Checkout</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
          Delivery &amp; Payment Details
        </h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Shipping Address & Payment Gateway Selection */}
        <div className="lg:col-span-7 space-y-8">
          {savedAddresses.length > 0 && (
            <div className="bg-[#F4EFE6] p-4 rounded-2xl border border-[#1C2822]/10 space-y-2">
              <label className="block text-xs font-medium text-[#1C2822]">
                Quick-Fill from Saved Addresses
              </label>
              <select
                onChange={(e) => autofillSavedAddress(e.target.value)}
                defaultValue=""
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              >
                <option value="" disabled>
                  Select a saved address...
                </option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} — {a.houseFlat}, {a.city} ({a.pinCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delivery Address Form */}
          <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">
              01. Recipient &amp; Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">House / Flat Number *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  placeholder="Flat 402, Lotus Enclave"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Street / Road *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="12th Main Road"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Indiranagar"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">City *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">State *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="560038"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            </div>

            {user && (
              <label className="inline-flex items-center gap-2 text-xs text-[#1C2822]/80 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveThisAddress}
                  onChange={(e) => setSaveThisAddress(e.target.checked)}
                  className="rounded border-[#1C2822]/30 text-[#1E3F2F]"
                />
                <span>Save this address to my profile for future orders</span>
              </label>
            )}
          </div>

          {/* Payment Gateway Selector */}
          <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">
              02. Select Official Payment Gateway
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Option */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'bg-[#FAF7F2] border-[#1E3F2F] ring-1 ring-[#1E3F2F]'
                    : 'bg-[#FAF7F2]/60 border-[#1C2822]/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#1C2822]">
                    Razorpay (India)
                  </span>
                  <span className="text-[11px] font-mono text-[#1E3F2F]">
                    {paymentConfig.razorpayConfigured ? 'Active' : 'Needs API Keys'}
                  </span>
                </div>
                <p className="text-xs text-[#1C2822]/70 mt-1">
                  UPI · Google Pay · PhonePe · Paytm · Debit/Credit Cards · Net Banking
                </p>
              </div>

              {/* PayPal Option */}
              <div
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#FAF7F2] border-[#1E3F2F] ring-1 ring-[#1E3F2F]'
                    : 'bg-[#FAF7F2]/60 border-[#1C2822]/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-[#1C2822]">
                    PayPal (International)
                  </span>
                  <span className="text-[11px] font-mono text-[#1E3F2F]">
                    {paymentConfig.paypalConfigured ? 'Active' : 'Needs API Keys'}
                  </span>
                </div>
                <p className="text-xs text-[#1C2822]/70 mt-1">
                  International Cards &amp; PayPal Wallet (Auto-converted to USD)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#1C2822]/70 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#1C2822]/8">
              <ShieldCheck className="w-4 h-4 text-[#1E3F2F] shrink-0 mt-0.5" />
              <p>
                <strong>Zero-Trust Payment Verification:</strong> MD ART STUDIO never stores your
                card numbers, CVV, or UPI PIN. Orders are marked as Paid only after cryptographic
                server-side signature verification.
              </p>
            </div>

            {gatewayNotice && (
              <div className="p-4 rounded-xl bg-[#B93829]/10 border border-[#B93829]/30 text-xs text-[#B93829] space-y-1">
                <p className="font-semibold">Payment Gateway Credentials Required</p>
                <p>{gatewayNotice}</p>
                <p className="text-[#1C2822]/75 pt-1">
                  Set <code className="font-mono">RAZORPAY_KEY_ID</code> &amp;{' '}
                  <code className="font-mono">RAZORPAY_KEY_SECRET</code> (or{' '}
                  <code className="font-mono">PAYPAL_CLIENT_ID</code> &amp;{' '}
                  <code className="font-mono">PAYPAL_CLIENT_SECRET</code>) in the AI Studio Secrets
                  panel.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary & Pay CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">Order Summary</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-[#1C2822]/8 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-[#EAE3D5] shrink-0"
                    />
                    <div>
                      <p className="font-medium text-[#1C2822]">{item.productName}</p>
                      <p className="text-[#1C2822]/60 font-mono tabular-nums">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                      {item.customText && (
                        <p className="text-[11px] text-[#1E3F2F]">Custom: {item.customText}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-semibold">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex justify-between">
                <span className="text-[#1C2822]/70">Subtotal</span>
                <span className="font-mono tabular-nums">₹{cartSubtotal}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#1E3F2F]">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-₹{cartDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#1C2822]/70">Shipping</span>
                <span className="font-mono tabular-nums">
                  {cartShipping === 0 ? 'FREE' : `₹${cartShipping}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-[#1C2822]/10">
                <span className="font-serif text-lg font-semibold">Total Payable</span>
                <span className="text-2xl font-mono tabular-nums font-semibold text-[#1E3F2F]">
                  ₹{cartTotal}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={processingPayment}
              className="w-full py-3.5 px-6 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {processingPayment
                  ? 'Verifying with Payment Gateway...'
                  : paymentMethod === 'razorpay'
                  ? `Pay ₹${cartTotal} via Razorpay`
                  : `Pay ₹${cartTotal} via PayPal`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const OrderConfirmationView: React.FC = () => {
  const { lastCreatedOrder, navigateTo } = useStore();

  const statusSteps: OrderStatusType[] = [
    'Order Placed',
    'Payment Confirmed',
    'Preparing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  if (!lastCreatedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
          Thank You for Supporting MD ART STUDIO ❤️
        </h1>
        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2]"
        >
          View My Orders
        </button>
      </div>
    );
  }

  const currentStepIdx = Math.max(1, statusSteps.indexOf(lastCreatedOrder.orderStatus));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-[#F4EFE6] p-8 sm:p-10 rounded-3xl border border-[#1C2822]/10 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#1E3F2F] text-[#FAF7F2] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E3F2F]">
          Thank You for Supporting MD ART STUDIO ❤️
        </h1>
        <p className="text-sm text-[#1C2822]/75 max-w-xl mx-auto">
          Your handmade order has been confirmed and our studio artists are preparing your bespoke
          piece.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono tabular-nums text-[#1C2822]/80">
          <span>Order ID: {lastCreatedOrder.orderNumber}</span>
          <span aria-hidden="true">·</span>
          <span>Payment Status: {lastCreatedOrder.paymentStatus}</span>
          <span aria-hidden="true">·</span>
          <span>Total Paid: ₹{lastCreatedOrder.totalAmount}</span>
        </div>
      </div>

      {/* 6-Stage Order Status Progression */}
      <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[#1C2822]">
          Live Order Status Progression
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {statusSteps.map((step, idx) => {
            const done = idx <= currentStepIdx;
            return (
              <div
                key={step}
                className={`p-3 rounded-xl border text-xs ${
                  done
                    ? 'bg-[#1E3F2F] text-[#FAF7F2] border-[#1E3F2F]'
                    : 'bg-[#FAF7F2] text-[#1C2822]/50 border-[#1C2822]/10'
                }`}
              >
                <p className="font-mono text-[10px] opacity-75">0{idx + 1}</p>
                <p className="font-medium mt-0.5">{step}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details Summary */}
      <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-4 text-xs">
        <h2 className="font-serif text-xl font-semibold text-[#1C2822]">Order &amp; Delivery Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[#1C2822]/55">Customer</p>
            <p className="font-medium text-[#1C2822] mt-0.5">
              {lastCreatedOrder.customerName} · {lastCreatedOrder.customerPhone}
            </p>
          </div>
          <div>
            <p className="text-[#1C2822]/55">Delivery Address</p>
            <p className="font-medium text-[#1C2822] mt-0.5">{lastCreatedOrder.shippingAddress}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-[#1C2822]/10">
          <p className="text-[#1C2822]/55">Items &amp; Customization</p>
          <p className="font-medium text-[#1C2822] mt-1">{lastCreatedOrder.itemsSummary}</p>
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
          >
            Track in My Orders
          </button>
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className="px-5 py-2.5 text-xs font-medium rounded-xl border border-[#1C2822]/20 text-[#1C2822] cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
