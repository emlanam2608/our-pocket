"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { Transaction } from "@/lib/constants";

interface SummaryCardsProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function SummaryCards({ transactions, loading }: SummaryCardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totals = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount) || 0;
      if (t.type === "income") acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const balance = totals.income - totals.expense;

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Số dư",
      amount: balance,
      icon: Wallet,
      color: "from-indigo-500 to-blue-600",
      textColor: "text-blue-200",
    },
    {
      title: "Thu nhập",
      amount: totals.income,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-200",
    },
    {
      title: "Chi tiêu",
      amount: totals.expense,
      icon: TrendingDown,
      color: "from-rose-500 to-pink-600",
      textColor: "text-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ delay: idx * 0.1 }}
          className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${card.color} shadow-xl shadow-black/20`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${card.textColor} opacity-80 mb-1`}
              >
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {formatVND(card.amount)}
              </h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Subtle pattern */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </motion.div>
      ))}
    </div>
  );
}
