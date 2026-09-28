import React, { useState } from 'react';
import { ArrowLeft, Check, Heart, Minus, Plus, ShoppingBag, Upload } from 'lucide-react';
import { useStore, validateAndCompressImageFile } from '../context/StoreContext';

export const ProductDetailView: React.FC = () => {
  const {
    products,
    selectedProductId,
    navigateTo,
    addToCart,
    toggleWishlist,
    isInWishlist,
    reviews,
    submitReview,
    showToast,
  } = useStore();

  const product = products.find((p) => p.id === selectedProductId) || products[0];
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Customization State
  const [customText, setCustomText] = useState('');
  const [colorPreference, setColorPreference] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [referenceImageData, setReferenceImageData] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-[#1C2822]/70">Product not found.</p>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-[#1E3F2F] text-[#FAF7F2]"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const isUnoCard = product.categoryId === 'cat_uno';
  const wished = isInWishlist(product.id);
  const productReviews = reviews.filter((r) => r.productId === product.id && r.approved);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const compressed = await validateAndCompressImageFile(file);
      setReferenceImageData(compressed);
      showToast('Reference photo attached!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to attach image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddToCart = async (goToCheckout = false) => {
    await addToCart(product, quantity, {
      customText,
      colorPreference,
      specialInstructions,
      referenceImageData,
    });
    if (goToCheckout) {
      navigateTo('checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await submitReview(product.id, product.name, reviewRating, reviewComment);
      setReviewComment('');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Structured Data JSON-LD for Product SEO
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: product.categoryName,
    brand: {
      '@type': 'Brand',
      name: 'MD ART STUDIO',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Breadcrumb Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#1C2822]/70 hover:text-[#1E3F2F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Handmade Catalog</span>
        </button>
      </div>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#EAE3D5] border border-[#1C2822]/10">
            <img
              src={product.images[selectedImageIdx] || product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'border-[#1E3F2F] scale-[1.02]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Purchase & Customization Details */}
        <div className="lg:col-span-6 space-y-6 bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10">
          <div className="space-y-2 border-b border-[#1C2822]/10 pb-5">
            <div className="flex items-center gap-2 text-xs text-[#1C2822]/65">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>{product.customizable ? 'Handmade to Order' : 'Ready to Ship'}</span>
              <span aria-hidden="true">·</span>
              <span className={product.inStock ? 'text-[#1E3F2F] font-medium' : 'text-[#B93829]'}>
                {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2822] leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl font-mono tabular-nums font-semibold text-[#1E3F2F]">
                {isUnoCard ? '₹300 / 30 cards' : `₹${product.price}`}
              </span>
              {product.compareAtPrice > product.price && (
                <span className="text-sm font-mono tabular-nums text-[#1C2822]/45 line-through">
                  ₹{product.compareAtPrice}
                </span>
              )}
              <span className="text-xs text-[#8C6D46]">Inclusive of studio packaging</span>
            </div>
          </div>

          <p className="text-sm text-[#1C2822]/80 leading-relaxed">{product.description}</p>

          {/* Materials & Size Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#1C2822]/10 text-xs">
            <div>
              <p className="text-[#1C2822]/55">Materials Used</p>
              <p className="font-medium text-[#1C2822] mt-0.5">{product.materials}</p>
            </div>
            <div>
              <p className="text-[#1C2822]/55">Dimensions / Size</p>
              <p className="font-medium text-[#1C2822] mt-0.5">{product.size}</p>
            </div>
          </div>

          {/* Customization Module */}
          {product.customizable && (
            <div className="space-y-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/10">
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg font-semibold text-[#1E3F2F]">
                  {isUnoCard
                    ? 'Personalize Your 30-Card UNO Deck (₹300 / 30 Cards)'
                    : 'Personalize Your Handmade Piece'}
                </h3>
                <p className="text-xs text-[#1C2822]/65">
                  {isUnoCard
                    ? 'Upload your favorite photo/collage and tell us the custom rules, names, or theme you want printed on your 30 cards.'
                    : 'Share the custom name, quote, size, or color palette you would like hand-painted or embroidered.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
                    Custom Name / Text / Size
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder={
                      isUnoCard ? 'e.g., Rohan & Kriti Anniversary' : 'e.g., Size M · Initial "A"'
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#1C2822]/15 rounded-xl focus:outline-none focus:border-[#1E3F2F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
                    Color Preference
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={colorPreference}
                    onChange={(e) => setColorPreference(e.target.value)}
                    placeholder="e.g., Pastel sage green, cream & gold"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#1C2822]/15 rounded-xl focus:outline-none focus:border-[#1E3F2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
                  Special Instructions for Artist
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={
                    isUnoCard
                      ? 'Describe any custom Wild Card dares, special inside jokes, or card back text...'
                      : 'Mention placement (center/corner), gift note message, or motif details...'
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#1C2822]/15 rounded-xl focus:outline-none focus:border-[#1E3F2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
                  Reference Photo Upload (JPG, PNG, WEBP · Max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#EAE3D5] text-[#1C2822] hover:bg-[#DED4C1] transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Compressing...' : 'Upload Reference Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {referenceImageData && (
                    <div className="flex items-center gap-2">
                      <img
                        src={referenceImageData}
                        alt="Uploaded customization reference"
                        className="w-10 h-10 rounded-lg object-cover border border-[#1E3F2F]/30"
                      />
                      <span className="text-xs text-[#1E3F2F] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Attached
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-[#1C2822]/20 rounded-xl bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-[#1C2822]/70 hover:text-[#1C2822] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-mono tabular-nums font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 20, q + 1))}
                  aria-label="Increase quantity"
                  className="p-2.5 text-[#1C2822]/70 hover:text-[#1C2822] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={!product.inStock}
                className="flex-1 py-3 px-5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!product.inStock}
                className="flex-1 py-3 px-5 text-xs font-semibold rounded-xl bg-[#8C6D46] text-[#FAF7F2] hover:bg-[#755937] disabled:opacity-40 transition-colors whitespace-nowrap cursor-pointer"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label="Toggle wishlist"
                className="p-3 rounded-xl border border-[#1C2822]/20 bg-[#FAF7F2] hover:border-[#B93829] text-[#1C2822] transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${wished ? 'fill-[#B93829] text-[#B93829]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="border-t border-[#1C2822]/10 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2822]">
            Collector Reviews ({productReviews.length})
          </h2>
          <p className="text-xs text-[#1C2822]/70">
            Have you received this handmade piece from MD ART STUDIO? Share your experience below.
          </p>

          <form
            onSubmit={handleReviewSubmit}
            className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/8 space-y-3.5"
          >
            <h3 className="font-serif text-lg font-semibold text-[#1C2822]">Write a Review</h3>
            <div>
              <label className="block text-xs text-[#1C2822]/70 mb-1">Rating</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              >
                <option value={5}>5 / 5 — Extraordinary Handmade Craft</option>
                <option value={4}>4 / 5 — Beautiful Quality</option>
                <option value={3}>3 / 5 — Good</option>
                <option value={2}>2 / 5 — Fair</option>
                <option value={1}>1 / 5 — Needs Improvement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#1C2822]/70 mb-1">Your Review</label>
              <textarea
                rows={3}
                required
                maxLength={1000}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about the artwork, fabric quality, or packaging..."
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors cursor-pointer"
            >
              {submittingReview ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {productReviews.length > 0 ? (
            productReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/8 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C2822]">{rev.authorName}</span>
                  <span className="font-mono tabular-nums text-[#8C6D46] font-medium">
                    Rating: {rev.rating}.0 / 5.0
                  </span>
                </div>
                <p className="text-xs text-[#1C2822]/80 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          ) : (
            <div className="bg-[#F4EFE6] p-8 rounded-2xl border border-[#1C2822]/8 text-center text-xs text-[#1C2822]/65">
              Be the first collector to review &ldquo;{product.name}&rdquo;!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
