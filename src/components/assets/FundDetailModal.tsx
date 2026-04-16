"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { format } from "date-fns";
import type { AssetEntry } from "@/lib/constants";
import { renameFund } from "@/hooks/useAssets";
import { formatVND } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FundDetailModalProps {
  assets: AssetEntry[];
  fundName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundDetailModal({
  assets,
  fundName,
  open,
  onOpenChange,
}: FundDetailModalProps) {
  const entries = useMemo(() => {
    if (!fundName) return [];
    return assets
      .filter(
        (a) => a.type === "funds" && (a.fundName || "").trim() === fundName,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [assets, fundName]);

  const totalAmount = useMemo(() => {
    return entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [entries]);

  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNameInput(fundName || "");
  }, [fundName, open]);

  const handleClose = () => onOpenChange(false);

  const handleRename = async () => {
    const from = (fundName || "").trim();
    const to = nameInput.trim();
    if (!from || !to || from === to) {
      handleClose();
      return;
    }

    if (!confirm(`Đổi tên quỹ "${from}" thành "${to}"?`)) return;

    setLoading(true);
    try {
      await renameFund(from, to);
      handleClose();
    } catch (err) {
      console.error("Failed to rename fund:", err);
      alert("Lỗi khi cập nhật quỹ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && fundName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Cập nhật quỹ</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Tổng:{" "}
                  <span className="text-green-400 font-semibold">
                    {formatVND(totalAmount)}
                  </span>{" "}
                  · {entries.length} lần
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                  Tên quỹ
                </Label>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-white/3 border-white/10"
                  maxLength={30}
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
                  Lịch sử
                </p>
                {entries.length === 0 ? (
                  <p className="text-sm text-zinc-500">Chưa có dữ liệu.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {entries.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">
                            {format(e.timestamp, "dd/MM/yyyy HH:mm")}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {e.createdBy}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-green-400">
                          +{formatVND(e.amount || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1 border-0 bg-white/5 hover:bg-white/10 h-14 transition-all font-medium rounded-2xl"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  onClick={handleRename}
                  disabled={loading || !nameInput.trim()}
                  className="flex-1 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white border-0 shadow-xl shadow-purple-900/30 h-14 transition-all font-bold rounded-2xl"
                >
                  {loading ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
