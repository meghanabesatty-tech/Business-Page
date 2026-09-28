import React, { useState } from 'react';
import { ArrowRight, Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartView: React.FC = () => {
  const {
    cartItems,
    updateCartItemQuantity,
    removeFromCart,
    navigateTo,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (applyCouponCode(couponInput)) {
      setCouponInput('');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#1C2822]/10 flex items-center justify-center mx-auto text-[#1E3F2F]">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
            Your Studio Cart is Empty
          </h1>
          <p className="text-xs text-[#1C2822]/70 max-w-md mx-auto">
            Explore our hand-painted t-shirts, cotton handkerchiefs, floral embroidery hoops, mini
            canvases, and customized 30-card UNO decks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C2822]/10 pb-6">
        <div>
          <p className="text-xs text-[#8C6D46] font-medium">Shopping Bag</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
            Your Handmade Selections
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="text-xs font-medium text-[#1E3F2F] hover:underline underline-offset-4 self-start sm:self-auto cursor-pointer"
        >
          ← Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Itemized Cart List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#F4EFE6] p-4 sm:p-5 rounded-2xl border border-[#1C2822]/8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  referrerPolicy="no-referrer"
                  onClick={() => navigateTo('product', { productId: item.productId })}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-[#EAE3D5] shrink-0 cursor-pointer"
                />
                <div className="space-y-1.5">
                  <h3
                    onClick={() => navigateTo('product', { productId: item.productId })}
                    className="font-serif text-lg font-semibold text-[#1C2822] hover:text-[#1E3F2F] cursor-pointer"
                  >
                    {item.productName}
                  </h3>
                  <p className="text-xs font-mono tabular-nums text-[#1E3F2F] font-semibold">
                    ₹{item.price} each
                  </p>

                  {/* Selected Customization Summary */}
                  {(item.customText ||
                    item.colorPreference ||
                    item.specialInstructions ||
                    item.referenceImageData) && (
                    <div className="pt-1 text-xs text-[#1C2822]/75 space-y-0.5">
                      {item.customText && (
                        <p>
                          <span className="text-[#1C2822]/55">Custom Text:</span> {item.customText}
                        </p>
                      )}
                      {item.colorPreference && (
                        <p>
                          <span className="text-[#1C2822]/55">Colors:</span> {item.colorPreference}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p>
                          <span className="text-[#1C2822]/55">Notes:</span>{' '}
                          {item.specialInstructions}
                        </p>
                      )}
                      {item.referenceImageData && (
                        <div className="flex items-center gap-2 pt-1">
                          <img
                            src={item.referenceImageData}
                            alt="Custom reference"
                            className="w-8 h-8 rounded object-cover border border-[#1C2822]/20"
                          />
                          <span className="text-[11px] text-[#1E3F2F]">Reference Photo Attached</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1C2822]/8">
                <div className="flex items-center border border-[#1C2822]/15 rounded-xl bg-[#FAF7F2]">
                  <button
                    type="button"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="p-2 text-[#1C2822]/70 hover:text-[#1C2822] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono tabular-nums font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="p-2 text-[#1C2822]/70 hover:text-[#1C2822] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-mono tabular-nums font-semibold text-[#1C2822]">
                    ₹{item.price * item.quantity}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove item"
                  className="p-2 text-[#1C2822]/50 hover:text-[#B93829] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary & Coupon */}
        <div className="lg:col-span-4 bg-[#F4EFE6] p-6 rounded-3xl border border-[#1C2822]/10 space-y-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">Order Summary</h2>

          {/* Coupon Form */}
          <div className="space-y-2">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code (e.g. MDART10)"
                className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl uppercase focus:outline-none focus:border-[#1E3F2F]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-xl bg-[#EAE3D5] text-[#1C2822] hover:bg-[#DED4C1] transition-colors whitespace-nowrap cursor-pointer"
              >
                Apply
              </button>
            </form>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs text-[#1E3F2F] bg-[#FAF7F2] px-3 py-1.5 rounded-lg">
                <span>
                  Code <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discountPercent}% OFF)
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-[#B93829] hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs border-y border-[#1C2822]/10 py-4">
            <div className="flex justify-between">
              <span className="text-[#1C2822]/70">Subtotal</span>
              <span className="font-mono tabular-nums font-medium">₹{cartSubtotal}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#1E3F2F]">
                <span>Coupon Discount</span>
                <span className="font-mono tabular-nums font-medium">-₹{cartDiscount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#1C2822]/70">Pan-India Shipping</span>
              <span className="font-mono tabular-nums font-medium">
                {cartShipping === 0 ? 'FREE' : `₹${cartShipping}`}
              </span>
            </div>
            {cartShipping > 0 && (
              <p className="text-[11px] text-[#8C6D46]">
                Add ₹{Math.max(0, 499 - (cartSubtotal - cartDiscount))} more for FREE shipping!
              </p>
            )}
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-serif text-lg font-semibold text-[#1C2822]">Total Amount</span>
            <span className="text-xl font-mono tabular-nums font-semibold text-[#1E3F2F]">
              ₹{cartTotal}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('checkout')}
            className="w-full py-3.5 px-5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Secure Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const WishlistView: React.FC = () => {
  const { wishlistItems, products, toggleWishlist, addToCart, navigateTo } = useStore();

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#1C2822]/10 flex items-center justify-center mx-auto text-[#B93829]">
          <Heart className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs text-[#1C2822]/70 max-w-md mx-auto">
            Tap the heart icon on any hand-painted tee, embroidery hoop, or custom UNO deck to save
            it here for later.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors cursor-pointer"
        >
          Explore Handmade Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">Saved Favorites</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
          My Wishlist ({wishlistItems.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((w) => {
          const fullProduct = products.find((p) => p.id === w.productId) || {
            id: w.productId,
            name: w.productName,
            slug: w.productId,
            categoryId: 'cat_tshirt',
            categoryName: w.categoryName,
            price: w.price,
            compareAtPrice: w.price,
            description: '',
            materials: 'Handmade',
            size: 'Standard',
            stock: 10,
            inStock: true,
            customizable: true,
            featured: false,
            bestSeller: false,
            images: [w.productImage],
            keywords: '',
          };

          return (
            <div
              key={w.id}
              className="bg-[#F4EFE6] rounded-2xl overflow-hidden border border-[#1C2822]/8 flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-[#EAE3D5] overflow-hidden">
                <img
                  src={w.productImage}
                  alt={w.productName}
                  referrerPolicy="no-referrer"
                  onClick={() => navigateTo('product', { productId: w.productId })}
                  className="w-full h-full object-cover cursor-pointer"
                />
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-[#1C2822]/60">{w.categoryName}</p>
                  <h3
                    onClick={() => navigateTo('product', { productId: w.productId })}
                    className="font-serif text-lg font-semibold text-[#1C2822] hover:text-[#1E3F2F] cursor-pointer mt-0.5"
                  >
                    {w.productName}
                  </h3>
                  <p className="text-sm font-mono tabular-nums font-semibold text-[#1E3F2F] mt-1">
                    ₹{w.price}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1C2822]/8">
                  <button
                    type="button"
                    onClick={async () => {
                      await addToCart(fullProduct, 1);
                      await toggleWishlist(fullProduct);
                    }}
                    className="flex-1 py-2.5 px-4 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors cursor-pointer"
                  >
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(fullProduct)}
                    aria-label="Remove from wishlist"
                    className="p-2.5 rounded-xl border border-[#1C2822]/15 text-[#1C2822]/60 hover:text-[#B93829] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
