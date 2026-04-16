"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Trash2, Edit2 } from "lucide-react";
import { ASSET_LABELS, ASSET_ICONS, AssetEntry } from "@/lib/constants";
import { formatVND } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAssetEntry } from "@/hooks/useAssets";

interface AssetsListProps {
  houseId: string; // NEW: which house these assets belong to
  assets: AssetEntry[];
  loading: boolean;
  onEdit: (asset: AssetEntry) => void;
}

export function AssetsList({
  houseId,
  assets,
  loading,
  onEdit,
}: AssetsListProps) {
  const handleDelete = async (id: string) => {
    if (confirm("Bạn chắc chắn muốn xóa mục này?")) {
      try {
        await deleteAssetEntry(houseId, id);
      } catch (error) {
        console.error("Failed to delete asset:", error);
        alert("Lỗi khi xóa mục");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 rounded-xl skeleton-shimmer bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="glass rounded-2xl py-12 flex flex-col items-center gap-3">
        <span className="text-4xl">📦</span>
        <p className="text-zinc-500 text-sm">Chưa có tài sản nào</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, AssetEntry[]> = {};
  for (const a of assets) {
    const key = format(a.timestamp, "dd/MM/yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
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
              {items.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl p-3 flex items-center gap-3 cursor-pointer group"
                >
                  {/* Asset icon blob */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-opacity-20"
                    style={{
                      backgroundColor: `${a.type === "gold" ? "#fbbf24" : a.type === "funds" ? "#10b981" : "#3b82f6"}22`,
                      border: `1px solid ${a.type === "gold" ? "#fbbf24" : a.type === "funds" ? "#10b981" : "#3b82f6"}44`,
                    }}
                  >
                    {ASSET_ICONS[a.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {ASSET_LABELS[a.type]}
                    </p>
                    {a.description && (
                      <p className="text-zinc-500 text-xs truncate">
                        {a.description}
                      </p>
                    )}
                    <p className="text-zinc-600 text-xs">
                      {format(a.timestamp, "HH:mm", { locale: vi })} ·{" "}
                      {a.createdBy}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-white">
                      {a.type === "gold"
                        ? `+${a.amount.toFixed(2)}g`
                        : `+${formatVND(a.amount)}`}
                    </span>
                    {a.cost && (
                      <span className="text-xs text-zinc-400">
                        Giá: {formatVND(a.cost)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(a)}
                      className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
