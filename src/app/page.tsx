"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BarChart2, List, Bell, ShieldAlert } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { TransactionList } from "@/components/transaction/TransactionList";
import { TransactionForm } from "@/components/transaction/TransactionForm";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { useTransactions } from "@/hooks/useTransactions";
import { useFCM } from "@/hooks/useFCM";
import type { Transaction } from "@/lib/constants";

export default function HomePage() {
  const { permission, requestPermission } = useFCM();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"summary" | "transactions">("summary");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateRange = useMemo(() => {
    return {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    };
  }, [currentMonth]);

  const { transactions, loading, error } = useTransactions(dateRange.start, dateRange.end);

  const displayName = mounted
    ? localStorage.getItem("nhaminh-displayname") ?? "Nhà"
    : "Nhà";

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
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 origin-left z-50 overflow-hidden"
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">Nhà Mình</p>
              <p className="text-zinc-500 text-xs">Xin chào, {displayName} 👋</p>
            </div>
          </div>

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

        {/* Tabs */}
        <div className="flex gap-1 mt-3 p-1 bg-white/5 rounded-xl">
          {[
            { id: "summary", label: "Tổng quan", icon: BarChart2 },
            { id: "transactions", label: "Giao dịch", icon: List },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "summary" | "transactions")}
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
        ) : (
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
        )}
      </main>

      <TransactionForm 
        editData={editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
      />
    </div>
  );
}
