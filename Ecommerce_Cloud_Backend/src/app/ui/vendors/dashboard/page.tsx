"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  FaStore,
  FaBox,
  FaEnvelope,
  FaChartLine,
  FaStar,
  FaUsers,
} from "react-icons/fa";

type VendorStats = {
  totalProducts: number;
  activeProducts: number;
  totalConversations: number;
  unreadMessages: number;
  averageRating: number;
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalConversations: 0,
    unreadMessages: 0,
    averageRating: 0,
  });

  useEffect(() => {
    setMounted(true);

    // Check if user is logged in as vendor
    const stored = localStorage.getItem("gomart:user");
    if (!stored) {
      toast.error("Please login as a vendor");
      router.push("/ui/vendors/login");
      return;
    }

    const user = JSON.parse(stored);
    if (user.userType !== "vendor") {
      toast.error("Access denied. Vendors only.");
      router.push("/");
      return;
    }

    setVendor(user);
    loadStats(user.id);
  }, [router]);

  async function loadStats(vendorId: string) {
    try {
      // Load products
      const productsRes = await fetch(`/api/products?vendorId=${vendorId}`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const products = productsData.data?.products || [];
        stats.totalProducts = products.length;
        stats.activeProducts = products.filter((p: any) => p.isActive).length;
      }

      // Load conversations
      const convRes = await fetch(
        `/api/conversations?userId=${vendorId}&userType=vendor`
      );
      if (convRes.ok) {
        const convData = await convRes.json();
        const conversations = convData.data?.conversations || [];
        stats.totalConversations = conversations.length;
        stats.unreadMessages = conversations.reduce(
          (sum: number, conv: any) => sum + conv.vendorUnread,
          0
        );
      }

      // Use vendor rating
      stats.averageRating = vendor?.rating || 0;

      setStats({ ...stats });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <FaStore className="text-green-500" />
          {vendor?.vendorName || "Vendor Dashboard"}
        </h1>
        <p className="text-gray-400">
          Manage your products, view messages, and track your store performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FaBox className="text-3xl text-blue-500" />
            <span className="text-2xl font-bold text-white">
              {stats.totalProducts}
            </span>
          </div>
          <h3 className="text-gray-300 text-sm">Total Products</h3>
          <p className="text-xs text-gray-500 mt-1">
            {stats.activeProducts} active
          </p>
        </div>

        {/* Messages */}
        <Link
          href="/ui/conversations"
          className="glass-surface rounded-xl p-6 hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between mb-4">
            <FaEnvelope className="text-3xl text-green-500" />
            <div className="text-right">
              <span className="text-2xl font-bold text-white">
                {stats.totalConversations}
              </span>
              {stats.unreadMessages > 0 && (
                <div className="inline-block ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.unreadMessages} new
                </div>
              )}
            </div>
          </div>
          <h3 className="text-gray-300 text-sm">Conversations</h3>
          <p className="text-xs text-gray-500 mt-1">Click to view messages</p>
        </Link>

        {/* Rating */}
        <div className="glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FaStar className="text-3xl text-yellow-500" />
            <span className="text-2xl font-bold text-white">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </span>
          </div>
          <h3 className="text-gray-300 text-sm">Store Rating</h3>
          <p className="text-xs text-gray-500 mt-1">Average customer rating</p>
        </div>

        {/* Status */}
        <div className="glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FaChartLine className="text-3xl text-purple-500" />
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                vendor?.isVerified
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {vendor?.isVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <h3 className="text-gray-300 text-sm">Account Status</h3>
          <p className="text-xs text-gray-500 mt-1">
            {vendor?.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/ui/products/new"
            className="btn-primary text-center py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition"
          >
            <FaBox />
            Add New Product
          </Link>

          <Link
            href="/ui/conversations"
            className="btn-accent text-center py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition relative"
          >
            <FaEnvelope />
            View Messages
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                {stats.unreadMessages}
              </span>
            )}
          </Link>

          <Link
            href="/ui/products/list"
            className="btn-secondary text-center py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition"
          >
            <FaStore />
            Manage Products
          </Link>
        </div>
      </div>
    </div>
  );
}

