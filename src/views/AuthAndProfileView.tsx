import React, { useState } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import {
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Palette,
  Phone,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatusType } from '../types';

export const AuthView: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    sendMobileOtp,
    verifyMobileOtp,
    navigateTo,
    showToast,
  } = useStore();

  const [authTab, setAuthTab] = useState<'email-login' | 'email-signup' | 'mobile-otp' | 'forgot'>(
    'email-login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setProviderNotice(null);
    try {
      await loginWithGoogle();
      navigateTo('profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google Sign-In failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProviderNotice(null);
    try {
      if (authTab === 'email-login') {
        await loginWithEmail(email, password);
        navigateTo('profile');
      } else if (authTab === 'email-signup') {
        await signUpWithEmail(name, email, phone, password);
        navigateTo('profile');
      } else if (authTab === 'forgot') {
        await resetPassword(email);
        setAuthTab('email-login');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.includes('operation-not-allowed')) {
        setProviderNotice(
          'Email/Password Sign-In is not enabled in your Firebase Console yet. Enable "Email/Password" under Firebase Console → Authentication → Sign-in method, or click "Continue with Google" above (which is already provisioned and active).'
        );
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProviderNotice(null);
    try {
      const conf = await sendMobileOtp(phone, 'recaptcha-container');
      setOtpConfirmation(conf);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send SMS OTP.';
      setProviderNotice(
        'Mobile SMS OTP requires enabling the "Phone" provider and billing/SMS quota in Firebase Console → Authentication → Sign-in method. You can sign in immediately using "Continue with Google" above.'
      );
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpConfirmation) return;
    setLoading(true);
    try {
      await verifyMobileOtp(otpConfirmation, otpCode, name);
      navigateTo('profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid or expired OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-[#F4EFE6] p-7 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-6">
        <div className="text-center space-y-1.5">
          <p className="text-xs text-[#8C6D46] font-medium">MD ART STUDIO Collector Account</p>
          <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
            Welcome to the Studio
          </h1>
          <p className="text-xs text-[#1C2822]/70">
            Sign in to save your cart, wishlist, custom artwork briefs, and track live orders.
          </p>
        </div>

        {/* Primary Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue with Google (Instant Verified Access)</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#1C2822]/10" />
          <span className="flex-shrink mx-3 text-[11px] text-[#1C2822]/50">
            or choose sign-in method
          </span>
          <div className="flex-grow border-t border-[#1C2822]/10" />
        </div>

        {/* Interactive Method Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE3D5] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthTab('email-login');
              setProviderNotice(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              authTab === 'email-login' || authTab === 'forgot'
                ? 'bg-[#FAF7F2] text-[#1C2822]'
                : 'text-[#1C2822]/65'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('email-signup');
              setProviderNotice(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              authTab === 'email-signup' ? 'bg-[#FAF7F2] text-[#1C2822]' : 'text-[#1C2822]/65'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('mobile-otp');
              setProviderNotice(null);
            }}
            className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              authTab === 'mobile-otp' ? 'bg-[#FAF7F2] text-[#1C2822]' : 'text-[#1C2822]/65'
            }`}
          >
            Mobile OTP
          </button>
        </div>

        {providerNotice && (
          <div className="p-3.5 rounded-xl bg-[#8C6D46]/15 border border-[#8C6D46]/30 text-xs text-[#1C2822] leading-relaxed">
            {providerNotice}
          </div>
        )}

        {/* Email Login / Sign Up / Forgot Password Form */}
        {(authTab === 'email-login' || authTab === 'email-signup' || authTab === 'forgot') && (
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {authTab === 'email-signup' && (
              <>
                <div>
                  <label className="block text-xs text-[#1C2822]/75 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#1C2822]/75 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>

            {authTab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#1C2822]/75">Password *</label>
                  {authTab === 'email-login' && (
                    <button
                      type="button"
                      onClick={() => setAuthTab('forgot')}
                      className="text-[11px] text-[#1E3F2F] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#FAF7F2] border border-[#1E3F2F] text-[#1E3F2F] hover:bg-[#1E3F2F] hover:text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
            >
              {loading
                ? 'Please wait...'
                : authTab === 'email-login'
                ? 'Login with Email'
                : authTab === 'email-signup'
                ? 'Create Account'
                : 'Send Password Reset Link'}
            </button>
          </form>
        )}

        {/* Mobile OTP Form */}
        {authTab === 'mobile-otp' && (
          <div className="space-y-3.5">
            <div id="recaptcha-container" />
            {!otpConfirmation ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-[#1C2822]/75 mb-1"> Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional display name"
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#1C2822]/75 mb-1">
                    Mobile Number (with +91) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#FAF7F2] border border-[#1E3F2F] text-[#1E3F2F] hover:bg-[#1E3F2F] hover:text-[#FAF7F2] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-[#1C2822]/75 mb-1">
                    Enter 6-Digit SMS OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono tracking-widest text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#1E3F2F] text-[#FAF7F2] text-xs font-semibold cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Login'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfileView: React.FC = () => {
  const {
    user,
    userProfile,
    userPrivate,
    isAdmin,
    logout,
    updateUserProfileDetails,
    orders,
    savedAddresses,
    saveAddress,
    deleteAddress,
    customRequests,
    navigateTo,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'orders' | 'addresses' | 'custom-requests' | 'settings'
  >('orders');

  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(userPrivate?.phone || user?.phoneNumber || '');

  // New Address Form
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  if (!user) {
    return <AuthView />;
  }

  const statusSteps: OrderStatusType[] = [
    'Order Placed',
    'Payment Confirmed',
    'Preparing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAddress({
      fullName: addrName,
      phone: addrPhone,
      houseFlat,
      street,
      area,
      city,
      state,
      pinCode,
      country: 'India',
      isDefault: true,
    });
    setAddrName('');
    setAddrPhone('');
    setHouseFlat('');
    setStreet('');
    setArea('');
    setCity('');
    setState('');
    setPinCode('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top User Header */}
      <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#8C6D46] font-medium">
            <span>Collector Account</span>
            <span aria-hidden="true">·</span>
            <span>{isAdmin ? 'Studio Administrator' : 'Verified Member'}</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
            {userProfile?.displayName || user.displayName || 'Art Collector'}
          </h1>
          <p className="text-xs text-[#1C2822]/70">{user.email || user.phoneNumber}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Open Admin Dashboard</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigateTo('wishlist')}
            className="px-4 py-2.5 text-xs font-medium rounded-xl bg-[#FAF7F2] border border-[#1C2822]/15 text-[#1C2822] hover:border-[#1E3F2F] transition-colors cursor-pointer"
          >
            My Wishlist
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 text-xs font-medium rounded-xl border border-[#B93829]/30 text-[#B93829] hover:bg-[#B93829]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Interactive Profile Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-medium rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#1E3F2F] text-[#FAF7F2]'
              : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom-requests')}
          className={`px-4 py-2.5 text-xs font-medium rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'custom-requests'
              ? 'bg-[#1E3F2F] text-[#FAF7F2]'
              : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Custom Art Requests ({customRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2.5 text-xs font-medium rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-[#1E3F2F] text-[#FAF7F2]'
              : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Saved Addresses ({savedAddresses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-medium rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#1E3F2F] text-[#FAF7F2]'
              : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* Tab 1: My Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-[#F4EFE6] p-10 rounded-2xl border border-[#1C2822]/8 text-center space-y-3">
              <p className="font-serif text-xl text-[#1C2822]">No orders placed yet</p>
              <button
                type="button"
                onClick={() => navigateTo('shop')}
                className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
              >
                Explore Handmade Shop
              </button>
            </div>
          ) : (
            orders.map((ord) => {
              const stepIdx = Math.max(0, statusSteps.indexOf(ord.orderStatus));
              return (
                <div
                  key={ord.id}
                  className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2822]/10 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#1E3F2F]">
                        Order {ord.orderNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Payment: {ord.paymentStatus}</span>
                      <span aria-hidden="true">·</span>
                      <span>Status: {ord.orderStatus}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-sm text-[#1E3F2F]">
                      ₹{ord.totalAmount}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-[#1C2822]/80">
                    <p>
                      <strong>Items:</strong> {ord.itemsSummary}
                    </p>
                    <p>
                      <strong>Delivery Address:</strong> {ord.shippingAddress}
                    </p>
                  </div>

                  {ord.orderStatus !== 'Cancelled' && (
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                      {statusSteps.map((st, idx) => (
                        <div
                          key={st}
                          className={`p-2 rounded-lg text-[11px] border ${
                            idx <= stepIdx
                              ? 'bg-[#1E3F2F] text-[#FAF7F2] border-[#1E3F2F]'
                              : 'bg-[#FAF7F2] text-[#1C2822]/45 border-[#1C2822]/10'
                          }`}
                        >
                          {idx + 1}. {st}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Custom Art Requests */}
      {activeTab === 'custom-requests' && (
        <div className="space-y-4">
          {customRequests.length === 0 ? (
            <div className="bg-[#F4EFE6] p-10 rounded-2xl border border-[#1C2822]/8 text-center space-y-3">
              <p className="font-serif text-xl text-[#1C2822]">No bespoke requests submitted yet</p>
              <button
                type="button"
                onClick={() => navigateTo('custom-art')}
                className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
              >
                Request Custom Art
              </button>
            </div>
          ) : (
            customRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 flex flex-col sm:flex-row justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#8C6D46] font-medium">
                    <span>{req.productType}</span>
                    <span aria-hidden="true">·</span>
                    <span>Size: {req.preferredSize}</span>
                    <span aria-hidden="true">·</span>
                    <span>Budget: {req.budget}</span>
                  </div>
                  <p className="text-[#1C2822] font-medium">{req.description}</p>
                  {req.colorPreference && (
                    <p className="text-[#1C2822]/70">Colors: {req.colorPreference}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 self-start">
                  {req.referenceImageData && (
                    <img
                      src={req.referenceImageData}
                      alt="Reference"
                      className="w-14 h-14 rounded-xl object-cover border border-[#1C2822]/15"
                    />
                  )}
                  <span className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#1C2822]/15 font-medium text-[#1E3F2F]">
                    Status: {req.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">Saved Addresses</h2>
            {savedAddresses.length === 0 ? (
              <p className="text-xs text-[#1C2822]/65">No saved addresses yet.</p>
            ) : (
              savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-[#1C2822]">
                      {addr.fullName} · {addr.phone}
                    </p>
                    <p className="text-[#1C2822]/75">
                      {addr.houseFlat}, {addr.street}, {addr.area}
                    </p>
                    <p className="text-[#1C2822]/75">
                      {addr.city}, {addr.state} - {addr.pinCode}, {addr.country}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="p-2 text-[#1C2822]/50 hover:text-[#B93829] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSaveAddress}
            className="lg:col-span-6 bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3.5"
          >
            <h3 className="font-serif text-xl font-semibold text-[#1C2822]">Add New Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={addrName}
                onChange={(e) => setAddrName(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
              <input
                type="tel"
                required
                placeholder="Mobile Number *"
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="House / Flat No. *"
                value={houseFlat}
                onChange={(e) => setHouseFlat(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Street / Road *"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Area / Locality *"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="City *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="State *"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="PIN Code *"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
            >
              Save Address
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Account Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-[#F4EFE6] p-6 sm:p-8 rounded-2xl border border-[#1C2822]/10 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">Account Settings</h2>
          <div>
            <label className="block text-xs text-[#1C2822]/75 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs text-[#1C2822]/75 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => updateUserProfileDetails(displayName, phone)}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      )}
    </div>
  );
};
