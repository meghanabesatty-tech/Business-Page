/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { N8nChatWidget } from './components/N8nChatWidget';
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView, WishlistView } from './views/CartAndWishlistView';
import { CheckoutView, OrderConfirmationView } from './views/CheckoutAndOrdersView';
import { CustomArtRequestView } from './views/CustomArtRequestView';
import { AuthView, ProfileView } from './views/AuthAndProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AboutView, ContactView, PolicyView } from './views/InfoAndPoliciesView';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1C2822] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#F4EFE6] p-8 rounded-3xl border border-[#1C2822]/15 space-y-4 text-center">
            <h1 className="font-serif text-3xl font-semibold text-[#1E3F2F]">
              MD ART STUDIO Notice
            </h1>
            <p className="text-xs text-[#1C2822]/80 break-words font-mono bg-[#FAF7F2] p-3 rounded-xl">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainRouter: React.FC = () => {
  const { currentView, toastMessage } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C2822]">
      <Navbar />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 max-w-sm bg-[#1E3F2F] text-[#FAF7F2] px-4 py-3 rounded-xl shadow-lg border border-[#FAF7F2]/15 text-xs font-medium">
          {toastMessage.text}
        </div>
      )}

      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'shop' && <ShopView />}
        {currentView === 'product' && <ProductDetailView />}
        {currentView === 'cart' && <CartView />}
        {currentView === 'wishlist' && <WishlistView />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'order-confirmation' && <OrderConfirmationView />}
        {currentView === 'custom-art' && <CustomArtRequestView />}
        {currentView === 'login' && <AuthView />}
        {currentView === 'profile' && <ProfileView />}
        {currentView === 'admin' && <AdminDashboardView />}
        {currentView === 'about' && <AboutView />}
        {currentView === 'contact' && <ContactView />}
        {(currentView === 'privacy-policy' ||
          currentView === 'terms' ||
          currentView === 'shipping-policy' ||
          currentView === 'refund-policy' ||
          currentView === 'cancellation-policy' ||
          currentView === 'custom-policy') && <PolicyView policyType={currentView} />}
      </main>

      <Footer />
      <N8nChatWidget />
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainRouter />
      </StoreProvider>
    </ErrorBoundary>
  );
}
