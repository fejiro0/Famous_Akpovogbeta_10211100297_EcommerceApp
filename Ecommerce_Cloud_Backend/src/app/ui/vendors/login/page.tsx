"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { FaStore, FaEnvelope, FaLock } from "react-icons/fa";

export default function VendorLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/vendor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");

      if (data.data?.vendor) {
        // Store vendor data with userType flag
        localStorage.setItem("gomart:user", JSON.stringify({
          ...data.data.vendor,
          userType: 'vendor'
        }));
      }

      toast.success("Welcome back!");
      router.push("/ui/vendors/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 space-y-4 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <FaStore className="text-green-600 text-2xl" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          Vendor Login
        </h1>
        <p className="text-sm text-gray-300">
          Access your store, manage products and reply to customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-surface rounded-3xl p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-sm mb-2 text-gray-300 flex items-center gap-2">
            <FaEnvelope className="text-gray-400" />
            Email or Phone Number
          </label>
          <input
            type="text"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            placeholder="your-store@example.com"
            required
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-gray-300 flex items-center gap-2">
            <FaLock className="text-gray-400" />
            Password (Optional for now)
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            className="input w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            * Currently using email-only authentication
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn-primary w-full py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <FaStore />
              Sign In to Dashboard
            </>
          )}
        </button>

        <div className="text-center text-sm text-gray-300 pt-4 border-t border-gray-700">
          <p className="mb-2">Not a vendor yet?</p>
          <Link 
            href="/ui/vendors/new" 
            className="font-semibold text-white hover:text-[var(--gold)] transition"
          >
            Register Your Store →
          </Link>
        </div>

        <div className="text-center">
          <Link 
            href="/ui/customers/login" 
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Customer Login
          </Link>
        </div>
      </form>
    </div>
  );
}

