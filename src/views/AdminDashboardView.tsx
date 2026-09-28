import React, { useState } from 'react';
import {
  AlertTriangle,
  CloudUpload,
  Edit3,
  Layers,
  Package,
  Palette,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useStore, validateAndCompressImageFile } from '../context/StoreContext';
import { Category, Coupon, OrderStatusType, PaymentStatusType, Product } from '../types';

export const AdminDashboardView: React.FC = () => {
  const {
    isAdmin,
    user,
    products,
    categories,
    orders,
    customRequests,
    reviews,
    coupons,
    allUsersAdmin,
    isCloudSynced,
    seedDefaultCatalogToFirestore,
    saveProductAdmin,
    deleteProductAdmin,
    saveCategoryAdmin,
    deleteCategoryAdmin,
    updateOrderStatusAdmin,
    updateCustomRequestStatusAdmin,
    saveCouponAdmin,
    deleteCouponAdmin,
    toggleReviewApprovalAdmin,
    deleteReviewAdmin,
    navigateTo,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'orders' | 'custom-requests' | 'marketing' | 'config'
  >('overview');

  // Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('cat_tshirt');
  const [prodPrice, setProdPrice] = useState(259);
  const [prodComparePrice, setProdComparePrice] = useState(399);
  const [prodStock, setProdStock] = useState(10);
  const [prodMaterials, setProdMaterials] = useState('100% Cotton, Wash-Fast Fabric Pigments');
  const [prodSize, setProdSize] = useState('S, M, L, XL');
  const [prodDescription, setProdDescription] = useState('');
  const [prodKeywords, setProdKeywords] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodCustomizable, setProdCustomizable] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodBestSeller, setProdBestSeller] = useState(false);

  // Category Form State
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catPrice, setCatPrice] = useState(99);
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState(7);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState(10);
  const [couponMinOrder, setCouponMinOrder] = useState(299);
  const [couponMaxDisc, setCouponMaxDisc] = useState(200);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#B93829]/10 text-[#B93829] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#1C2822]">
          Admin Authorization Required
        </h1>
        <p className="text-xs text-[#1C2822]/70 max-w-md mx-auto">
          This studio dashboard is protected by server-side Firestore security rules and restricted
          to verified MD ART STUDIO administrators.
        </p>
        <button
          type="button"
          onClick={() => navigateTo(user ? 'home' : 'login')}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
        >
          {user ? 'Return to Storefront' : 'Sign In as Admin'}
        </button>
      </div>
    );
  }

  // Sales & Inventory Metrics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(
    (o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
  ).length;
  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const bestSellingProducts = products.filter((p) => p.bestSeller);

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdId(p.id);
    setProdName(p.name);
    setProdCategoryId(p.categoryId);
    setProdPrice(p.price);
    setProdComparePrice(p.compareAtPrice);
    setProdStock(p.stock);
    setProdMaterials(p.materials);
    setProdSize(p.size);
    setProdDescription(p.description);
    setProdKeywords(p.keywords);
    setProdImages(p.images);
    setProdCustomizable(p.customizable);
    setProdFeatured(p.featured);
    setProdBestSeller(p.bestSeller);
    setActiveTab('products');
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdId('');
    setProdName('');
    setProdCategoryId(categories[0]?.id || 'cat_tshirt');
    setProdPrice(259);
    setProdComparePrice(399);
    setProdStock(10);
    setProdMaterials('Handmade Archival Materials');
    setProdSize('Standard / Custom');
    setProdDescription('');
    setProdKeywords('');
    setProdImages([]);
    setProdCustomizable(true);
    setProdFeatured(false);
    setProdBestSeller(false);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await validateAndCompressImageFile(file);
      setProdImages((prev) => [...prev, compressed].slice(0, 8));
      showToast('Product image uploaded!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCat = categories.find((c) => c.id === prodCategoryId) || categories[0];
    await saveProductAdmin(
      {
        id: prodId || `prod_${Date.now()}`,
        name: prodName,
        slug: prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        price: Number(prodPrice),
        compareAtPrice: Number(prodComparePrice),
        description: prodDescription,
        materials: prodMaterials,
        size: prodSize,
        stock: Number(prodStock),
        inStock: Number(prodStock) > 0,
        customizable: prodCustomizable,
        featured: prodFeatured,
        bestSeller: prodBestSeller,
        images: prodImages.length > 0 ? prodImages : [selectedCat.imageUrl],
        keywords: prodKeywords,
      },
      !editingProduct
    );
    resetProductForm();
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCat: Category = {
      id: catId || `cat_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: catName,
      startingPrice: Number(catPrice),
      description: catDesc,
      imageUrl: categories[0]?.imageUrl || '',
      sortOrder: Number(catOrder),
    };
    await saveCategoryAdmin(newCat, true);
    setCatId('');
    setCatName('');
    setCatDesc('');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon: Coupon = {
      id: `coupon_${couponCode.toLowerCase()}`,
      code: couponCode.toUpperCase(),
      discountPercent: Number(couponPercent),
      minOrderAmount: Number(couponMinOrder),
      maxDiscount: Number(couponMaxDisc),
      active: true,
    };
    await saveCouponAdmin(newCoupon, true);
    setCouponCode('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2822]/10 pb-6">
        <div>
          <p className="text-xs text-[#8C6D46] font-medium">MD ART STUDIO · Studio Control Center</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={seedDefaultCatalogToFirestore}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#8C6D46] text-[#FAF7F2] hover:bg-[#755937] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isCloudSynced ? 'Re-Sync Default Catalog' : 'Sync Catalog to Firestore'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className="px-4 py-2.5 text-xs font-medium rounded-xl border border-[#1C2822]/20 text-[#1C2822] cursor-pointer"
          >
            View Live Storefront
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '01. Overview & Stats' },
          { id: 'products', label: `02. Products (${products.length})` },
          { id: 'categories', label: `03. Categories (${categories.length})` },
          { id: 'orders', label: `04. Orders (${orders.length})` },
          { id: 'custom-requests', label: `05. Custom Requests (${customRequests.length})` },
          { id: 'marketing', label: '06. Reviews, Coupons & Customers' },
          { id: 'config', label: '07. Deployment & API Setup' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#1E3F2F] text-[#FAF7F2]'
                : 'bg-[#F4EFE6] text-[#1C2822]/75 hover:bg-[#EAE3D5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10">
              <p className="text-xs text-[#1C2822]/60">Total Revenue</p>
              <p className="text-2xl font-mono tabular-nums font-semibold text-[#1E3F2F] mt-1">
                ₹{totalRevenue}
              </p>
            </div>
            <div className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10">
              <p className="text-xs text-[#1C2822]/60">Total Orders</p>
              <p className="text-2xl font-mono tabular-nums font-semibold text-[#1C2822] mt-1">
                {totalOrders}
              </p>
            </div>
            <div className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10">
              <p className="text-xs text-[#1C2822]/60">Pending Orders</p>
              <p className="text-2xl font-mono tabular-nums font-semibold text-[#8C6D46] mt-1">
                {pendingOrders}
              </p>
            </div>
            <div className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10">
              <p className="text-xs text-[#1C2822]/60">Catalog Products</p>
              <p className="text-2xl font-mono tabular-nums font-semibold text-[#1C2822] mt-1">
                {products.length}
              </p>
            </div>
            <div className="bg-[#F4EFE6] p-5 rounded-2xl border border-[#1C2822]/10">
              <p className="text-xs text-[#1C2822]/60">Low-Stock Alerts</p>
              <p className="text-2xl font-mono tabular-nums font-semibold text-[#B93829] mt-1">
                {lowStockProducts.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-7 bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-[#1C2822]">Recent Orders</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#1E3F2F] hover:underline cursor-pointer"
                >
                  Manage All →
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-xs text-[#1C2822]/60">No customer orders recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#1C2822]/8 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-semibold text-[#1E3F2F]">
                          {o.orderNumber} · {o.customerName}
                        </p>
                        <p className="text-[#1C2822]/70 truncate max-w-xs">{o.itemsSummary}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono tabular-nums font-semibold">₹{o.totalAmount}</p>
                        <p className="text-[11px] text-[#8C6D46]">{o.orderStatus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low-Stock & Best-Sellers */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3">
                <h2 className="font-serif text-xl font-semibold text-[#1C2822] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#B93829]" />
                  <span>Low-Stock Products (≤ 5 left)</span>
                </h2>
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-[#1C2822]/60">All products are well-stocked.</p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-[#1C2822]/8"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono tabular-nums text-[#B93829] font-semibold">
                        {p.stock} left
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3">
                <h2 className="font-serif text-xl font-semibold text-[#1C2822]">
                  Best-Selling Products ({bestSellingProducts.length})
                </h2>
                {bestSellingProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-[#1C2822]/8"
                  >
                    <span>{p.name}</span>
                    <span className="font-mono tabular-nums text-[#1E3F2F] font-semibold">
                      ₹{p.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGER */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Add / Edit Product Form */}
          <form
            onSubmit={handleSaveProduct}
            className="lg:col-span-5 bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#1C2822]">
                {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Handmade Product'}
              </h2>
              {editingProduct && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-[#B93829] hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Hand-Painted Daisy Cotton Tee"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Category *</label>
                <select
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
                  className="w-full px-2 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Stock *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Materials *</label>
                <input
                  type="text"
                  required
                  value={prodMaterials}
                  onChange={(e) => setProdMaterials(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Size / Dimensions *</label>
                <input
                  type="text"
                  required
                  value={prodSize}
                  onChange={(e) => setProdSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">SEO Keywords</label>
              <input
                type="text"
                value={prodKeywords}
                onChange={(e) => setProdKeywords(e.target.value)}
                placeholder="handmade gifts India, custom artwork..."
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Product Images</label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-[#EAE3D5] text-[#1C2822] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProductImageUpload}
                    className="hidden"
                  />
                </label>
                {prodImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Product thumb"
                    className="w-10 h-10 rounded-lg object-cover border border-[#1C2822]/20"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs pt-1">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodCustomizable}
                  onChange={(e) => setProdCustomizable(e.target.checked)}
                />
                <span>Customizable</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodFeatured}
                  onChange={(e) => setProdFeatured(e.target.checked)}
                />
                <span>Featured</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodBestSeller}
                  onChange={(e) => setProdBestSeller(e.target.checked)}
                />
                <span>Best Seller</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] cursor-pointer"
            >
              {editingProduct ? 'Save Product Changes' : 'Create Product in Catalog'}
            </button>
          </form>

          {/* Right: Existing Products Table */}
          <div className="lg:col-span-7 space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-[#F4EFE6] p-4 rounded-2xl border border-[#1C2822]/10 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover bg-[#EAE3D5] shrink-0"
                  />
                  <div>
                    <p className="text-[#1C2822]/60">{p.categoryName}</p>
                    <p className="font-serif text-base font-semibold text-[#1C2822]">{p.name}</p>
                    <p className="font-mono tabular-nums text-[#1E3F2F] font-semibold">
                      ₹{p.price} · Stock: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditProduct(p)}
                    className="p-2 rounded-lg bg-[#FAF7F2] border border-[#1C2822]/15 text-[#1C2822] hover:text-[#1E3F2F] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProductAdmin(p.id)}
                    className="p-2 rounded-lg bg-[#FAF7F2] border border-[#1C2822]/15 text-[#1C2822]/60 hover:text-[#B93829] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGER */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-5 bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-4"
          >
            <h2 className="font-serif text-xl font-semibold text-[#1C2822]">
              Add / Update Category
            </h2>
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Resin Keepsakes"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Starting Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={catPrice}
                  onChange={(e) => setCatPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2822]/75 mb-1">Sort Order *</label>
                <input
                  type="number"
                  required
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
            >
              Save Category
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-[#F4EFE6] p-4 rounded-2xl border border-[#1C2822]/10 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-serif text-lg font-semibold text-[#1C2822]">{c.name}</p>
                  <p className="text-[#1C2822]/70">{c.description}</p>
                  <p className="font-mono tabular-nums text-[#1E3F2F] mt-1">
                    Starting from ₹{c.startingPrice}+
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCategoryAdmin(c.id)}
                  className="p-2 text-[#1C2822]/50 hover:text-[#B93829] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS MANAGER */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-[#F4EFE6] p-10 rounded-2xl text-center text-xs text-[#1C2822]/65">
              No customer orders yet.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2822]/10 pb-3">
                  <div>
                    <span className="font-mono font-semibold text-sm text-[#1E3F2F]">
                      {ord.orderNumber}
                    </span>
                    <span className="mx-2">·</span>
                    <span className="font-medium">{ord.customerName}</span>
                    <span className="mx-2">·</span>
                    <span>{ord.customerPhone}</span>
                  </div>
                  <div className="font-mono tabular-nums font-semibold text-base text-[#1E3F2F]">
                    ₹{ord.totalAmount} ({ord.paymentMethod.toUpperCase()})
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#1C2822]/55">Items &amp; Customizations</p>
                    <p className="font-medium text-[#1C2822] mt-0.5">{ord.itemsSummary}</p>
                  </div>
                  <div>
                    <p className="text-[#1C2822]/55">Delivery Address</p>
                    <p className="font-medium text-[#1C2822] mt-0.5">{ord.shippingAddress}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <label className="text-[#1C2822]/70">Update Order Status:</label>
                  <select
                    value={ord.orderStatus}
                    onChange={(e) =>
                      updateOrderStatusAdmin(
                        ord.id,
                        e.target.value as OrderStatusType,
                        ord.paymentStatus
                      )
                    }
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#1C2822]/20 rounded-xl font-medium"
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Payment Confirmed">Payment Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <label className="text-[#1C2822]/70 ml-2">Payment Status:</label>
                  <select
                    value={ord.paymentStatus}
                    onChange={(e) =>
                      updateOrderStatusAdmin(
                        ord.id,
                        ord.orderStatus,
                        e.target.value as PaymentStatusType
                      )
                    }
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#1C2822]/20 rounded-xl font-medium"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: CUSTOM ART REQUESTS */}
      {activeTab === 'custom-requests' && (
        <div className="space-y-4">
          {customRequests.length === 0 ? (
            <div className="bg-[#F4EFE6] p-10 rounded-2xl text-center text-xs text-[#1C2822]/65">
              No custom art requests submitted yet.
            </div>
          ) : (
            customRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 flex flex-col md:flex-row justify-between gap-6 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 font-medium text-[#1E3F2F]">
                    <span>{req.name}</span>
                    <span>·</span>
                    <span>{req.phone}</span>
                    <span>·</span>
                    <span>{req.email}</span>
                  </div>
                  <p className="text-[#8C6D46] font-medium">
                    {req.productType} · Size: {req.preferredSize} · Budget: {req.budget}
                  </p>
                  <p className="text-[#1C2822] leading-relaxed">{req.description}</p>
                  {req.colorPreference && <p>Color Palette: {req.colorPreference}</p>}
                  {req.additionalInstructions && <p>Notes: {req.additionalInstructions}</p>}
                </div>

                <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                  {req.referenceImageData && (
                    <img
                      src={req.referenceImageData}
                      alt="Customer reference"
                      className="w-20 h-20 rounded-xl object-cover border border-[#1C2822]/20"
                    />
                  )}
                  <select
                    value={req.status}
                    onChange={(e) =>
                      updateCustomRequestStatusAdmin(
                        req.id,
                        e.target.value as typeof req.status
                      )
                    }
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#1C2822]/20 rounded-xl font-medium"
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: REVIEWS, COUPONS & CUSTOMERS */}
      {activeTab === 'marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coupons Manager */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleSaveCoupon}
              className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3.5"
            >
              <h3 className="font-serif text-xl font-semibold text-[#1C2822]">Create Coupon</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="CODE (e.g. FESTIVE20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl uppercase font-mono"
                />
                <input
                  type="number"
                  required
                  min={1}
                  max={90}
                  placeholder="Discount %"
                  value={couponPercent}
                  onChange={(e) => setCouponPercent(Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  placeholder="Min Order ₹"
                  value={couponMinOrder}
                  onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
                <input
                  type="number"
                  required
                  placeholder="Max Discount ₹"
                  value={couponMaxDisc}
                  onChange={(e) => setCouponMaxDisc(Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
              >
                Save Coupon
              </button>
            </form>

            <div className="space-y-2">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#F4EFE6] p-4 rounded-xl border border-[#1C2822]/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-mono font-semibold text-[#1E3F2F]">
                      {c.code} · {c.discountPercent}% OFF
                    </p>
                    <p className="text-[#1C2822]/65">
                      Min ₹{c.minOrderAmount} · Max ₹{c.maxDiscount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCouponAdmin(c.id)}
                    className="p-2 text-[#1C2822]/50 hover:text-[#B93829] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews & Registered Customers */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3">
              <h3 className="font-serif text-xl font-semibold text-[#1C2822]">
                Customer Reviews ({reviews.length})
              </h3>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#1C2822]/8 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold">
                      {r.authorName} · {r.rating}/5 on {r.productName}
                    </p>
                    <p className="text-[#1C2822]/75 mt-0.5">{r.comment}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleReviewApprovalAdmin(r)}
                      className="px-2.5 py-1 rounded bg-[#EAE3D5] text-[11px] cursor-pointer"
                    >
                      {r.approved ? 'Approved' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReviewAdmin(r.id)}
                      className="p-1 text-[#B93829] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3">
              <h3 className="font-serif text-xl font-semibold text-[#1C2822]">
                Registered Collectors ({allUsersAdmin.length})
              </h3>
              {allUsersAdmin.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between text-xs py-2 border-b border-[#1C2822]/8"
                >
                  <span className="font-medium">{u.displayName}</span>
                  <span className="font-mono text-[#1E3F2F]">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DEPLOYMENT & CREDENTIALS CHECKLIST */}
      {activeTab === 'config' && (
        <div className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-6 text-xs leading-relaxed">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">
              Production Configuration &amp; Credentials Guide
            </h2>
            <p className="text-[#1C2822]/70">
              Your Firebase Firestore database and Google Authentication are already provisioned and
              live. Below is the exact checklist for adding your payment gateway and studio
              credentials in the Secrets / Environment panel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/10 space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#1E3F2F]">
                1. Razorpay (India Payments: UPI, GPay, PhonePe, Cards)
              </h3>
              <p>
                Log in to <strong>dashboard.razorpay.com → Settings → API Keys</strong> and add
                these server secrets in the AI Studio Secrets panel (or <code className="font-mono">.env</code>):
              </p>
              <ul className="font-mono text-[11px] space-y-1 text-[#1C2822]/85">
                <li>• RAZORPAY_KEY_ID=&quot;rzp_live_...&quot;</li>
                <li>• RAZORPAY_KEY_SECRET=&quot;your_secret_key&quot;</li>
                <li>• RAZORPAY_WEBHOOK_SECRET=&quot;your_webhook_secret&quot;</li>
              </ul>
            </div>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/10 space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#1E3F2F]">
                2. PayPal (International Payments)
              </h3>
              <p>
                Log in to <strong>developer.paypal.com → Apps &amp; Credentials</strong> and set:
              </p>
              <ul className="font-mono text-[11px] space-y-1 text-[#1C2822]/85">
                <li>• PAYPAL_CLIENT_ID=&quot;your_client_id&quot;</li>
                <li>• PAYPAL_CLIENT_SECRET=&quot;your_client_secret&quot;</li>
                <li>• PAYPAL_MODE=&quot;live&quot; (or &quot;sandbox&quot;)</li>
              </ul>
            </div>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/10 space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#1E3F2F]">
                3. Firebase Auth Providers (Google, Email, Mobile OTP)
              </h3>
              <p>
                • <strong>Google Sign-In:</strong> Already provisioned and active (`firebase-applet-config.json`).
                <br />• <strong>Email/Password &amp; Mobile OTP:</strong> In Firebase Console (Project{' '}
                <code className="font-mono">gen-lang-client-0674671389</code>) →{' '}
                <strong>Authentication → Sign-in method</strong>, toggle on{' '}
                <em>Email/Password</em> and <em>Phone</em>.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#1C2822]/10 space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#1E3F2F]">
                4. Studio Contact, Email &amp; Custom Domain
              </h3>
              <ul className="font-mono text-[11px] space-y-1 text-[#1C2822]/85">
                <li>• STUDIO_EMAIL=&quot;your_email@domain.com&quot;</li>
                <li>• STUDIO_WHATSAPP=&quot;919876543210&quot;</li>
                <li>• Custom Domain: Map your domain in Cloud Run / Firebase Hosting and add it to Firebase Auth → Settings → Authorized domains.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
