import React, { useState } from 'react';
import { ArrowRight, ExternalLink, Palette } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_ASSETS } from '../data/initialCatalog';
import { ProductCard } from '../components/ProductCard';

export const HomeView: React.FC = () => {
  const { navigateTo, categories, products, reviews } = useStore();
  const [heroImgError, setHeroImgError] = useState(false);
  const [activeCollectionTab, setActiveCollectionTab] = useState<'featured' | 'bestsellers'>(
    'featured'
  );

  const displayedProducts = products
    .filter((p) => (activeCollectionTab === 'featured' ? p.featured : p.bestSeller))
    .slice(0, 6);

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* 1. Storefront Hero Section */}
      <section className="relative pt-8 sm:pt-12 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2 text-xs text-[#1E3F2F]/80 font-medium">
                <span>Artisanal Studio</span>
                <span aria-hidden="true">·</span>
                <span>@md_art_studio0608</span>
                <span aria-hidden="true">·</span>
                <span>Pan-India Shipping</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#1C2822] leading-[1.12] tracking-tight">
                Handmade With Love, Made Just For You
              </h1>

              <p className="text-base sm:text-lg text-[#1C2822]/75 leading-relaxed max-w-xl">
                Personalized art, handmade gifts &amp; customized creations. From wearable
                hand-painted cotton t-shirts and delicate floral embroidery to 3D texture canvases
                and custom 30-card UNO decks.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('shop', { categoryId: 'all' })}
                  className="px-6 py-3.5 text-sm font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('custom-art')}
                  className="px-6 py-3.5 text-sm font-medium rounded-xl bg-[#F4EFE6] text-[#1E3F2F] border border-[#1E3F2F]/25 hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Create Custom Art
                </button>
              </div>

              {/* Clean Starting Price Strip */}
              <div className="pt-4 border-t border-[#1C2822]/10 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[#1C2822]/60">Canvas &amp; Hankies</p>
                  <p className="font-mono tabular-nums font-semibold text-[#1E3F2F] text-sm mt-0.5">
                    From ₹69+
                  </p>
                </div>
                <div>
                  <p className="text-[#1C2822]/60">T-Shirt Paintings</p>
                  <p className="font-mono tabular-nums font-semibold text-[#1E3F2F] text-sm mt-0.5">
                    From ₹259+
                  </p>
                </div>
                <div>
                  <p className="text-[#1C2822]/60">Custom UNO Deck</p>
                  <p className="font-mono tabular-nums font-semibold text-[#1E3F2F] text-sm mt-0.5">
                    ₹300 / 30 Cards
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase Column */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-[#EAE3D5] border border-[#1C2822]/10">
                {!heroImgError ? (
                  <img
                    src={STUDIO_ASSETS.heroStudioImg}
                    alt="MD ART STUDIO handmade paintings, embroidery hoops, and custom gifts flatlay"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#EAE3D5] to-[#D8CEBE]">
                    <Palette className="w-12 h-12 text-[#1E3F2F] mb-3" />
                    <p className="font-serif text-xl text-[#1C2822]">MD ART STUDIO</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent flex items-end p-6">
                  <div className="text-[#FAF7F2]">
                    <p className="text-xs text-[#FAF7F2]/85">
                      100% Hand-Painted &amp; Hand-Stitched in India
                    </p>
                    <p className="font-serif text-lg sm:text-xl font-medium">
                      Every brushstroke &amp; stitch tailored to your story
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[#8C6D46] font-medium">01. Signature Mediums</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
              Explore Handmade Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('shop', { categoryId: 'all' })}
            className="text-sm font-medium text-[#1E3F2F] hover:underline underline-offset-4 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop', { categoryId: cat.id })}
              className="group bg-[#F4EFE6] rounded-2xl overflow-hidden border border-[#1C2822]/8 hover:border-[#1E3F2F]/30 transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-[16/10] bg-[#EAE3D5] overflow-hidden">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-xl font-semibold text-[#1C2822] group-hover:text-[#1E3F2F] transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#1E3F2F]">
                      {cat.id === 'cat_uno'
                        ? '₹300 / 30 cards'
                        : `Starting ₹${cat.startingPrice}+`}
                    </span>
                  </div>
                  <p className="text-xs text-[#1C2822]/70 leading-relaxed">{cat.description}</p>
                </div>
                <div className="pt-2 text-xs font-medium text-[#1E3F2F] flex items-center gap-1">
                  <span>Browse {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured & Best Sellers Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[#8C6D46] font-medium">02. Curated Creations</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
              Handcrafted Favorites
            </h2>
          </div>

          {/* Interactive Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#EAE3D5] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveCollectionTab('featured')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCollectionTab === 'featured'
                  ? 'bg-[#1E3F2F] text-[#FAF7F2]'
                  : 'text-[#1C2822]/75 hover:text-[#1C2822]'
              }`}
            >
              Featured Creations
            </button>
            <button
              type="button"
              onClick={() => setActiveCollectionTab('bestsellers')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCollectionTab === 'bestsellers'
                  ? 'bg-[#1E3F2F] text-[#FAF7F2]'
                  : 'text-[#1C2822]/75 hover:text-[#1C2822]'
              }`}
            >
              Best Sellers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Why Choose MD ART STUDIO & Attributable Collector Notes (Claim-to-Proof Adjacency) */}
      <section className="bg-[#F4EFE6] border-y border-[#1C2822]/8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs text-[#8C6D46] font-medium">03. Why Choose MD ART STUDIO</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
                Crafted by Hand, Never Mass-Produced
              </h2>
              <p className="text-sm text-[#1C2822]/75 leading-relaxed">
                Every piece leaves our studio only after heat-curing, archival varnishing, and
                personal inspection. Whether you are gifting a ₹69 mini canvas or a custom 30-card
                UNO deck, we treat every order as a keepsake.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('custom-art')}
                  className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Request a Bespoke Commission
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 pb-4 border-b border-[#1C2822]/10">
                <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
                  01. Wash-Fast &amp; Archival Pigments
                </h3>
                <p className="text-xs text-[#1C2822]/75 leading-relaxed">
                  Our t-shirt and handkerchief paintings use heat-fixed textile mediums tested for
                  40+ gentle hand washes without cracking or peeling.
                </p>
              </div>

              <div className="space-y-2 pb-4 border-b border-[#1C2822]/10">
                <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
                  02. True 1-on-1 Customization
                </h3>
                <p className="text-xs text-[#1C2822]/75 leading-relaxed">
                  Upload reference photos, choose exact color palettes, add names or dates, and
                  chat with us for custom UNO decks (₹300 for 30 cards).
                </p>
              </div>

              <div className="space-y-2 pb-4 border-b border-[#1C2822]/10">
                <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
                  03. Accessible Handmade Pricing
                </h3>
                <p className="text-xs text-[#1C2822]/75 leading-relaxed">
                  Thoughtful handmade art starting at ₹69 for mini canvases, ₹99 for painted
                  hankies, ₹120 for embroidery, and ₹259 for painted tees.
                </p>
              </div>

              <div className="space-y-2 pb-4 border-b border-[#1C2822]/10">
                <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
                  04. Gift-Ready Studio Packaging
                </h3>
                <p className="text-xs text-[#1C2822]/75 leading-relaxed">
                  Wrapped in eco-friendly kraft sleeves with satin ribbons and handwritten care
                  instructions—ready to gift straight out of the box.
                </p>
              </div>
            </div>
          </div>

          {/* Attributable Collector Testimonials */}
          <div className="pt-6 border-t border-[#1C2822]/10 space-y-6">
            <h3 className="font-serif text-2xl font-semibold text-[#1C2822]">
              Loved by Collectors Across India
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((rev) => (
                <blockquote
                  key={rev.id}
                  className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/8 flex flex-col justify-between gap-4"
                >
                  <p className="text-xs text-[#1C2822]/80 leading-relaxed">“{rev.comment}”</p>
                  <footer className="text-xs text-[#1C2822]/60 flex items-center justify-between pt-2 border-t border-[#1C2822]/8">
                    <span className="font-medium text-[#1C2822]">{rev.authorName}</span>
                    <span className="font-mono tabular-nums text-[#8C6D46]">
                      {rev.rating}.0 / 5.0
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Instagram Community Section for @md_art_studio0608 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E3F2F] text-[#FAF7F2] rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs text-[#E5D5B5] font-medium">
              04. Follow Our Daily Studio Process
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
              Join @md_art_studio0608 on Instagram
            </h2>
            <p className="text-sm text-[#FAF7F2]/80 leading-relaxed">
              Watch behind-the-scenes brush reels, custom UNO card unboxings, embroidery time-lapses,
              and customer reactions on our official Instagram page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://www.instagram.com/md_art_studio0608/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 text-xs font-semibold rounded-xl bg-[#FAF7F2] text-[#1E3F2F] hover:bg-[#EAE3D5] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Follow @md_art_studio0608</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => navigateTo('contact')}
              className="px-5 py-3.5 text-xs font-medium rounded-xl border border-[#FAF7F2]/30 text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              DM / Contact Studio
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
