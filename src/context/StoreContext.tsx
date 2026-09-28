import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
} from '../data/initialCatalog';
import {
  AppView,
  CartItem,
  Category,
  Coupon,
  CustomArtRequest,
  Order,
  OrderItem,
  OrderStatusType,
  PaymentGatewayStatus,
  PaymentStatusType,
  Product,
  Review,
  SavedAddress,
  UserPrivateInfo,
  UserProfile,
  WishlistItem,
} from '../types';

interface StoreContextValue {
  // Navigation
  currentView: AppView;
  selectedProductId: string | null;
  selectedCategoryFilter: string;
  searchQuery: string;
  lastCreatedOrder: Order | null;
  navigateTo: (view: AppView, options?: { productId?: string; categoryId?: string; search?: string }) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategoryFilter: (catId: string) => void;

  // Notifications / Toast
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;

  // Auth & User
  user: User | null;
  userProfile: UserProfile | null;
  userPrivate: UserPrivateInfo | null;
  isAdmin: boolean;
  authReady: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, phone: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendMobileOtp: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;
  verifyMobileOtp: (confirmationResult: ConfirmationResult, otp: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileDetails: (displayName: string, phone: string) => Promise<void>;

  // Catalog Data
  categories: Category[];
  products: Product[];
  reviews: Review[];
  coupons: Coupon[];
  isCloudSynced: boolean;
  seedDefaultCatalogToFirestore: () => Promise<void>;

  // Cart & Wishlist
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  appliedCoupon: Coupon | null;
  addToCart: (
    product: Product,
    quantity: number,
    customization?: {
      customText?: string;
      colorPreference?: string;
      specialInstructions?: string;
      referenceImageData?: string;
    }
  ) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCouponCode: (code: string) => boolean;
  removeCoupon: () => void;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // Cart Calculations
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;

  // Addresses & Orders
  savedAddresses: SavedAddress[];
  orders: Order[];
  customRequests: CustomArtRequest[];
  allUsersAdmin: UserProfile[];
  saveAddress: (addr: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  createVerifiedOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: 'razorpay' | 'paypal';
    paymentGatewayId: string;
  }) => Promise<Order>;
  submitReview: (productId: string, productName: string, rating: number, comment: string) => Promise<void>;
  submitCustomArtRequest: (
    req: Omit<CustomArtRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  submitContactMessage: (data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => Promise<void>;

  // Admin Operations
  saveProductAdmin: (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteProductAdmin: (productId: string) => Promise<void>;
  saveCategoryAdmin: (category: Omit<Category, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteCategoryAdmin: (categoryId: string) => Promise<void>;
  updateOrderStatusAdmin: (
    orderId: string,
    orderStatus: OrderStatusType,
    paymentStatus: PaymentStatusType
  ) => Promise<void>;
  updateCustomRequestStatusAdmin: (
    requestId: string,
    status: CustomArtRequest['status']
  ) => Promise<void>;
  saveCouponAdmin: (coupon: Omit<Coupon, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteCouponAdmin: (couponId: string) => Promise<void>;
  toggleReviewApprovalAdmin: (review: Review) => Promise<void>;
  deleteReviewAdmin: (reviewId: string) => Promise<void>;

  // Payment Gateway Status
  paymentConfig: PaymentGatewayStatus;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || `id_${Date.now()}`;
}

export async function validateAndCompressImageFile(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP images are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file size must be under 5 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file content.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 700;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
        if (compressedDataUrl.length > 340000) {
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        } else {
          resolve(compressedDataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPrivate, setUserPrivate] = useState<UserPrivateInfo | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('md_art_guest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('md_art_guest_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomArtRequest[]>([]);
  const [allUsersAdmin, setAllUsersAdmin] = useState<UserProfile[]>([]);

  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayStatus>({
    razorpayConfigured: false,
    razorpayKeyId: '',
    paypalConfigured: false,
    paypalClientId: '',
    paypalMode: 'sandbox',
    studioEmail: 'mdartstudio0608@gmail.com',
    studioWhatsapp: '919876543210',
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const navigateTo = (
    view: AppView,
    options?: { productId?: string; categoryId?: string; search?: string }
  ) => {
    if (options?.productId !== undefined) {
      setSelectedProductId(options.productId);
    }
    if (options?.categoryId !== undefined) {
      setSelectedCategoryFilter(options.categoryId);
    }
    if (options?.search !== undefined) {
      setSearchQuery(options.search);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email === BOOTSTRAPPED_ADMIN_EMAIL || userProfile?.role === 'admin')
  );

  // Fetch server-side payment gateway readiness
  useEffect(() => {
    fetch('/api/payment-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPaymentConfig(data);
      })
      .catch(() => {
        // Ignore network errors during initial load
      });
  }, []);

  // Save guest cart/wishlist to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('md_art_guest_cart', JSON.stringify(cartItems));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [cartItems, user]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('md_art_guest_wishlist', JSON.stringify(wishlistItems));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [wishlistItems, user]);

  // Ensure user profile & private PII record exist in Firestore for verified users
  const ensureUserDocuments = async (firebaseUser: User, customName?: string, customPhone?: string) => {
    if (!firebaseUser.emailVerified) return;

    const uid = sanitizeId(firebaseUser.uid);
    const userRef = doc(db, 'users', uid);
    const privRef = doc(db, 'users_private', uid);

    try {
      const snap = await getDoc(userRef);
      const role: 'customer' | 'admin' =
        firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL ? 'admin' : 'customer';
      const displayName = (
        customName ||
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Art Lover'
      ).slice(0, 100);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid,
          displayName,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const privSnap = await getDoc(privRef);
      if (!privSnap.exists()) {
        await setDoc(privRef, {
          uid,
          email: (firebaseUser.email || '').slice(0, 254),
          phone: (customPhone || firebaseUser.phoneNumber || '').slice(0, 25),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        await ensureUserDocuments(currentUser);
      } else {
        setUserProfile(null);
        setUserPrivate(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Public Catalog Listeners (Categories, Products, Approved Reviews, Active Coupons)
  useEffect(() => {
    const catQuery = query(collection(db, 'categories'), where('sortOrder', '>=', 0));
    const unsubCats = onSnapshot(
      catQuery,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setCategories(list);
          setIsCloudSynced(true);
        } else {
          setCategories(INITIAL_CATEGORIES);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    const prodQuery = query(collection(db, 'products'), where('price', '>=', 0));
    const unsubProds = onSnapshot(
      prodQuery,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Product, 'id'>),
          }));
          setProducts(list);
          setIsCloudSynced(true);
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    const revQuery = query(collection(db, 'reviews'), where('approved', '==', true));
    const unsubRevs = onSnapshot(
      revQuery,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Review, 'id'>),
          }));
          setReviews(list);
        } else {
          setReviews(INITIAL_REVIEWS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );

    const couponQuery = query(collection(db, 'coupons'), where('active', '==', true));
    const unsubCoupons = onSnapshot(
      couponQuery,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Coupon, 'id'>),
          }));
          setCoupons(list);
        } else {
          setCoupons(INITIAL_COUPONS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'coupons');
      }
    );

    return () => {
      unsubCats();
      unsubProds();
      unsubRevs();
      unsubCoupons();
    };
  }, []);

  // Automatically seed initial catalog into Firestore when the Bootstrapped Admin signs in and cloud catalog is empty
  const seedDefaultCatalogToFirestore = async () => {
    if (!user || !isAdmin) {
      showToast('Admin privileges required to sync catalog to Firestore.', 'error');
      return;
    }
    try {
      for (const cat of INITIAL_CATEGORIES) {
        const catRef = doc(db, 'categories', sanitizeId(cat.id));
        const existingSnap = await getDoc(catRef);
        if (!existingSnap.exists()) {
          await setDoc(catRef, {
            slug: cat.slug,
            name: cat.name,
            startingPrice: cat.startingPrice,
            description: cat.description,
            imageUrl: cat.imageUrl,
            sortOrder: cat.sortOrder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      for (const prod of INITIAL_PRODUCTS) {
        const prodRef = doc(db, 'products', sanitizeId(prod.id));
        const existingSnap = await getDoc(prodRef);
        if (!existingSnap.exists()) {
          await setDoc(prodRef, {
            name: prod.name,
            slug: prod.slug,
            categoryId: prod.categoryId,
            categoryName: prod.categoryName,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            description: prod.description,
            materials: prod.materials,
            size: prod.size,
            stock: prod.stock,
            inStock: prod.inStock,
            customizable: prod.customizable,
            featured: prod.featured,
            bestSeller: prod.bestSeller,
            images: prod.images,
            keywords: prod.keywords,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      for (const coup of INITIAL_COUPONS) {
        const coupRef = doc(db, 'coupons', sanitizeId(coup.id));
        const existingSnap = await getDoc(coupRef);
        if (!existingSnap.exists()) {
          await setDoc(coupRef, {
            code: coup.code,
            discountPercent: coup.discountPercent,
            minOrderAmount: coup.minOrderAmount,
            maxDiscount: coup.maxDiscount,
            active: coup.active,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      setIsCloudSynced(true);
      showToast('MD ART STUDIO catalog synced to Firestore!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  useEffect(() => {
    if (authReady && isAdmin && !isCloudSynced) {
      seedDefaultCatalogToFirestore().catch(() => {});
    }
  }, [authReady, isAdmin, isCloudSynced]);

  // Authenticated User Listeners (Profile, Private Info, Cart, Wishlist, Addresses, Orders, Custom Requests)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setSavedAddresses([]);
      setOrders([]);
      setCustomRequests([]);
      setAllUsersAdmin([]);
      return;
    }

    const uid = sanitizeId(user.uid);
    const isUserBootstrappedAdmin = user.email === BOOTSTRAPPED_ADMIN_EMAIL;

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubPrivate = onSnapshot(
      doc(db, 'users_private', uid),
      (snap) => {
        if (snap.exists()) {
          setUserPrivate(snap.data() as UserPrivateInfo);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users_private/${uid}`)
    );

    const cartItemsQ = query(
      collection(db, 'carts', uid, 'items'),
      where('userId', '==', uid)
    );
    const unsubCart = onSnapshot(
      cartItemsQ,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CartItem, 'id'>),
        }));
        setCartItems(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `carts/${uid}/items`)
    );

    const wishQ = query(collection(db, 'wishlists'), where('userId', '==', uid));
    const unsubWish = onSnapshot(
      wishQ,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WishlistItem, 'id'>),
        }));
        setWishlistItems(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'wishlists')
    );

    const addrQ = query(collection(db, 'addresses'), where('userId', '==', uid));
    const unsubAddr = onSnapshot(
      addrQ,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedAddress, 'id'>),
        }));
        setSavedAddresses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'addresses')
    );

    const ordersQ = isUserBootstrappedAdmin
      ? collection(db, 'orders')
      : query(collection(db, 'orders'), where('userId', '==', uid));

    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const reqQ = isUserBootstrappedAdmin
      ? collection(db, 'custom_requests')
      : query(collection(db, 'custom_requests'), where('userId', '==', uid));

    const unsubReqs = onSnapshot(
      reqQ,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomArtRequest, 'id'>),
        }));
        setCustomRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'custom_requests')
    );

    let unsubAllUsers = () => {};
    if (isUserBootstrappedAdmin) {
      unsubAllUsers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as UserProfile);
          setAllUsersAdmin(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );
    }

    return () => {
      unsubProfile();
      unsubPrivate();
      unsubCart();
      unsubWish();
      unsubAddr();
      unsubOrders();
      unsubReqs();
      unsubAllUsers();
    };
  }, [authReady, user]);

  // ============================================================================
  // Auth Methods
  // ============================================================================
  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    await ensureUserDocuments(res.user);
    showToast(`Welcome back, ${res.user.displayName || 'Art Lover'}!`, 'success');
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (res.user.emailVerified) {
      await ensureUserDocuments(res.user);
    }
    showToast('Logged in to MD ART STUDIO!', 'success');
  };

  const signUpWithEmail = async (name: string, email: string, phone: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(res.user, { displayName: name.trim().slice(0, 100) });
    try {
      await sendEmailVerification(res.user);
    } catch {
      // Continue even if verification email rate-limited
    }
    if (res.user.emailVerified) {
      await ensureUserDocuments(res.user, name.trim(), phone.trim());
    }
    showToast(
      'Account created! Please verify your email link to unlock cloud syncing, or use Google Sign-In for instant verified access.',
      'info'
    );
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
    showToast('Password reset link sent to your email!', 'info');
  };

  const sendMobileOtp = async (
    phoneNumber: string,
    containerId: string
  ): Promise<ConfirmationResult> => {
    const formattedPhone = phoneNumber.trim().startsWith('+')
      ? phoneNumber.trim()
      : `+91${phoneNumber.trim().replace(/^0+/, '')}`;
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    showToast('OTP sent to your mobile number!', 'info');
    return confirmation;
  };

  const verifyMobileOtp = async (
    confirmationResult: ConfirmationResult,
    otp: string,
    displayName?: string
  ) => {
    const res = await confirmationResult.confirm(otp.trim());
    if (displayName && !res.user.displayName) {
      await updateProfile(res.user, { displayName: displayName.trim().slice(0, 100) });
    }
    showToast('Mobile number verified and logged in!', 'success');
  };

  const logout = async () => {
    await signOut(auth);
    showToast('You have been logged out.', 'info');
    navigateTo('home');
  };

  const updateUserProfileDetails = async (displayName: string, phone: string) => {
    if (!user || !user.emailVerified) {
      showToast('Please sign in with a verified account to save profile changes.', 'error');
      return;
    }
    const uid = sanitizeId(user.uid);
    const cleanName = displayName.trim().slice(0, 100);
    const cleanPhone = phone.trim().slice(0, 25);

    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: cleanName,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users_private', uid), {
        email: (user.email || '').slice(0, 254),
        phone: cleanPhone,
        updatedAt: serverTimestamp(),
      });
      showToast('Profile details updated!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // ============================================================================
  // Cart & Wishlist Methods
  // ============================================================================
  const syncParentCartDoc = async (uid: string, nextItems: CartItem[]) => {
    const cartRef = doc(db, 'carts', uid);
    const itemCount = nextItems.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = nextItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const snap = await getDoc(cartRef);
    if (!snap.exists()) {
      await setDoc(cartRef, {
        userId: uid,
        itemCount,
        subtotal,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(cartRef, {
        itemCount,
        subtotal,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const addToCart = async (
    product: Product,
    quantity: number,
    customization?: {
      customText?: string;
      colorPreference?: string;
      specialInstructions?: string;
      referenceImageData?: string;
    }
  ) => {
    const safeQty = Math.max(1, Math.min(100, Math.round(quantity)));
    const customText = (customization?.customText || '').trim().slice(0, 300);
    const colorPreference = (customization?.colorPreference || '').trim().slice(0, 200);
    const specialInstructions = (customization?.specialInstructions || '').trim().slice(0, 1000);
    const referenceImageData = (customization?.referenceImageData || '').slice(0, 350000);

    const itemId = sanitizeId(
      `${product.id}_${customText ? customText.slice(0, 16) : 'std'}_${colorPreference ? colorPreference.slice(0, 12) : 'def'}`
    );

    if (user && user.emailVerified && isCloudSynced) {
      const uid = sanitizeId(user.uid);
      try {
        await ensureUserDocuments(user);
        const existingItem = cartItems.find((i) => i.id === itemId);
        const nextItems = existingItem
          ? cartItems.map((i) =>
              i.id === itemId ? { ...i, quantity: Math.min(100, i.quantity + safeQty) } : i
            )
          : [
              ...cartItems,
              {
                id: itemId,
                userId: uid,
                productId: sanitizeId(product.id),
                productName: product.name.slice(0, 150),
                productImage: (product.images[0] || '').slice(0, 1500),
                price: product.price,
                quantity: safeQty,
                customText,
                colorPreference,
                specialInstructions,
                referenceImageData,
              },
            ];

        await syncParentCartDoc(uid, nextItems);

        const itemRef = doc(db, 'carts', uid, 'items', itemId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          await updateDoc(itemRef, {
            quantity: Math.min(100, (existingItem?.quantity || 0) + safeQty),
            customText,
            colorPreference,
            specialInstructions,
            referenceImageData,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(itemRef, {
            userId: uid,
            productId: sanitizeId(product.id),
            productName: product.name.slice(0, 150),
            productImage: (product.images[0] || '').slice(0, 1500),
            price: product.price,
            quantity: safeQty,
            customText,
            colorPreference,
            specialInstructions,
            referenceImageData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        showToast(`Added "${product.name}" to your cart!`, 'success');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `carts/${uid}/items/${itemId}`);
      }
    }

    // Local / guest fallback
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantity: Math.min(100, i.quantity + safeQty),
                customText: customText || i.customText,
                colorPreference: colorPreference || i.colorPreference,
                specialInstructions: specialInstructions || i.specialInstructions,
                referenceImageData: referenceImageData || i.referenceImageData,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          userId: user?.uid || 'guest',
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || '',
          price: product.price,
          quantity: safeQty,
          customText,
          colorPreference,
          specialInstructions,
          referenceImageData,
        },
      ];
    });
    showToast(`Added "${product.name}" to your cart!`, 'success');
  };

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    const safeQty = Math.min(100, Math.round(quantity));

    if (user && user.emailVerified && isCloudSynced) {
      const uid = sanitizeId(user.uid);
      try {
        const item = cartItems.find((i) => i.id === itemId);
        if (!item) return;
        const nextItems = cartItems.map((i) => (i.id === itemId ? { ...i, quantity: safeQty } : i));
        await updateDoc(doc(db, 'carts', uid, 'items', itemId), {
          quantity: safeQty,
          customText: item.customText,
          colorPreference: item.colorPreference,
          specialInstructions: item.specialInstructions,
          referenceImageData: item.referenceImageData,
          updatedAt: serverTimestamp(),
        });
        await syncParentCartDoc(uid, nextItems);
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `carts/${uid}/items/${itemId}`);
      }
    }

    setCartItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: safeQty } : i)));
  };

  const removeFromCart = async (itemId: string) => {
    if (user && user.emailVerified && isCloudSynced) {
      const uid = sanitizeId(user.uid);
      try {
        const nextItems = cartItems.filter((i) => i.id !== itemId);
        await deleteDoc(doc(db, 'carts', uid, 'items', itemId));
        await syncParentCartDoc(uid, nextItems);
        showToast('Item removed from cart.', 'info');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `carts/${uid}/items/${itemId}`);
      }
    }

    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = async () => {
    if (user && user.emailVerified && isCloudSynced) {
      const uid = sanitizeId(user.uid);
      try {
        for (const item of cartItems) {
          await deleteDoc(doc(db, 'carts', uid, 'items', item.id));
        }
        await syncParentCartDoc(uid, []);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `carts/${uid}`);
      }
    }
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = async (product: Product) => {
    const existing = wishlistItems.find((w) => w.productId === product.id);

    if (user && user.emailVerified && isCloudSynced) {
      const uid = sanitizeId(user.uid);
      const wishId = sanitizeId(`${uid}_${product.id}`);
      try {
        if (existing) {
          await deleteDoc(doc(db, 'wishlists', existing.id));
          showToast(`Removed "${product.name}" from Wishlist`, 'info');
        } else {
          await setDoc(doc(db, 'wishlists', wishId), {
            userId: uid,
            productId: sanitizeId(product.id),
            productName: product.name.slice(0, 150),
            productImage: (product.images[0] || '').slice(0, 1500),
            price: product.price,
            categoryName: product.categoryName.slice(0, 100),
            createdAt: serverTimestamp(),
          });
          showToast(`Saved "${product.name}" to Wishlist ❤️`, 'success');
        }
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `wishlists/${wishId}`);
      }
    }

    if (existing) {
      setWishlistItems((prev) => prev.filter((w) => w.productId !== product.id));
      showToast(`Removed "${product.name}" from Wishlist`, 'info');
    } else {
      setWishlistItems((prev) => [
        ...prev,
        {
          id: `wish_${product.id}`,
          userId: user?.uid || 'guest',
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || '',
          price: product.price,
          categoryName: product.categoryName,
        },
      ]);
      showToast(`Saved "${product.name}" to Wishlist ❤️`, 'success');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((w) => w.productId === productId);
  };

  // ============================================================================
  // Cart Totals & Coupons
  // ============================================================================
  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const cartDiscount = (() => {
    if (!appliedCoupon || !appliedCoupon.active) return 0;
    if (cartSubtotal < appliedCoupon.minOrderAmount) return 0;
    const raw = Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100);
    return Math.min(raw, appliedCoupon.maxDiscount);
  })();

  const cartShipping = cartSubtotal === 0 ? 0 : cartSubtotal - cartDiscount >= 499 ? 0 : 49;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

  const applyCouponCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    const match = coupons.find((c) => c.code.toUpperCase() === clean && c.active);
    if (!match) {
      showToast('Invalid or expired coupon code.', 'error');
      return false;
    }
    if (cartSubtotal < match.minOrderAmount) {
      showToast(
        `Minimum order of ₹${match.minOrderAmount} required for coupon ${match.code}.`,
        'error'
      );
      return false;
    }
    setAppliedCoupon(match);
    showToast(`Coupon ${match.code} applied! (${match.discountPercent}% OFF)`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  // ============================================================================
  // Addresses, Orders, Reviews, Custom Requests
  // ============================================================================
  const saveAddress = async (
    addr: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !user.emailVerified) {
      showToast('Please sign in with a verified account to save addresses.', 'error');
      return;
    }
    const uid = sanitizeId(user.uid);
    const addrId = sanitizeId(`addr_${uid}_${Date.now()}`);
    try {
      await ensureUserDocuments(user);
      await setDoc(doc(db, 'addresses', addrId), {
        userId: uid,
        fullName: addr.fullName.trim().slice(0, 100),
        phone: addr.phone.trim().slice(0, 25),
        houseFlat: addr.houseFlat.trim().slice(0, 150),
        street: addr.street.trim().slice(0, 150),
        area: addr.area.trim().slice(0, 150),
        city: addr.city.trim().slice(0, 100),
        state: addr.state.trim().slice(0, 100),
        pinCode: addr.pinCode.trim().slice(0, 20),
        country: addr.country.trim().slice(0, 80),
        isDefault: Boolean(addr.isDefault),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Address saved to your profile!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `addresses/${addrId}`);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user || !user.emailVerified) return;
    try {
      await deleteDoc(doc(db, 'addresses', id));
      showToast('Address removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `addresses/${id}`);
    }
  };

  const createVerifiedOrder = async (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: 'razorpay' | 'paypal';
    paymentGatewayId: string;
  }): Promise<Order> => {
    const orderNumber = `MD-${Date.now().toString().slice(-6)}`;
    const orderId = sanitizeId(`ord_${Date.now()}`);
    const uid = user ? sanitizeId(user.uid) : 'guest';

    const itemsSummary = cartItems
      .map(
        (i) =>
          `${i.quantity}x ${i.productName}${
            i.customText ? ` [Custom: ${i.customText}]` : ''
          }`
      )
      .join(' | ')
      .slice(0, 2000);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: uid,
      customerName: orderData.customerName.trim().slice(0, 100),
      customerEmail: orderData.customerEmail.trim().slice(0, 254),
      customerPhone: orderData.customerPhone.trim().slice(0, 25),
      shippingAddress: orderData.shippingAddress.trim().slice(0, 1000),
      itemsSummary: itemsSummary || '1x Handmade Artwork',
      subtotal: cartSubtotal,
      discountAmount: cartDiscount,
      couponCode: appliedCoupon?.code || '',
      shippingCost: cartShipping,
      totalAmount: cartTotal,
      paymentMethod: orderData.paymentMethod,
      paymentGatewayId: orderData.paymentGatewayId.slice(0, 200),
      paymentStatus: 'Paid',
      orderStatus: 'Payment Confirmed',
      items: cartItems.map((c, idx) => ({
        id: `item_${idx + 1}`,
        orderId,
        userId: uid,
        productId: c.productId,
        productName: c.productName,
        productImage: c.productImage,
        price: c.price,
        quantity: c.quantity,
        customText: c.customText,
        colorPreference: c.colorPreference,
        specialInstructions: c.specialInstructions,
        referenceImageData: c.referenceImageData,
      })),
    };

    if (user && user.emailVerified) {
      try {
        await ensureUserDocuments(user);
        await setDoc(doc(db, 'orders', orderId), {
          orderNumber: newOrder.orderNumber,
          userId: uid,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail,
          customerPhone: newOrder.customerPhone,
          shippingAddress: newOrder.shippingAddress,
          itemsSummary: newOrder.itemsSummary,
          subtotal: newOrder.subtotal,
          discountAmount: newOrder.discountAmount,
          couponCode: newOrder.couponCode,
          shippingCost: newOrder.shippingCost,
          totalAmount: newOrder.totalAmount,
          paymentMethod: newOrder.paymentMethod,
          paymentGatewayId: newOrder.paymentGatewayId,
          paymentStatus: newOrder.paymentStatus,
          orderStatus: newOrder.orderStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (isCloudSynced) {
          for (let i = 0; i < cartItems.length; i++) {
            const c = cartItems[i];
            const itemDocId = sanitizeId(`item_${i + 1}_${c.productId}`);
            await setDoc(doc(db, 'orders', orderId, 'items', itemDocId), {
              orderId,
              userId: uid,
              productId: sanitizeId(c.productId),
              productName: c.productName.slice(0, 150),
              productImage: c.productImage.slice(0, 1500),
              price: c.price,
              quantity: c.quantity,
              customText: c.customText.slice(0, 300),
              colorPreference: c.colorPreference.slice(0, 200),
              specialInstructions: c.specialInstructions.slice(0, 1000),
              referenceImageData: c.referenceImageData.slice(0, 350000),
              createdAt: serverTimestamp(),
            });

            // Decrement stock on product
            const prod = products.find((p) => p.id === c.productId);
            if (prod && prod.stock >= c.quantity) {
              const nextStock = Math.max(0, prod.stock - c.quantity);
              await updateDoc(doc(db, 'products', sanitizeId(prod.id)), {
                stock: nextStock,
                inStock: nextStock > 0,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    } else {
      setOrders((prev) => [newOrder, ...prev]);
    }

    setLastCreatedOrder(newOrder);
    await clearCart();
    return newOrder;
  };

  const submitReview = async (
    productId: string,
    productName: string,
    rating: number,
    comment: string
  ) => {
    if (!user || !user.emailVerified) {
      showToast('Please sign in with a verified account to post a review.', 'error');
      return;
    }
    const uid = sanitizeId(user.uid);
    const revId = sanitizeId(`rev_${uid}_${Date.now()}`);
    const cleanComment = comment.trim().slice(0, 1000);
    const safeRating = Math.max(1, Math.min(5, Math.round(rating)));

    if (isCloudSynced) {
      try {
        await setDoc(doc(db, 'reviews', revId), {
          productId: sanitizeId(productId),
          productName: productName.slice(0, 150),
          userId: uid,
          authorName: (userProfile?.displayName || user.displayName || 'Verified Customer').slice(
            0,
            100
          ),
          rating: safeRating,
          comment: cleanComment,
          approved: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Thank you! Your review has been published.', 'success');
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reviews/${revId}`);
      }
    }

    setReviews((prev) => [
      {
        id: revId,
        productId,
        productName,
        userId: uid,
        authorName: userProfile?.displayName || user.displayName || 'Verified Customer',
        rating: safeRating,
        comment: cleanComment,
        approved: true,
      },
      ...prev,
    ]);
    showToast('Thank you! Your review has been published.', 'success');
  };

  const submitCustomArtRequest = async (
    req: Omit<CustomArtRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !user.emailVerified) {
      showToast(
        'Please sign in with Google or a verified email account to submit your custom artwork request.',
        'error'
      );
      navigateTo('login');
      return;
    }
    const uid = sanitizeId(user.uid);
    const reqId = sanitizeId(`creq_${uid}_${Date.now()}`);
    try {
      await ensureUserDocuments(user);
      await setDoc(doc(db, 'custom_requests', reqId), {
        userId: uid,
        name: req.name.trim().slice(0, 100),
        email: req.email.trim().slice(0, 254),
        phone: req.phone.trim().slice(0, 25),
        productType: req.productType.trim().slice(0, 100),
        preferredSize: req.preferredSize.trim().slice(0, 100),
        budget: req.budget.trim().slice(0, 80),
        description: req.description.trim().slice(0, 2000),
        colorPreference: req.colorPreference.trim().slice(0, 200),
        referenceImageData: req.referenceImageData.slice(0, 350000),
        additionalInstructions: req.additionalInstructions.trim().slice(0, 1000),
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(
        'Your Custom Art Request has been saved! MD ART STUDIO will contact you shortly.',
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `custom_requests/${reqId}`);
    }
  };

  const submitContactMessage = async (data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => {
    if (user && user.emailVerified) {
      const uid = sanitizeId(user.uid);
      const msgId = sanitizeId(`msg_${uid}_${Date.now()}`);
      try {
        await ensureUserDocuments(user);
        await setDoc(doc(db, 'contact_messages', msgId), {
          userId: uid,
          name: data.name.trim().slice(0, 100),
          email: data.email.trim().slice(0, 254),
          phone: data.phone.trim().slice(0, 25),
          subject: data.subject.trim().slice(0, 200),
          message: data.message.trim().slice(0, 2000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `contact_messages/${msgId}`);
      }
    }
    showToast('Thank you for reaching out to MD ART STUDIO! We will reply soon.', 'success');
  };

  // ============================================================================
  // Admin Dashboard CRUD Operations
  // ============================================================================
  const saveProductAdmin = async (
    product: Omit<Product, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    if (!isAdmin) {
      showToast('Unauthorized: Admin access required.', 'error');
      return;
    }
    const prodId = sanitizeId(product.id || `prod_${Date.now()}`);
    const payload = {
      name: product.name.trim().slice(0, 150),
      slug: (
        product.slug ||
        product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      ).slice(0, 150),
      categoryId: sanitizeId(product.categoryId),
      categoryName: product.categoryName.trim().slice(0, 100),
      price: Math.max(0, Number(product.price)),
      compareAtPrice: Math.max(0, Number(product.compareAtPrice || product.price)),
      description: product.description.trim().slice(0, 2500),
      materials: product.materials.trim().slice(0, 500),
      size: product.size.trim().slice(0, 200),
      stock: Math.max(0, Math.round(Number(product.stock))),
      inStock: Number(product.stock) > 0 && Boolean(product.inStock),
      customizable: Boolean(product.customizable),
      featured: Boolean(product.featured),
      bestSeller: Boolean(product.bestSeller),
      images:
        product.images.length > 0
          ? product.images.slice(0, 8)
          : [INITIAL_PRODUCTS[0].images[0]],
      keywords: (product.keywords || '').trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    };

    try {
      const ref = doc(db, 'products', prodId);
      const snap = await getDoc(ref);
      if (isNew || !snap.exists()) {
        // Ensure parent category exists in Firestore first
        const catRef = doc(db, 'categories', payload.categoryId);
        const catSnap = await getDoc(catRef);
        if (!catSnap.exists()) {
          const fallbackCat =
            categories.find((c) => c.id === payload.categoryId) || INITIAL_CATEGORIES[0];
          await setDoc(catRef, {
            slug: fallbackCat.slug,
            name: fallbackCat.name,
            startingPrice: fallbackCat.startingPrice,
            description: fallbackCat.description,
            imageUrl: fallbackCat.imageUrl,
            sortOrder: fallbackCat.sortOrder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, payload);
      }
      showToast(`Product "${payload.name}" saved!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${prodId}`);
    }
  };

  const deleteProductAdmin = async (productId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'products', sanitizeId(productId)));
      showToast('Product deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const saveCategoryAdmin = async (
    category: Omit<Category, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    if (!isAdmin) return;
    const catId = sanitizeId(category.id || `cat_${Date.now()}`);
    const payload = {
      slug: sanitizeId(category.slug || category.name.toLowerCase()),
      name: category.name.trim().slice(0, 100),
      startingPrice: Math.max(0, Number(category.startingPrice)),
      description: category.description.trim().slice(0, 600),
      imageUrl: (category.imageUrl || INITIAL_CATEGORIES[0].imageUrl).slice(0, 1500),
      sortOrder: Math.max(0, Number(category.sortOrder)),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = doc(db, 'categories', catId);
      const snap = await getDoc(ref);
      if (isNew || !snap.exists()) {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, payload);
      }
      showToast(`Category "${payload.name}" saved!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${catId}`);
    }
  };

  const deleteCategoryAdmin = async (categoryId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'categories', sanitizeId(categoryId)));
      showToast('Category deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
  };

  const updateOrderStatusAdmin = async (
    orderId: string,
    orderStatus: OrderStatusType,
    paymentStatus: PaymentStatusType
  ) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'orders', sanitizeId(orderId)), {
        orderStatus,
        paymentStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order status updated to "${orderStatus}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateCustomRequestStatusAdmin = async (
    requestId: string,
    status: CustomArtRequest['status']
  ) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'custom_requests', sanitizeId(requestId)), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Custom Art Request marked as "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `custom_requests/${requestId}`);
    }
  };

  const saveCouponAdmin = async (
    coupon: Omit<Coupon, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    if (!isAdmin) return;
    const coupId = sanitizeId(coupon.id || `coupon_${coupon.code.toLowerCase()}`);
    const payload = {
      code: sanitizeId(coupon.code.toUpperCase()).slice(0, 40),
      discountPercent: Math.max(1, Math.min(90, Number(coupon.discountPercent))),
      minOrderAmount: Math.max(0, Number(coupon.minOrderAmount)),
      maxDiscount: Math.max(1, Number(coupon.maxDiscount)),
      active: Boolean(coupon.active),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = doc(db, 'coupons', coupId);
      const snap = await getDoc(ref);
      if (isNew || !snap.exists()) {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, payload);
      }
      showToast(`Coupon ${payload.code} saved!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `coupons/${coupId}`);
    }
  };

  const deleteCouponAdmin = async (couponId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'coupons', sanitizeId(couponId)));
      showToast('Coupon deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${couponId}`);
    }
  };

  const toggleReviewApprovalAdmin = async (review: Review) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'reviews', sanitizeId(review.id)), {
        approved: !review.approved,
        rating: review.rating,
        comment: review.comment,
        updatedAt: serverTimestamp(),
      });
      showToast('Review visibility updated.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${review.id}`);
    }
  };

  const deleteReviewAdmin = async (reviewId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'reviews', sanitizeId(reviewId)));
      showToast('Review deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        selectedProductId,
        selectedCategoryFilter,
        searchQuery,
        lastCreatedOrder,
        navigateTo,
        setSearchQuery,
        setSelectedCategoryFilter,
        toastMessage,
        showToast,
        user,
        userProfile,
        userPrivate,
        isAdmin,
        authReady,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        sendMobileOtp,
        verifyMobileOtp,
        logout,
        updateUserProfileDetails,
        categories,
        products,
        reviews,
        coupons,
        isCloudSynced,
        seedDefaultCatalogToFirestore,
        cartItems,
        wishlistItems,
        appliedCoupon,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        toggleWishlist,
        isInWishlist,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTotal,
        savedAddresses,
        orders,
        customRequests,
        allUsersAdmin,
        saveAddress,
        deleteAddress,
        createVerifiedOrder,
        submitReview,
        submitCustomArtRequest,
        submitContactMessage,
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
        paymentConfig,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
