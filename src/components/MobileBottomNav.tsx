import React from 'react';
import { Heart, Home, ShoppingBag, Store, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const { currentView, navigateTo, cartItems, wishlistItems, user } = useStore();
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#1C2822]/10 h-14 px-2 flex items-center justify-around"
    >
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
          currentView === 'home' ? 'text-[#1E3F2F] font-semibold' : 'text-[#1C2822]/65'
        }`}
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => navigateTo('shop', { categoryId: 'all' })}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
          currentView === 'shop' ? 'text-[#1E3F2F] font-semibold' : 'text-[#1C2822]/65'
        }`}
      >
        <Store className="w-4 h-4" />
        <span>Shop</span>
      </button>

      <button
        type="button"
        onClick={() => navigateTo('wishlist')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
          currentView === 'wishlist' ? 'text-[#1E3F2F] font-semibold' : 'text-[#1C2822]/65'
        }`}
      >
        <Heart className="w-4 h-4" />
        <span className="tabular-nums">
          Wishlist {wishlistItems.length > 0 ? `(${wishlistItems.length})` : ''}
        </span>
      </button>

      <button
        type="button"
        onClick={() => navigateTo('cart')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
          currentView === 'cart' ? 'text-[#1E3F2F] font-semibold' : 'text-[#1C2822]/65'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="tabular-nums">Cart {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
      </button>

      <button
        type="button"
        onClick={() => navigateTo(user ? 'profile' : 'login')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
          currentView === 'profile' || currentView === 'login' || currentView === 'admin'
            ? 'text-[#1E3F2F] font-semibold'
            : 'text-[#1C2822]/65'
        }`}
      >
        <User className="w-4 h-4" />
        <span>{user ? 'Profile' : 'Login'}</span>
      </button>
    </nav>
  );
};
