export type AppView =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'order-confirmation'
  | 'custom-art'
  | 'profile'
  | 'login'
  | 'admin'
  | 'about'
  | 'contact'
  | 'privacy-policy'
  | 'terms'
  | 'shipping-policy'
  | 'refund-policy'
  | 'cancellation-policy'
  | 'custom-policy';

export interface Category {
  id: string;
  slug: string;
  name: string;
  startingPrice: number;
  description: string;
  imageUrl: string;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  price: number;
  compareAtPrice: number;
  description: string;
  materials: string;
  size: string;
  stock: number;
  inStock: boolean;
  customizable: boolean;
  featured: boolean;
  bestSeller: boolean;
  images: string[];
  keywords: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  customText: string;
  colorPreference: string;
  specialInstructions: string;
  referenceImageData: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  categoryName: string;
  createdAt?: unknown;
}

export interface SavedAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type OrderStatusType =
  | 'Order Placed'
  | 'Payment Confirmed'
  | 'Preparing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatusType = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  customText: string;
  colorPreference: string;
  specialInstructions: string;
  referenceImageData: string;
  createdAt?: unknown;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  itemsSummary: string;
  subtotal: number;
  discountAmount: number;
  couponCode: string;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: 'razorpay' | 'paypal';
  paymentGatewayId: string;
  paymentStatus: PaymentStatusType;
  orderStatus: OrderStatusType;
  items?: OrderItem[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomArtRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  productType: string;
  preferredSize: string;
  budget: string;
  description: string;
  colorPreference: string;
  referenceImageData: string;
  additionalInstructions: string;
  status: 'New' | 'In Review' | 'Quoted' | 'Accepted' | 'Completed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ContactMessage {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: 'customer' | 'admin';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PaymentGatewayStatus {
  razorpayConfigured: boolean;
  razorpayKeyId: string;
  paypalConfigured: boolean;
  paypalClientId: string;
  paypalMode: 'sandbox' | 'live';
  studioEmail: string;
  studioWhatsapp: string;
}
