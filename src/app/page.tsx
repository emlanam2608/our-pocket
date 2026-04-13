"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, BarChart2, List } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { TransactionList } from "@/components/transaction/TransactionList";
import { TransactionForm } from "@/components/transaction/TransactionForm";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { useTransactions } from "@/hooks/useTransactions";
import { useFCM } from "@/hooks/useFCM";

export default function HomePage() {
  useFCM(); // Init push notifications

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"summary" | "transactions">("summary");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const { transactions, loading } = useTransactions(monthStart, monthEnd);

  const displayName =
    typeof window !== "undefined"
      ? localStorage.getItem("nhaminh-displayname") ?? "Nhà"
      : "Nhà";

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col safe-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 glass safe-top px-4 pt-4 pb-3"
      >
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
      <main className="flex-1 px-4 py-4 pb-28 space-y-4">
        {activeTab === "summary" ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
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
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TransactionList transactions={transactions} loading={loading} />
          </motion.div>
        )}
      </main>

      {/* Floating Action Button via TransactionForm */}
      <TransactionForm />
    </div>
  );
}
