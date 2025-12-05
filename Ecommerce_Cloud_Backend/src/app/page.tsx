"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaShoppingCart, FaStar, FaMapMarkerAlt, FaShieldAlt, FaMobileAlt, FaBolt, FaPlus, FaMinus, FaTrash, FaTimes } from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import { toast } from "react-toastify";

type Product = {
  id: string;
  productName: string;
  description: string;
  price: number;
  imageURL?: string;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  category: { id: string; categoryName: string };
  vendor: {
    vendorName: string;
    region: string;
    isVerified: boolean;
  };
};

type Category = {
  id: string;
  categoryName: string;
  description?: string;
};

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  imageURL?: string | null;
  quantity: number;
  stockQuantity: number;
};

const CART_KEY = "gomart:cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse cart", error);
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new StorageEvent("storage", { key: CART_KEY }));
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products?limit=8"),
          fetch("/api/categories"),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          const products = data.data?.products || [];
          setFeaturedProducts(products);
          // Initialize quantities to 1 for each product
          const initialQuantities: Record<string, number> = {};
          products.forEach((product: Product) => {
            initialQuantities[product.id] = 1;
          });
          setProductQuantities(initialQuantities);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.data?.categories || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Load cart from localStorage
    const items = readCart();
    setCartItems(items);

    // Listen for cart changes
    function handleStorage(event: StorageEvent) {
      if (event.key === CART_KEY) {
        const items = readCart();
        setCartItems(items);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 20;
    const total = subtotal + shipping;
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, shipping, total, totalItems };
  }, [cartItems]);

  function updateQuantity(productId: string, delta: number) {
    setProductQuantities((prev) => {
      const current = prev[productId] || 1;
      const product = featuredProducts.find((p) => p.id === productId);
      const maxQuantity = product?.stockQuantity || 1;
      const newQuantity = Math.min(Math.max(current + delta, 1), maxQuantity);
      return { ...prev, [productId]: newQuantity };
    });
  }

  function setQuantity(productId: string, quantity: number) {
    const product = featuredProducts.find((p) => p.id === productId);
    const maxQuantity = product?.stockQuantity || 1;
    const validQuantity = Math.min(Math.max(quantity, 1), maxQuantity);
    setProductQuantities((prev) => ({ ...prev, [productId]: validQuantity }));
  }

  async function updateProductStock(productId: string, quantityChange: number) {
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityChange }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update stock');
      }

      const result = await response.json();
      
      // Update local product state with new stock
      setFeaturedProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stockQuantity: result.data.newStock }
            : p
        )
      );

      return result;
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  }

  async function refreshProduct(productId: string) {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.product) {
          setFeaturedProducts((prev) =>
            prev.map((p) =>
              p.id === productId
                ? { ...p, stockQuantity: data.data.product.stockQuantity }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to refresh product:', error);
    }
  }

  async function addToCart(product: Product) {
    const quantity = productQuantities[product.id] || 1;
    
    if (quantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    if (product.stockQuantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    const currentCart = readCart();
    const existingItemIndex = currentCart.findIndex((item) => item.productId === product.id);

    let quantityChange = quantity;
    let updatedCart: CartItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = currentCart[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stockQuantity) {
        toast.error(`Cannot add more. Only ${product.stockQuantity} items available in stock`);
        return;
      }

      quantityChange = quantity; // Only the new quantity being added
      updatedCart = currentCart.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: newQuantity, stockQuantity: product.stockQuantity - quantity }
          : item
      );
      toast.success(`Updated quantity in cart`);
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.productName,
        price: product.price,
        imageURL: product.imageURL,
        quantity,
        stockQuantity: product.stockQuantity - quantity,
      };
      updatedCart = [...currentCart, newItem];
      toast.success("Added to cart");
    }

    // Update stock in database
    try {
      await updateProductStock(product.id, -quantityChange);
      writeCart(updatedCart);
      setCartItems(updatedCart);
      setShowCartPreview(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock. Please try again.");
    }
  }

  async function updateCartQuantity(productId: string, delta: number) {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    // Check current product stock from database
    const product = featuredProducts.find((p) => p.id === productId);
    if (!product) {
      // Try to refresh product data
      await refreshProduct(productId);
      const refreshedProduct = featuredProducts.find((p) => p.id === productId);
      if (!refreshedProduct) {
        toast.error("Product not found");
        return;
      }
    }

    const currentProduct = product || featuredProducts.find((p) => p.id === productId);
    if (!currentProduct) return;

    const oldQuantity = item.quantity;
    const availableStock = currentProduct.stockQuantity;
    
    // Calculate new quantity
    let newQuantity = oldQuantity + delta;
    
    // Validate new quantity
    if (delta > 0) {
      // Increasing quantity - check available stock
      if (availableStock < delta) {
        toast.error(`Only ${availableStock} items available in stock`);
        return;
      }
      newQuantity = Math.min(newQuantity, oldQuantity + availableStock);
    } else {
      // Decreasing quantity - minimum is 1
      newQuantity = Math.max(newQuantity, 1);
    }

    const updated = cartItems.map((cartItem) => {
      if (cartItem.productId !== productId) return cartItem;
      return { 
        ...cartItem, 
        quantity: newQuantity,
        stockQuantity: availableStock - (newQuantity - oldQuantity)
      };
    });

    // Update stock in database
    try {
      const stockChange = delta;
      await updateProductStock(productId, -stockChange);
      writeCart(updated);
      setCartItems(updated);
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock. Please try again.");
    }
  }

  async function removeFromCart(productId: string) {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    const quantityToRestore = item.quantity;
    const updated = cartItems.filter((cartItem) => cartItem.productId !== productId);

    // Restore stock in database
    try {
      await updateProductStock(productId, quantityToRestore);
      writeCart(updated);
      setCartItems(updated);
      toast.success("Removed from cart");
    } catch (error: any) {
      toast.error(error.message || "Failed to restore stock. Please try again.");
    }
  }

  async function clearCart() {
    // Restore stock for all items
    const restorePromises = cartItems.map((item) =>
      updateProductStock(item.productId, item.quantity).catch((error) => {
        console.error(`Failed to restore stock for ${item.productId}:`, error);
      })
    );

    await Promise.all(restorePromises);
    writeCart([]);
    setCartItems([]);
    toast.success("Cart cleared");
  }

  const heroStats = [
    {
      label: "Verified vendors",
      value: "80+",
      detail: "Trusted sellers across Ghana",
    },
    {
      label: "Products ready",
      value: `${featuredProducts.length.toString().padStart(2, "0")}+`,
      detail: "Curated for Ghanaian shoppers",
    },
    {
      label: "Regions covered",
      value: "16",
      detail: "Nationwide delivery network",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass-surface px-6 py-12 lg:px-12">
        <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[rgba(10,155,69,0.35)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-[rgba(214,27,41,0.28)] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr,0.85fr] items-center">
          <div className="space-y-6">
            <span className="pill inline-flex items-center gap-2">GoMart • Ghana's digital marketplace</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
              Shop Ghana. Support Ghana. <span className="text-[var(--gold)]">GoMart</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-200 max-w-2xl">
              Discover quality goods from verified vendors across all 16 regions. Pay securely with Ghana's favourite mobile money services and enjoy trusted, fast delivery anywhere you are.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/ui/products/list" className="btn-primary px-6 py-3 rounded-xl text-base font-semibold shadow-lg shadow-[rgba(10,155,69,0.25)]">
                Start Shopping
              </Link>
              <Link href="/ui/categories/list" className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2">
                Explore Categories →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[rgba(255,255,255,0.03)] border border-white/10 px-4 py-5">
                  <p className="text-3xl font-extrabold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mt-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {stat.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-[rgba(255,255,255,0.04)] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Trending now</p>
                  <h3 className="text-xl font-semibold text-white">Popular picks in Ghana</h3>
                </div>
                <span className="pill">Live</span>
              </div>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {featuredProducts.slice(0, 4).map((product) => (
                  <Link key={product.id} href={`/ui/products/${product.id}`} className="flex items-center gap-4 rounded-2xl bg-[rgba(15,22,37,0.65)] border border-white/5 p-3 hover:border-white/20 transition">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-[rgba(255,255,255,0.04)]">
                      {product.imageURL ? (
                        <Image 
                          src={product.imageURL} 
                          alt={product.productName} 
                          fill 
                          className="object-cover" 
                          quality={90}
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-500">
                          <FiImage className="text-2xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white line-clamp-1">{product.productName}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{product.category.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--gold)]">GH₵ {product.price.toFixed(2)}</p>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mt-1">{product.vendor.region}</p>
                    </div>
                  </Link>
                ))}
                {featuredProducts.length === 0 && (
                  <p className="text-sm text-gray-400">No featured products yet. Add your first product to appear here.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why GoMart */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: <FaShieldAlt className="text-2xl text-[var(--gold)]" />,
            title: "Verified & secure",
            body: "Every vendor passes strict verification so you can shop with confidence and receive authentic products.",
          },
          {
            icon: <FaMobileAlt className="text-2xl text-[var(--gold)]" />,
            title: "Mobile money ready",
            body: "Pay seamlessly with MTN, Vodafone Cash or AirtelTigo Money. Bank transfer support is coming soon.",
          },
          {
            icon: <FaBolt className="text-2xl text-[var(--gold)]" />,
            title: "Nationwide logistics",
            body: "Fast delivery across all 16 regions with trusted courier partners like Ghana Post, DHL and Bolt.",
          },
        ].map((feature) => (
          <div key={feature.title} className="glass-surface rounded-3xl p-6 card-hover flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(244,196,48,0.12)] flex items-center justify-center">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{feature.body}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="pill">Explore categories</span>
              <h2 className="mt-3 text-3xl font-bold text-white">Shop by interest</h2>
              <p className="text-sm text-gray-400 max-w-xl">From electronics and fashion to food and beauty – discover collections curated for Ghanaian lifestyles.</p>
            </div>
            <Link href="/ui/categories/list" className="text-sm font-semibold text-gray-300 hover:text-white">
              View all categories →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/ui/products/list?category=${category.id}`}
                className="rounded-2xl bg-[rgba(16,26,47,0.85)] border border-white/5 hover:border-white/20 transition p-5 flex flex-col gap-3"
              >
                <span className="text-3xl">{getCategoryIcon(category.categoryName)}</span>
                <h3 className="text-sm font-semibold text-white">{category.categoryName}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {category.description || "Discover top-rated products from verified vendors."}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="pill">Featured this week</span>
            <h2 className="mt-3 text-3xl font-bold text-white">Trending products in Ghana</h2>
          </div>
          <Link href="/ui/products/list" className="text-sm font-semibold text-gray-300 hover:text-white">
            Browse marketplace →
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="glass-surface rounded-3xl p-12 text-center text-gray-300">
            <p className="text-lg font-semibold">No products available yet</p>
            <p className="text-sm text-gray-400 mt-2">As soon as vendors add their products, they will appear here automatically.</p>
            <Link href="/ui/products/new" className="btn-accent inline-flex mt-6 px-6 py-3 rounded-xl text-sm font-semibold">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <div key={product.id} className="glass-surface rounded-3xl overflow-hidden card-hover flex flex-col">
                <div className="relative h-56 bg-[rgba(255,255,255,0.05)]">
                  {product.imageURL ? (
                    <Image 
                      src={product.imageURL} 
                      alt={product.productName} 
                      fill 
                      className="object-cover" 
                      quality={90}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                      <FiImage className="text-5xl" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="pill bg-[rgba(10,155,69,0.2)] text-[var(--primary)]">{product.category.categoryName}</span>
                    {product.vendor.isVerified && (
                      <span className="pill bg-[rgba(244,196,48,0.2)] text-[var(--gold)]">Verified</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{product.productName}</h3>
                    <span className="text-sm text-gray-400">{product.vendor.vendorName}</span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">{product.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-[var(--gold)]" />
                      <span>{product.averageRating.toFixed(1)} · {product.reviewCount} reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-[var(--gold)]" />
                      <span>{product.vendor.region}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">Price</p>
                        <p className="text-3xl font-extrabold text-[var(--gold)]">GH₵ {product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-[0.35em] mb-1">Stock Available</p>
                        {product.stockQuantity > 0 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${
                            product.stockQuantity < 10 
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            <span className="text-lg">{product.stockQuantity}</span>
                            <span className="text-xs">units</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                            <span>Out of stock</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {product.stockQuantity > 0 && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-400 uppercase tracking-[0.35em]">Quantity:</label>
                        <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-xl border border-white/10 p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, -1);
                            }}
                            disabled={productQuantities[product.id] <= 1}
                            className="rounded-lg border border-white/20 p-1.5 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.stockQuantity}
                            value={productQuantities[product.id] || 1}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setQuantity(product.id, value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 text-center bg-transparent text-white font-semibold text-sm border-none outline-none"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, 1);
                            }}
                            disabled={productQuantities[product.id] >= product.stockQuantity}
                            className="rounded-lg border border-white/20 p-1.5 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">
                          Max: {product.stockQuantity}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/ui/products/${product.id}`}
                        className="btn-primary flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-center"
                      >
                        View product
                      </Link>
                      {product.stockQuantity > 0 ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                          }}
                          className="btn-accent px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                        >
                          <FaShoppingCart /> Add to cart
                        </button>
                      ) : (
                        <button
                          disabled
                          className="btn-accent px-4 py-2 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
                        >
                          Out of stock
                        </button>
                      )}
                    </div>
                  </div>

                  {product.stockQuantity <= 0 ? (
                    <p className="text-xs font-semibold text-red-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                      Out of stock – check back soon.
                    </p>
                  ) : product.stockQuantity < 10 ? (
                    <p className="text-xs font-semibold text-orange-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse"></span>
                      Only {product.stockQuantity} left. Order now!
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      {product.stockQuantity} units available in stock
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cart Preview Modal */}
      {showCartPreview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCartPreview(false)}>
          <div className="glass-surface rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <p className="text-sm text-gray-400 mt-1">{cartTotals.totalItems} item(s) selected</p>
              </div>
              <button
                onClick={() => setShowCartPreview(false)}
                className="rounded-full border border-white/20 p-2 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <FaShoppingCart className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-300">Your cart is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} className="glass-surface rounded-2xl p-4 flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                      {item.imageURL ? (
                        <Image src={item.imageURL} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <FiImage className="text-xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-white line-clamp-1">{item.productName}</h3>
                          <p className="text-xs text-gray-400">GH₵ {item.price.toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-lg border border-white/10 p-1">
                          <button
                            onClick={() => updateCartQuantity(item.productId, -1)}
                            className="rounded border border-white/20 p-1 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all"
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <span className="min-w-[32px] text-center font-semibold text-white text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, 1)}
                            disabled={(() => {
                              const product = featuredProducts.find((p) => p.id === item.productId);
                              return product ? item.quantity >= product.stockQuantity : true;
                            })()}
                            className="rounded border border-white/20 p-1 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[var(--gold)]">
                            GH₵ {(item.price * item.quantity).toFixed(2)}
                          </p>
                          {(() => {
                            const product = featuredProducts.find((p) => p.id === item.productId);
                            const availableStock = product?.stockQuantity || 0;
                            return (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {availableStock > 0 ? (
                                  <span className="text-green-400">{availableStock} available in stock</span>
                                ) : (
                                  <span className="text-red-400">Out of stock</span>
                                )}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-white/10 p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">GH₵ {cartTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span className="font-semibold">{cartTotals.shipping === 0 ? "FREE" : `GH₵ ${cartTotals.shipping.toFixed(2)}`}</span>
                  </div>
                  {cartTotals.subtotal > 0 && cartTotals.subtotal < 500 && (
                    <p className="text-xs text-gray-400 bg-white/5 rounded-lg p-2 border border-white/10">
                      Add GH₵ {(500 - cartTotals.subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-white/20 pt-2 flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-[var(--gold)]">GH₵ {cartTotals.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Clear cart
                  </button>
                  <Link
                    href="/ui/cart"
                    onClick={() => setShowCartPreview(false)}
                    className="btn-primary flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-center"
                  >
                    Go to cart
                  </Link>
                </div>
                <Link
                  href="/ui/checkout"
                  onClick={() => setShowCartPreview(false)}
                  className="btn-accent block w-full px-4 py-2 rounded-xl text-sm font-semibold text-center"
                >
                  Proceed to checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Icon Button - Floating */}
      {cartItems.length > 0 && !showCartPreview && (
        <button
          onClick={() => setShowCartPreview(true)}
          className="fixed bottom-6 right-6 z-40 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-full p-4 shadow-lg shadow-[rgba(10,155,69,0.3)] flex items-center gap-2 transition-all hover:scale-105"
        >
          <FaShoppingCart className="text-xl" />
          <span className="bg-[var(--gold)] text-black rounded-full px-2 py-0.5 text-xs font-bold">
            {cartTotals.totalItems}
          </span>
        </button>
      )}
    </div>
  );
}

// Helper function to get category icons
function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("electronic") || name.includes("phone") || name.includes("computer")) return "📱";
  if (name.includes("fashion") || name.includes("clothing") || name.includes("cloth")) return "👔";
  if (name.includes("food") || name.includes("grocery")) return "🍎";
  if (name.includes("home") || name.includes("furniture")) return "🏠";
  if (name.includes("beauty") || name.includes("cosmetic")) return "💄";
  if (name.includes("sport") || name.includes("fitness")) return "⚽";
  if (name.includes("book") || name.includes("education")) return "📚";
  if (name.includes("toy") || name.includes("kid")) return "🧸";
  if (name.includes("health") || name.includes("medical")) return "⚕️";
  if (name.includes("automotive") || name.includes("car")) return "🚗";
  return "🏷️";
}





