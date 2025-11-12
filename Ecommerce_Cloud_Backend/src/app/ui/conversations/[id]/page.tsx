"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaBox,
  FaPhone,
  FaWhatsapp,
  FaEllipsisV,
} from "react-icons/fa";

type Message = {
  id: string;
  content: string;
  senderType: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  subject: string;
  customerId: string;
  vendorId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vendor: {
    id: string;
    vendorName: string;
    storeLogo: string | null;
    whatsappNumber: string | null;
  };
  product: {
    id: string;
    productName: string;
    imageURL: string | null;
    price: number;
  } | null;
  messages: Message[];
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    params.then((p) => setConversationId(p.id));
  }, [params]);

  useEffect(() => {
    setMounted(true);

    // Load user from localStorage
    const stored = localStorage.getItem("gomart:user");
    if (!stored) {
      toast.error("Please login to view messages");
      router.push("/ui/customers/login");
      return;
    }

    const user = JSON.parse(stored);
    if (!user?.id) {
      toast.error("Invalid user session");
      router.push("/ui/customers/login");
      return;
    }

    setUserId(user.id);
    setUserType(user.userType || 'customer');
  }, [router]);

  useEffect(() => {
    if (conversationId && userId) {
      loadConversation();
      markAsRead();
    }
  }, [conversationId, userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadConversation() {
    if (!conversationId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");

      const data = await res.json();
      setConversation(data.data.conversation);
    } catch (error: any) {
      console.error("Failed to load conversation:", error);
      toast.error("Failed to load conversation");
      router.push("/ui/conversations");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead() {
    if (!conversationId) return;

    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType }),
      });

      // Trigger storage event to update unread count in Navigation
      window.dispatchEvent(
        new StorageEvent("storage", { key: "gomart:messages" })
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !userId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          senderId: userId,
          senderType: userType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send message");
      }

      // Reload conversation to get new message
      await loadConversation();

      // Trigger storage event to update conversation list
      window.dispatchEvent(
        new StorageEvent("storage", { key: "gomart:messages" })
      );
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error(error.message || "Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  }

  function formatTime(dateString: string): string {
    if (!mounted) return "";

    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateString: string): string {
    if (!mounted) return "";

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  // Group messages by date
  function groupMessagesByDate(messages: Message[]) {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });

    return groups;
  }

  if (!mounted || loading || !conversation) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(conversation.messages);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => router.push("/ui/conversations")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FaArrowLeft size={20} />
        </button>

        <Link
          href={`/ui/vendors/${conversation.vendor.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition"
        >
          {conversation.vendor.storeLogo ? (
            <Image
              src={conversation.vendor.storeLogo}
              alt={conversation.vendor.vendorName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              unoptimized={conversation.vendor.storeLogo.startsWith("data:")}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200">
              <span className="text-green-600 font-bold">
                {conversation.vendor.vendorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {conversation.vendor.vendorName}
            </h2>
            {conversation.product && (
              <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                <FaBox className="flex-shrink-0" />
                {conversation.product.productName}
              </p>
            )}
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {conversation.vendor.whatsappNumber && (
            <a
              href={`https://wa.me/${conversation.vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
              title="WhatsApp"
            >
              <FaWhatsapp size={20} />
            </a>
          )}
        </div>
      </div>

      {/* Product Info Banner */}
      {conversation.product && (
        <Link
          href={`/ui/products/${conversation.product.id}`}
          className="bg-white border-b border-gray-200 px-4 py-3 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            {conversation.product.imageURL && (
              <Image
                src={conversation.product.imageURL}
                alt={conversation.product.productName}
                width={48}
                height={48}
                className="w-12 h-12 rounded object-contain border border-gray-200"
                unoptimized={conversation.product.imageURL.startsWith("data:")}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {conversation.product.productName}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                GH₵ {conversation.product.price.toFixed(2)}
              </p>
            </div>
            <span className="text-xs text-gray-500">View Product →</span>
          </div>
        </Link>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Object.entries(messageGroups).map(([dateKey, messages]) => (
          <div key={dateKey}>
            {/* Date Divider */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                {formatDate(messages[0].createdAt)}
              </div>
            </div>

            {/* Messages for this date */}
            {messages.map((msg) => {
              const isMyMessage = msg.senderType === userType;

              return (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${isMyMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                      isMyMessage
                        ? "bg-green-500 text-white rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isMyMessage ? "text-green-100" : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3"
      >
        <textarea
          ref={messageInputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaPaperPlane size={18} />
          )}
        </button>
      </form>
    </div>
  );
}

