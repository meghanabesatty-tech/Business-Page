import React, { useState } from 'react';
import { Heart, Palette } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { navigateTo, toggleWishlist, isInWishlist, addToCart } = useStore();
  const [imgFailed, setImgFailed] = useState(false);

  const wished = isInWishlist(product.id);
  const primaryImage = product.images[0] || '';
  const isUnoCard = product.categoryId === 'cat_uno';

  return (
    <article className="group bg-[#F4EFE6] rounded-2xl overflow-hidden border border-[#1C2822]/8 transition-transform duration-150 hover:-translate-y-0.5 flex flex-col">
      {/* Product Image Container (65-75% height emphasis) */}
      <div className="relative aspect-[4/3] w-full bg-[#EAE3D5] overflow-hidden">
        {!imgFailed && primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            onClick={() => navigateTo('product', { productId: product.id })}
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
          />
        ) : (
          <div
            onClick={() => navigateTo('product', { productId: product.id })}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#EAE3D5] to-[#DED4C1] cursor-pointer"
          >
            <Palette className="w-8 h-8 text-[#1E3F2F]/60 mb-2" />
            <span className="font-serif text-sm text-[#1C2822]/80">{product.name}</span>
          </div>
        )}

        {/* Wishlist Affordance Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#FAF7F2]/90 backdrop-blur-sm flex items-center justify-center text-[#1C2822] hover:text-[#B93829] transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${wished ? 'fill-[#B93829] text-[#B93829]' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-[#1C2822]/60">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.customizable ? 'Customizable' : 'Ready to Ship'}</span>
            {!product.inStock && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#B93829] font-medium">Sold Out</span>
              </>
            )}
          </div>

          <h3
            onClick={() => navigateTo('product', { productId: product.id })}
            className="font-serif text-lg font-semibold text-[#1C2822] group-hover:text-[#1E3F2F] transition-colors leading-snug cursor-pointer"
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-[#1C2822]/8 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-[#1E3F2F] font-mono tabular-nums">
              {isUnoCard ? '₹300 / 30 cards' : `₹${product.price}`}
            </span>
            {product.compareAtPrice > product.price && !isUnoCard && (
              <span className="text-xs text-[#1C2822]/45 line-through font-mono tabular-nums">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (product.customizable) {
                  navigateTo('product', { productId: product.id });
                } else {
                  addToCart(product, 1);
                }
              }}
              disabled={!product.inStock}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {product.customizable ? 'Customize' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
