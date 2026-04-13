"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import type { Transaction } from "@/lib/constants";
import { formatVND } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
}

export function TransactionList({ transactions, loading }: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl skeleton-shimmer bg-white/5" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass rounded-2xl py-12 flex flex-col items-center gap-3">
        <span className="text-4xl">🏦</span>
        <p className="text-zinc-500 text-sm">Chưa có giao dịch nào</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = format(t.timestamp, "dd/MM/yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {Object.entries(grouped).map(([date, items]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2 px-1">
              {date}
            </p>
            <div className="space-y-2">
              {items.map((t, i) => {
                const cat = CATEGORIES.find((c) => c.id === t.categoryId);
                const color = CATEGORY_COLORS[t.categoryId] ?? "#6b7280";
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-3 flex items-center gap-3"
                  >
                    {/* Category icon blob */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${color}22`, border: `1px solid ${color}44` }}
                    >
                      {cat?.icon ?? "💸"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {t.description || cat?.label}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {t.createdBy} · {format(t.timestamp, "HH:mm", { locale: vi })}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-bold shrink-0 ${
                        t.type === "income" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatVND(t.amount)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
