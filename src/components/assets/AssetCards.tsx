"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { AssetEntry, AssetType } from "@/lib/constants";
import { getAssetSummary } from "@/hooks/useAssets";

interface AssetCardsProps {
  assets: AssetEntry[];
  loading?: boolean;
  onCardClick?: (assetType: AssetType) => void;
}

export function AssetCards({ assets, loading, onCardClick }: AssetCardsProps) {
  const [mounted] = useState(true);

  const goldSummary = getAssetSummary(assets, "gold");
  const fundsSummary = getAssetSummary(assets, "funds");

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards: Array<{
    title: string;
    type: AssetType;
    amount: number;
    unit: string;
    cost?: number;
    icon: string;
    color: string;
    textColor: string;
  }> = [
    {
      title: "Vàng",
      type: "gold",
      amount: goldSummary.totalAmount,
      unit: "cây",
      cost: goldSummary.totalCost,
      icon: "🏆",
      color: "from-yellow-500 to-orange-600",
      textColor: "text-yellow-200",
    },
    {
      title: "Quỹ",
      type: "funds",
      amount: fundsSummary.totalAmount,
      unit: "₫",
      icon: "💰",
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {cards.map((card, idx) => (
        <motion.button
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => onCardClick?.(card.type)}
          className={`relative overflow-hidden p-6 rounded-2xl bg-linear-to-br ${card.color} shadow-xl shadow-black/20 text-left group cursor-pointer transition-transform hover:scale-105`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${card.textColor} opacity-80 mb-1`}
              >
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {card.unit === "cây"
                  ? `${card.amount.toFixed(2)} cây`
                  : formatVND(card.amount)}
              </h3>
              {card.cost && (
                <p className="text-xs text-white/70 mt-1">
                  Giá: {formatVND(card.cost)}
                </p>
              )}
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md flex items-center gap-2">
              <span className="text-3xl">{card.icon}</span>
              <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {/* Subtle pattern */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </motion.button>
      ))}
    </div>
  );
}
