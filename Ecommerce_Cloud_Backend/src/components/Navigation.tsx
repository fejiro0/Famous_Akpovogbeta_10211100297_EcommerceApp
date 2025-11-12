"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaBox,
  FaTags,
  FaStar,
  FaSearch,
  FaHome,
  FaUser,
  FaEnvelope,
} from "react-icons/fa";
import { FiChevronDown, FiMenu } from "react-icons/fi";

const CART_KEY = "gomart:cart";

type SessionUser = {
  firstName?: string;
  lastName?: string;
  email: string;
};

type Category = {
  id: string;
  categoryName: string;
};

type CartSnapshot = {
  items: Array<{ productId: string; quantity: number }>;
};

function readCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem(CART_KEY);
    const snapshot: CartSnapshot["items"] = stored ? JSON.parse(stored) : [];
    return snapshot.reduce((sum, item) => sum + (item.quantity || 0), 0);
  } catch (error) {
    return 0;
  }
}

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data?.categories || []);
        }
      } catch (error) {
        setCategories([]);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    setMounted(true);
    
    function loadUser() {
      try {
        const stored = localStorage.getItem("gomart:user");
        const userData = stored ? JSON.parse(stored) : null;
        setUser(userData);
        
        // Load unread messages when user is loaded
        if (userData?.id) {
          const userType = userData.userType || 'customer';
          loadUnreadMessages(userData.id, userType);
        }
      } catch (error) {
        setUser(null);
      }
    }

    function loadCart() {
      setCartCount(readCartCount());
    }

    async function loadUnreadMessages(userId: string, userType: string = 'customer') {
      try {
        const res = await fetch(`/api/conversations?userId=${userId}&userType=${userType}`);
        if (res.ok) {
          const data = await res.json();
          // Count total unread messages from all conversations
          const unreadField = userType === 'vendor' ? 'vendorUnread' : 'customerUnread';
          const totalUnread = data.data?.conversations?.reduce((sum: number, conv: any) => sum + (conv[unreadField] || 0), 0) || 0;
          setUnreadMessageCount(totalUnread);
        }
      } catch (error) {
        // Silently fail - not critical
        console.error('Failed to load unread messages:', error);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === "gomart:user") {
        loadUser();
      }
      if (event.key === CART_KEY) {
        // Defer state update to avoid updating during render
        setTimeout(() => {
          loadCart();
        }, 0);
      }
      if (event.key === "gomart:messages") {
        // Reload unread count when messages change
        const stored = localStorage.getItem("gomart:user");
        if (stored) {
          const userData = JSON.parse(stored);
          if (userData?.id) {
            const userType = userData.userType || 'customer';
            loadUnreadMessages(userData.id, userType);
          }
        }
      }
    }

    loadUser();
    loadCart();
    window.addEventListener("storage", handleStorage);

    // Poll for new messages every 30 seconds
    const messageInterval = setInterval(() => {
      const stored = localStorage.getItem("gomart:user");
      if (stored) {
        const userData = JSON.parse(stored);
        if (userData?.id) {
          const userType = userData.userType || 'customer';
          loadUnreadMessages(userData.id, userType);
        }
      }
    }, 30000); // 30 seconds

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(messageInterval);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setProfileOpen(false);
        setCategoriesOpen(false);
        setSearchOpen(false);
      }
    }

    if (profileOpen || categoriesOpen || searchOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileOpen, categoriesOpen, searchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split("@")[0];
    return "Account";
  }, [user]);

  function handleSignOut() {
    localStorage.removeItem("gomart:user");
    setUser(null);
    setProfileOpen(false);
    router.push("/");
  }

  function navClass(target: string) {
    const base = "text-gray-200 hover:text-white font-medium";
    return pathname === target ? `${base} text-white` : base;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-transparent">
        <div className="ghana-ribbon" />
        <div className="bg-[rgba(7,13,24,0.82)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.05)]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl font-extrabold text-white tracking-tight">GoMart</span>
                <span className="text-xl">🇬🇭</span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className={navClass("/")}>
                  <FaHome className="inline mr-1" />
                  Home
                </Link>
                <div className="relative dropdown-trigger">
                  <button
                    className={`inline-flex items-center gap-1 ${navClass("/ui/categories/list")}`}
                    onClick={() => setCategoriesOpen((prev) => !prev)}
                    type="button"
                    aria-expanded={categoriesOpen}
                    aria-haspopup="true"
                  >
                    <FaTags className="inline mr-1" />
                    Categories <FiChevronDown className={`text-sm transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {categoriesOpen && categories.length > 0 && (
                    <div className="dropdown-menu absolute left-0 mt-3 w-[540px] rounded-3xl border border-white/10 bg-[rgba(7,13,24,0.96)] shadow-xl p-6 grid grid-cols-2 gap-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {categories.slice(0, 10).map((category) => (
                        <Link
                          key={category.id}
                          href={`/ui/products/list?category=${category.id}`}
                          className="rounded-2xl px-3 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                          onClick={() => setCategoriesOpen(false)}
                        >
                          {category.categoryName}
                        </Link>
                      ))}
                      <Link
                        href="/ui/categories/list"
                        className="col-span-2 mt-2 rounded-2xl border border-white/10 px-3 py-2 text-center text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        View all categories →
                      </Link>
                    </div>
                  )}
                </div>
                <Link href="/ui/products/list" className={navClass("/ui/products/list")}>
                  Products
                </Link>
                <Link href="/ui/vendors/list" className={navClass("/ui/vendors/list")}>
                  Vendors
                </Link>
                <Link href="/ui/conversations" className={`${navClass("/ui/conversations")} relative`}>
                  Messages
                  {mounted && unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="relative text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Search"
                >
                  <FaSearch className="text-xl" />
                </button>
                
                <Link href="/ui/cart" className="relative text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <FaShoppingCart className="text-xl" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--secondary)] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg px-1.5 font-semibold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>

                {!user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/ui/customers/login" className="btn-primary text-sm">
                      Sign In
                    </Link>
                    <Link href="/ui/customers/register" className="btn-accent text-sm">
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="relative dropdown-trigger">
                    <button
                      onClick={() => setProfileOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm font-semibold text-white hover:border-white/20 hover:bg-[rgba(255,255,255,0.08)] transition-all"
                      aria-expanded={profileOpen}
                      aria-haspopup="true"
                    >
                      <FaUser className="text-sm" />
                      <span>{displayName}</span>
                      <FiChevronDown className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {profileOpen && (
                      <div className="dropdown-menu absolute right-0 mt-2 w-56 rounded-2xl bg-[rgba(7,13,24,0.95)] border border-white/10 shadow-xl p-2 text-sm text-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-gray-500">Account</p>
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          View Profile
                        </Link>
                        <Link
                          href="/ui/vendors/new"
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          Register as Vendor
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="mt-2 w-full rounded-xl px-3 py-2 text-left hover:bg-white/10 text-[var(--secondary)] transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                className="md:hidden text-gray-100 p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
              </button>
            </div>

            {/* Search Bar - Desktop */}
            {searchOpen && (
              <div className="hidden md:block pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center">
                  <div className="w-11 h-11 mr-2 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-500">
                    <FaSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products, categories..."
                    className="w-full h-11 border rounded-lg px-3 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]/40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value;
                        router.push(`/ui/products/list?search=${encodeURIComponent(query)}`);
                        setSearchOpen(false);
                      }
                      if (e.key === 'Escape') {
                        setSearchOpen(false);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-[rgba(255,255,255,0.1)] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col space-y-3">
                  {/* Mobile Search */}
                  <div className="mb-4 flex items-center">
                    <div className="w-11 h-11 mr-2 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600">
                      <FaSearch />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full h-11 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const query = (e.target as HTMLInputElement).value;
                          router.push(`/ui/products/list?search=${encodeURIComponent(query)}`);
                          setMobileMenuOpen(false);
                        }
                      }}
                    />
                  </div>

                  <Link href="/" className={`${navClass("/")} py-2 flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                    <FaHome /> Home
                  </Link>
                  <Link
                    href="/ui/products/list"
                    className={`${navClass("/ui/products/list")} py-2 flex items-center gap-2`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                  <Link
                    href="/ui/vendors/list"
                    className={`${navClass("/ui/vendors/list")} py-2 flex items-center gap-2`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vendors
                  </Link>
                  <Link
                    href="/ui/conversations"
                    className={`${navClass("/ui/conversations")} py-2 flex items-center gap-2 relative`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaEnvelope /> Messages
                    {mounted && unreadMessageCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 font-semibold">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/ui/categories/list"
                    className={`${navClass("/ui/categories/list")} py-2 flex items-center gap-2`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaTags /> Categories
                  </Link>
                  <Link
                    href="/ui/cart"
                    className={`${navClass("/ui/cart")} py-2 flex items-center gap-2`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaShoppingCart /> Cart {mounted && cartCount > 0 && `(${cartCount})`}
                  </Link>

                  {!user ? (
                    <div className="flex gap-3 pt-2">
                      <Link
                        href="/ui/customers/login"
                        className="btn-primary text-sm flex-1 text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/ui/customers/register"
                        className="btn-accent text-sm flex-1 text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl p-3 space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-[0.3em]">
                        {displayName}
                      </p>
                      <Link
                        href="/profile"
                        className="block rounded-xl px-3 py-2 text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        href="/ui/vendors/new"
                        className="block rounded-xl px-3 py-2 text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Register as Vendor
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-[var(--secondary)] hover:bg-white/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="bg-[rgba(15,22,37,0.95)] border-b border-[rgba(255,255,255,0.05)]">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-6 py-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">MANAGE:</span>
              <Link
                href="/ui/products/new"
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <FaBox /> Add Product
              </Link>
              <Link
                href="/ui/categories/new"
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <FaTags /> Add Category
              </Link>
              <Link
                href="/ui/reviews/list"
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <FaStar /> Reviews
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[rgba(7,13,24,0.95)] border-t border-white/10 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 text-xs text-gray-300">
          <Link href="/" className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${pathname === '/' ? 'text-[var(--gold)]' : ''}`}>
            <FaHome className="text-lg" />
            <span>Home</span>
          </Link>
          <Link href="/ui/products/list" className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${pathname === '/ui/products/list' ? 'text-[var(--gold)]' : ''}`}>
            <span>Products</span>
          </Link>
          <Link href="/ui/cart" className={`flex flex-col items-center justify-center py-3 gap-1 relative transition-colors ${pathname === '/ui/cart' ? 'text-[var(--gold)]' : ''}`}>
            <FaShoppingCart className="text-lg" />
            {mounted && cartCount > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-6 bg-[var(--secondary)] text-white text-xs rounded-full min-w-[18px] h-4 flex items-center justify-center px-1 font-semibold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span>Cart</span>
          </Link>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${searchOpen ? 'text-[var(--gold)]' : ''}`}
          >
            <FaSearch className="text-lg" />
            <span>Search</span>
          </button>
          <Link
            href={user ? "/profile" : "/ui/customers/login"}
            className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${pathname === '/profile' || pathname === '/ui/customers/login' ? 'text-[var(--gold)]' : ''}`}
          >
            <FaUser className="text-lg" />
            <span>{user ? "Profile" : "Account"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}





