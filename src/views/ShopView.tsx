import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export const ShopView: React.FC = () => {
  const {
    products,
    categories,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [priceFilter, setPriceFilter] = useState<'all' | 'under150' | '150to350' | 'over350'>('all');
  const [customizableFilter, setCustomizableFilter] = useState<'all' | 'customizable' | 'ready'>(
    'all'
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'instock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = products.filter((p) => {
      // Category filter
      if (selectedCategoryFilter !== 'all' && p.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Search by product name, category, and keywords
      if (q) {
        const hay = `${p.name} ${p.categoryName} ${p.keywords} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Price filter
      if (priceFilter === 'under150' && p.price >= 150) return false;
      if (priceFilter === '150to350' && (p.price < 150 || p.price > 350)) return false;
      if (priceFilter === 'over350' && p.price <= 350) return false;

      // Customizable filter
      if (customizableFilter === 'customizable' && !p.customizable) return false;
      if (customizableFilter === 'ready' && p.customizable) return false;

      // Availability filter
      if (availabilityFilter === 'instock' && (!p.inStock || p.stock <= 0)) return false;

      return true;
    });

    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [
    products,
    selectedCategoryFilter,
    searchQuery,
    priceFilter,
    customizableFilter,
    availabilityFilter,
    sortBy,
  ]);

  const resetAllFilters = () => {
    setSelectedCategoryFilter('all');
    setSearchQuery('');
    setPriceFilter('all');
    setCustomizableFilter('all');
    setAvailabilityFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">MD ART STUDIO Collection</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
            Shop Handmade Art &amp; Custom Gifts
          </h1>
          <p className="text-xs text-[#1C2822]/65 font-mono tabular-nums">
            Showing {filteredProducts.length} of {products.length} creations
          </p>
        </div>
      </div>

      {/* Category Interactive Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategoryFilter === 'all'
              ? 'bg-[#1E3F2F] text-[#FAF7F2]'
              : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategoryFilter(cat.id)}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategoryFilter === cat.id
                ? 'bg-[#1E3F2F] text-[#FAF7F2]'
                : 'bg-[#F4EFE6] text-[#1C2822]/80 hover:bg-[#EAE3D5]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search & Multi-Filter Control Bar */}
      <div className="bg-[#F4EFE6] p-4 sm:p-5 rounded-2xl border border-[#1C2822]/8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-center">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-4 h-4 text-[#1C2822]/45 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, category, keyword..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1C2822]/50 hover:text-[#1C2822] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Price Filter */}
        <div>
          <label className="block text-[11px] text-[#1C2822]/60 mb-1">Price Range</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as typeof priceFilter)}
            className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
          >
            <option value="all">All Prices</option>
            <option value="under150">Under ₹150 (₹69 - ₹149)</option>
            <option value="150to350">₹150 – ₹350</option>
            <option value="over350">Above ₹350</option>
          </select>
        </div>

        {/* Customizable Filter */}
        <div>
          <label className="block text-[11px] text-[#1C2822]/60 mb-1">Customization</label>
          <select
            value={customizableFilter}
            onChange={(e) => setCustomizableFilter(e.target.value as typeof customizableFilter)}
            className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
          >
            <option value="all">All Artworks</option>
            <option value="customizable">Customizable Only</option>
            <option value="ready">Ready-Made Only</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-[11px] text-[#1C2822]/60 mb-1">Availability</label>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
            className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
          >
            <option value="all">All Items</option>
            <option value="instock">In Stock Only</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[11px] text-[#1C2822]/60 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl text-[#1C2822] focus:outline-none focus:border-[#1E3F2F]"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-[#F4EFE6] rounded-2xl p-12 text-center space-y-4 border border-[#1C2822]/8">
          <SlidersHorizontal className="w-8 h-8 text-[#1E3F2F]/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-semibold text-[#1C2822]">
              No matching handmade pieces found
            </h3>
            <p className="text-xs text-[#1C2822]/70 max-w-md mx-auto">
              Try clearing a filter or searching for another keyword like &ldquo;UNO&rdquo;,
              &ldquo;t-shirt&rdquo;, &ldquo;embroidery&rdquo;, or &ldquo;canvas&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
