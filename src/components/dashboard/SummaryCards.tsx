"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatVND } from "@/lib/utils";
import type { Transaction } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  transactions: Transaction[];
  loading: boolean;
}

export function SummaryCards({ transactions, loading }: SummaryCardsProps) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const cards = [
    {
      label: "Số dư",
      value: balance,
      icon: Wallet,
      gradient: "from-violet-600 to-purple-600",
      shadowColor: "shadow-purple-900/40",
      positive: balance >= 0,
    },
    {
      label: "Thu nhập",
      value: totalIncome,
      icon: TrendingUp,
      gradient: "from-emerald-600 to-teal-600",
      shadowColor: "shadow-emerald-900/40",
      positive: true,
    },
    {
      label: "Chi tiêu",
      value: totalExpense,
      icon: TrendingDown,
      gradient: "from-rose-600 to-pink-600",
      shadowColor: "shadow-rose-900/40",
      positive: false,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {cards.map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl skeleton-shimmer bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r ${card.gradient} shadow-xl ${card.shadowColor}`}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <p className="text-white text-2xl font-bold tracking-tight">
                {formatVND(Math.abs(card.value))}
              </p>
              {card.label === "Số dư" && balance < 0 && (
                <p className="text-white/60 text-xs mt-0.5">âm {formatVND(Math.abs(balance))}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
