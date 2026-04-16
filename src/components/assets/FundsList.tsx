"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Trash2, Edit2 } from "lucide-react";
import { type AssetEntry } from "@/lib/constants";
import { formatVND } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAssetEntry } from "@/hooks/useAssets";

interface FundsListProps {
  houseId: string; // NEW: which house these funds belong to
  assets: AssetEntry[];
  loading: boolean;
  onEdit: (asset: AssetEntry) => void;
}

export function FundsList({
  houseId,
  assets,
  loading,
  onEdit,
}: FundsListProps) {
  const handleDelete = async (id: string) => {
    if (confirm("Bạn chắc chắn muốn xóa mục này?")) {
      try {
        await deleteAssetEntry(houseId, id);
      } catch (error) {
        console.error("Failed to delete fund:", error);
        alert("Lỗi khi xóa quỹ");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-20 rounded-xl skeleton-shimmer bg-white/5"
          />
        ))}
      </div>
    );
  }

  // Filter funds and group by fundName
  const fundAssets = assets.filter((a) => a.type === "funds");
  const fundsByName: Record<string, AssetEntry[]> = {};

  for (const fund of fundAssets) {
    const name = fund.fundName || "Chưa đặt tên";
    if (!fundsByName[name]) fundsByName[name] = [];
    fundsByName[name].push(fund);
  }

  const fundNames = Object.keys(fundsByName).sort();

  if (fundNames.length === 0) {
    return (
      <div className="glass rounded-2xl py-12 flex flex-col items-center gap-3">
        <span className="text-4xl">💰</span>
        <p className="text-zinc-500 text-sm">Chưa tạo quỹ nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {fundNames.map((fundName, idx) => {
          const entries = fundsByName[fundName];
          const totalAmount = entries.reduce(
            (sum, e) => sum + (e.amount || 0),
            0,
          );

          return (
            <motion.div
              key={fundName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{fundName}</h3>
                  <p className="text-xs text-zinc-500">
                    {entries.length} lần thêm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">
                    {formatVND(totalAmount)}
                  </p>
                </div>
              </div>

              {/* Recent entries in this fund */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {entries.slice(0, 3).map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex-1">
                      <p className="text-zinc-400">
                        {entry.description ||
                          format(entry.timestamp, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-green-400 font-semibold">
                        +{formatVND(entry.amount)}
                      </p>
                      <button
                        onClick={() => onEdit(entry)}
                        className="p-1 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {entries.length > 3 && (
                  <p className="text-xs text-zinc-600 text-center py-1">
                    ... và {entries.length - 3} lần khác
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
