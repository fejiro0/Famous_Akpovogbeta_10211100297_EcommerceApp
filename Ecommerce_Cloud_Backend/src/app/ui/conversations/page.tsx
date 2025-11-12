"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { FaEnvelope, FaSearch, FaBox, FaCircle } from "react-icons/fa";

type ConversationItem = {
  id: string;
  subject: string;
  lastMessageAt: string;
  customerUnread: number;
  vendorUnread: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vendor: {
    id: string;
    vendorName: string;
    storeLogo: string | null;
  };
  product: {
    id: string;
    productName: string;
    imageURL: string | null;
    price: number;
  } | null;
  messages: {
    content: string;
    createdAt: string;
    senderType: string;
  }[];
};

export default function ConversationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');

  useEffect(() => {
    setMounted(true);
    
    // Load user from localStorage
    const stored = localStorage.getItem("gomart:user");
    if (!stored) {
      toast.error("Please login to view conversations");
      router.push("/ui/customers/login");
      return;
    }

    const user = JSON.parse(stored);
    if (!user?.id) {
      toast.error("Invalid user session");
      router.push("/ui/customers/login");
      return;
    }

    const type = user.userType || 'customer';
    setUserId(user.id);
    setUserType(type);
    loadConversations(user.id, type);
  }, [router]);

  async function loadConversations(uid: string, type: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?userId=${uid}&userType=${type}`);
      if (!res.ok) throw new Error("Failed to load conversations");

      const data = await res.json();
      setConversations(data.data?.conversations || []);
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  function getLastMessagePreview(conv: ConversationItem): string {
    if (conv.messages.length === 0) return "No messages yet";
    const lastMsg = conv.messages[0];
    const isMyMessage = lastMsg.senderType === userType;
    const prefix = isMyMessage ? "You: " : "";
    return prefix + (lastMsg.content.length > 50 ? lastMsg.content.substring(0, 50) + "..." : lastMsg.content);
  }

  function getOtherPartyName(conv: ConversationItem): string {
    return userType === 'vendor' 
      ? `${conv.customer.firstName} ${conv.customer.lastName}`
      : conv.vendor.vendorName;
  }

  function getOtherPartyLogo(conv: ConversationItem): string | null {
    return userType === 'vendor' ? null : conv.vendor.storeLogo;
  }

  function getUnreadCount(conv: ConversationItem): number {
    return userType === 'vendor' ? conv.vendorUnread : conv.customerUnread;
  }

  function getTimeAgo(dateString: string): string {
    if (!mounted) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    const otherParty = getOtherPartyName(conv).toLowerCase();
    const subject = conv.subject.toLowerCase();
    const product = (conv.product?.productName || "").toLowerCase();
    return otherParty.includes(query) || subject.includes(query) || product.includes(query);
  });

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaEnvelope className="text-green-600" />
            Messages
          </h1>
          <span className="text-sm text-gray-600">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <FaEnvelope className="mx-auto text-gray-300 text-6xl mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try searching with different keywords"
                : "Start a conversation by messaging a vendor from a product page"}
            </p>
            {!searchQuery && (
              <Link
                href="/ui/products/list"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/ui/conversations/${conv.id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Other Party Logo/Avatar */}
                  <div className="relative flex-shrink-0">
                    {getOtherPartyLogo(conv) ? (
                      <Image
                        src={getOtherPartyLogo(conv)!}
                        alt={getOtherPartyName(conv)}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                        unoptimized={getOtherPartyLogo(conv)!.startsWith("data:")}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-green-600 font-bold text-lg">
                          {getOtherPartyName(conv).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {getUnreadCount(conv) > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold">
                        {getUnreadCount(conv) > 9 ? "9+" : getUnreadCount(conv)}
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getOtherPartyName(conv)}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {getTimeAgo(conv.lastMessageAt)}
                      </span>
                    </div>

                    {/* Product Info */}
                    {conv.product && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <FaBox className="flex-shrink-0" />
                        <span className="truncate">{conv.product.productName}</span>
                      </div>
                    )}

                    {/* Last Message */}
                    <p
                      className={`text-sm truncate ${
                        getUnreadCount(conv) > 0
                          ? "font-semibold text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {getLastMessagePreview(conv)}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {getUnreadCount(conv) > 0 && (
                    <FaCircle className="text-green-500 text-xs flex-shrink-0" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

