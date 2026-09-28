import React, { useState } from 'react';
import { Heart, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Navbar: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartItems,
    wishlistItems,
    user,
    isAdmin,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [searchOpen, setSearchOpen] = useState(false);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('shop', { search: searchQuery });
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#1C2822]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="font-serif text-2xl sm:text-[26px] font-semibold tracking-tight text-[#1E3F2F] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1E3F2F]"
        >
          MD ART STUDIO
        </button>

        {/* Zone 2: 4-6 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#1C2822]/80">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                : 'hover:text-[#1E3F2F]'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigateTo('shop', { categoryId: 'all' })}
            className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
              currentView === 'shop'
                ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                : 'hover:text-[#1E3F2F]'
            }`}
          >
            Shop
          </button>
          <button
            type="button"
            onClick={() => navigateTo('custom-art')}
            className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
              currentView === 'custom-art'
                ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                : 'hover:text-[#1E3F2F]'
            }`}
          >
            Custom Art
          </button>
          <button
            type="button"
            onClick={() => navigateTo('about')}
            className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
              currentView === 'about'
                ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                : 'hover:text-[#1E3F2F]'
            }`}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => navigateTo('contact')}
            className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
              currentView === 'contact'
                ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                : 'hover:text-[#1E3F2F]'
            }`}
          >
            Contact
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'text-[#1E3F2F] font-semibold underline underline-offset-8 decoration-[#1E3F2F]'
                  : 'text-[#8C6D46] hover:text-[#1E3F2F]'
              }`}
            >
              Admin Studio
            </button>
          )}
        </nav>

        {/* Zone 3: Interactive Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search t-shirts, UNO, canvas..."
                autoFocus
                className="w-40 sm:w-56 px-3 py-1.5 text-xs bg-white border border-[#1C2822]/20 rounded-lg text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-1.5 text-[#1C2822]/60 hover:text-[#1C2822] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="p-2 text-[#1C2822]/80 hover:text-[#1E3F2F] rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigateTo('wishlist')}
            aria-label="Wishlist"
            className="relative p-2 text-[#1C2822]/80 hover:text-[#1E3F2F] rounded-lg transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            {wishlistItems.length > 0 && (
              <span className="ml-1 text-xs font-mono tabular-nums font-semibold text-[#1E3F2F]">
                {wishlistItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('cart')}
            aria-label="Shopping Cart"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FAF7F2] bg-[#1E3F2F] hover:bg-[#163023] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
            <span className="font-mono tabular-nums">({totalCartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(user ? 'profile' : 'login')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C2822] border border-[#1C2822]/15 hover:border-[#1E3F2F] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{user ? (isAdmin ? 'Admin / Profile' : 'Profile') : 'Login'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
