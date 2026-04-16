"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { formatVND } from "@/lib/utils";
import {
  AssetEntry,
  ASSET_COLORS,
  ASSET_ICONS,
  ASSET_LABELS,
} from "@/lib/constants";
import { getAssetSummary } from "@/hooks/useAssets";

interface AssetCardsProps {
  assets: AssetEntry[];
  loading?: boolean;
}

interface CardData {
  title: string;
  amount: number;
  unit: string;
  icon: string;
  color: string;
  textColor: string;
  cost?: number;
  subItems?: Array<{ label: string; amount: number }>;
}

export function AssetCards({ assets, loading }: AssetCardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goldSummary = getAssetSummary(assets, "gold");
  const fundsSummary = getAssetSummary(assets, "funds");
  const savingsSummary = getAssetSummary(assets, "savings");

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Vàng",
      amount: goldSummary.totalAmount,
      unit: "g",
      cost: goldSummary.totalCost,
      icon: "🏆",
      color: "from-yellow-500 to-orange-600",
      textColor: "text-yellow-200",
    },
    {
      title: "Quỹ & Tiết kiệm",
      amount: fundsSummary.totalAmount + savingsSummary.totalAmount,
      unit: "₫",
      icon: "💰",
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-200",
      subItems: [
        { label: "Quỹ", amount: fundsSummary.totalAmount },
        { label: "Tiết kiệm", amount: savingsSummary.totalAmount },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ delay: idx * 0.1 }}
          className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${card.color} shadow-xl shadow-black/20`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${card.textColor} opacity-80 mb-1`}
              >
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {card.unit === "g"
                  ? `${card.amount.toFixed(2)}g`
                  : formatVND(card.amount)}
              </h3>
              {card.cost && (
                <p className="text-xs text-white/70 mt-1">
                  Giá: {formatVND(card.cost)}
                </p>
              )}
              {card.subItems && (
                <div className="text-xs text-white/60 mt-2 space-y-0.5">
                  {card.subItems.map((sub) => (
                    <p key={sub.label}>
                      {sub.label}: {formatVND(sub.amount)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
          {/* Subtle pattern */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </motion.div>
      ))}
    </div>
  );
}
