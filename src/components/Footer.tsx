import React from 'react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { navigateTo, categories, isAdmin, paymentConfig } = useStore();

  return (
    <footer className="bg-[#162D22] text-[#FAF7F2] border-t border-[#1C2822]/10 pb-20 md:pb-12 pt-14 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#FAF7F2]/15">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#FAF7F2]">
              MD ART STUDIO
            </h3>
            <p className="text-sm text-[#FAF7F2]/75 leading-relaxed">
              Handmade With Love, Made Just For You. Bespoke hand-painted t-shirts, cotton
              handkerchiefs, floral hoop embroidery, mini canvases, 3D texture art, and custom UNO
              card decks crafted across India.
            </p>
            <div className="pt-2 text-xs text-[#FAF7F2]/70 space-y-1">
              <p>Instagram: @md_art_studio0608</p>
              <p>Email: {paymentConfig.studioEmail}</p>
            </div>
          </div>

          {/* Column 2: Handmade Collections */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-medium text-[#E5D5B5]">Handmade Collections</h4>
            <ul className="space-y-2 text-sm text-[#FAF7F2]/80">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo('shop', { categoryId: cat.id })}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {cat.name}{' '}
                    <span className="text-xs text-[#FAF7F2]/55 font-mono tabular-nums">
                      · ₹{cat.startingPrice}+
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Studio Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-medium text-[#E5D5B5]">Studio & Account</h4>
            <ul className="space-y-2 text-sm text-[#FAF7F2]/80">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('custom-art')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Request Custom Art
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About MD ART STUDIO
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact & WhatsApp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('profile')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Orders & Profile
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => navigateTo('admin')}
                    className="text-[#E5D5B5] hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-medium text-[#E5D5B5]">Studio Policies</h4>
            <ul className="space-y-2 text-sm text-[#FAF7F2]/80">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('privacy-policy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('shipping-policy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('refund-policy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Return & Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('cancellation-policy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('custom-policy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Custom Product Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF7F2]/60">
          <p>© {new Date().getFullYear()} MD ART STUDIO (@md_art_studio0608). All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Razorpay Secured (UPI · GPay · PhonePe · Cards)</span>
            <span aria-hidden="true">·</span>
            <span>PayPal International</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
