"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  List,
  Bell,
  ShieldAlert,
  X,
  User,
  Check,
  Boxes,
} from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { AssetCards } from "@/components/assets/AssetCards";
import { AssetsList } from "@/components/assets/AssetsList";
import { FundsList } from "@/components/assets/FundsList";
import { AssetForm } from "@/components/assets/AssetForm";
import { TransactionList } from "@/components/transaction/TransactionList";
import { TransactionForm } from "@/components/transaction/TransactionForm";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { useAssets } from "@/hooks/useAssets";
import { useFCM } from "@/hooks/useFCM";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import type { Transaction, AssetEntry } from "@/lib/constants";

export default function HomePage() {
  const { permission, requestPermission } = useFCM();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<
    "summary" | "transactions" | "assets"
  >("summary");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetEntry | null>(null);
  const mounted = typeof window !== "undefined";
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nhaminh-displayname") || "";
    }
    return "";
  });
  const [nameInput, setNameInput] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | undefined>(
    undefined,
  );

  const handleInitialNameSubmit = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      setDisplayName(trimmedName);
      localStorage.setItem("nhaminh-displayname", trimmedName);
      setNameInput("");
    }
  };

  const handleNameUpdate = async (newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setDisplayName(trimmedName);
    localStorage.setItem("nhaminh-displayname", trimmedName);

    // Sync FCM token if exists
    const token = sessionStorage.getItem("fcm-token");
    if (token) {
      try {
        const ua = navigator.userAgent;
        let deviceType = "Desktop";
        if (/iPhone|iPad|iPod/.test(ua)) deviceType = "iOS Device";
        else if (/Android/.test(ua)) deviceType = "Android Device";
        else if (/Macintosh/.test(ua)) deviceType = "Mac";
        else if (/Windows/.test(ua)) deviceType = "Windows PC";

        await fetch("/api/fcm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            deviceType,
            userAgent: ua,
            language: navigator.language,
            displayName: trimmedName,
          }),
        });
      } catch (err) {
        console.error("Failed to sync FCM token after name update:", err);
      }
    }
  };

  const dateRange = useMemo(() => {
    return {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    };
  }, [currentMonth]);

  const {
    transactions: allTransactions,
    loading,
    error,
  } = useTransactions(dateRange.start, dateRange.end);

  const { assets, loading: assetsLoading } = useAssets();

  // Get unique persons and filter transactions
  const uniquePersons = useMemo(() => {
    const persons = Array.from(
      new Set(allTransactions.map((t) => t.createdBy)),
    ).sort();
    return persons;
  }, [allTransactions]);

  const transactions = useMemo(() => {
    if (!selectedPerson) return allTransactions;
    return allTransactions.filter((t) => t.createdBy === selectedPerson);
  }, [allTransactions, selectedPerson]);

  // Show initial name setup modal if no name is set
  if (!displayName) {
    return (
      <div className="min-h-screen max-w-lg mx-auto flex flex-col items-center justify-center safe-top pb-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="bg-linear-to-br from-violet-600/10 to-purple-600/10 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/30">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Xin chào!
            </h1>
            <p className="text-zinc-400 text-center text-sm mb-8">
              Vui lòng nhập tên của bạn để tiếp tục
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                  Tên hiển thị
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInitialNameSubmit(nameInput);
                      }
                    }}
                    autoFocus
                    className="pl-11 bg-white/3 border-white/5 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-14 text-base rounded-2xl placeholder:text-zinc-600"
                    placeholder="Nhập tên của bạn..."
                  />
                </div>
              </div>

              <Button
                onClick={() => handleInitialNameSubmit(nameInput)}
                disabled={!nameInput.trim()}
                className="w-full bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white border-0 shadow-xl shadow-purple-900/30 h-14 transition-all font-bold gap-2 rounded-2xl"
              >
                <Check className="w-4 h-4" />
                Tiếp tục
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col safe-top pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 glass safe-top px-4 pt-4 pb-3"
      >
        {/* Global Loading Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-500 via-purple-500 to-violet-500 origin-left z-50 overflow-hidden"
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-full h-full bg-white/30"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          {mounted ? (
            <ProfileSettings
              currentName={displayName}
              onUpdate={handleNameUpdate}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 animate-pulse" />
              <div className="space-y-1">
                <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          )}

          <AnimatePresence>
            {mounted && permission === "default" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={requestPermission}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full text-purple-300 text-xs font-semibold transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                Bật thông báo
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <MonthPicker month={currentMonth} onChange={setCurrentMonth} />

        {/* Person Filter */}
        {uniquePersons.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <motion.button
              onClick={() => setSelectedPerson(undefined)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedPerson === undefined
                  ? "bg-purple-600/70 text-white shadow"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Tất cả
            </motion.button>
            {uniquePersons.map((person) => (
              <motion.button
                key={person}
                onClick={() => setSelectedPerson(person)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedPerson === person
                    ? "bg-purple-600/70 text-white shadow"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {person}
                {selectedPerson === person && <X className="w-3 h-3" />}
              </motion.button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-3 p-1 bg-white/5 rounded-xl">
          {[
            { id: "summary", label: "Tổng quan", icon: BarChart2 },
            { id: "transactions", label: "Giao dịch", icon: List },
            { id: "assets", label: "Tài sản", icon: Boxes },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "summary" | "transactions" | "assets")
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-purple-600/70 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-300 text-sm overflow-hidden"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Lỗi kết nối dữ liệu</p>
                <p className="text-xs opacity-70 leading-tight">
                  {error.message.includes("permission-denied")
                    ? "Bạn chưa có quyền truy cập. Hãy bật 'Anonymous Auth' trong Firebase."
                    : error.message.includes("index")
                      ? "Cần tạo chỉ mục Firestore. Hãy mở trang web trên máy tính để xem link tạo."
                      : error.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === "summary" ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <SummaryCards transactions={transactions} loading={loading} />
            <ExpenseChart transactions={transactions} loading={loading} />
          </motion.div>
        ) : activeTab === "transactions" ? (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <TransactionList
              transactions={transactions}
              loading={loading}
              onEdit={setEditingTransaction}
            />
          </motion.div>
        ) : (
          <motion.div
            key="assets"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <FundsList
              assets={assets}
              loading={assetsLoading}
              onEdit={setEditingAsset}
            />
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
                Toàn bộ tài sản
              </p>
              <AssetsList
                assets={assets}
                loading={assetsLoading}
                onEdit={setEditingAsset}
              />
            </div>
          </motion.div>
        )}
      </main>

      <TransactionForm
        editData={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {activeTab === "assets" && (
        <AssetForm
          editData={editingAsset}
          onClose={() => setEditingAsset(null)}
          displayName={displayName}
        />
      )}
    </div>
  );
}
