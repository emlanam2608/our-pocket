"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  AssetEntry,
  AssetType,
  ASSET_LABELS,
  ASSET_ICONS,
} from "@/lib/constants";
import { addAssetEntry, updateAssetEntry } from "@/hooks/useAssets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssetFormProps {
  editData?: AssetEntry | null;
  onClose: () => void;
  displayName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "asset" | "fund"; // "asset" for all types, "fund" for funds only
  fundOptions?: string[];
}

export function AssetForm({
  editData,
  onClose,
  displayName,
  open,
  onOpenChange,
  mode = "asset",
  fundOptions = [],
}: AssetFormProps) {
  const [internalOpen, setInternalOpen] = useState(!!editData);
  const [type, setType] = useState<AssetType>(editData?.type || (mode === "fund" ? "funds" : "gold"));
  const [amount, setAmount] = useState(editData?.amount?.toString() || "");
  const [fundName, setFundName] = useState(editData?.fundName || "");
  const [loading, setLoading] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;

  const setIsOpen = (newOpen: boolean) => {
    if (open !== undefined) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  useEffect(() => {
    if (editData) {
      // Only auto-open when uncontrolled. When `open` is controlled by parent,
      // the parent should decide when to open to avoid double-modals.
      if (open === undefined) {
        setInternalOpen(true);
      }
      setType(editData.type);
      setAmount(editData.amount?.toString() || "");
      setFundName(editData.fundName || "");
    }
  }, [editData, open, onOpenChange]);

  const handleClose = () => {
    setIsOpen(false);
    setType(mode === "fund" ? "funds" : "gold");
    setAmount("");
    setFundName("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFundName = fundName.trim();
    const normalizedFundName = trimmedFundName.toLocaleLowerCase();

    // In "fund" mode we only create/rename a fund shell; amount is intentionally not entered here.
    let amountNum = 0;
    if (mode !== "fund") {
      amountNum = parseFloat(amount);
      // Allow 0 (setting base amount to zero).
      if (amount === "" || isNaN(amountNum) || amountNum < 0) {
        alert("Vui lòng nhập số dư hợp lệ");
        return;
      }
    } else {
      if (!trimmedFundName) {
        alert("Vui lòng nhập tên quỹ");
        return;
      }

      if (!editData) {
        const existing = fundOptions.some(
          (n) => n.trim().toLocaleLowerCase() === normalizedFundName,
        );
        if (existing) {
          alert("Quỹ này đã tồn tại. Vui lòng chọn tên khác.");
          return;
        }
      }

      amountNum = editData?.amount ?? 0;
    }

    if (mode !== "fund" && type === "funds" && !trimmedFundName) {
      alert("Vui lòng chọn quỹ");
      return;
    }

    const label =
      mode === "fund"
        ? `quỹ \"${trimmedFundName}\"`
        : `${ASSET_LABELS[type]}${type === "funds" ? ` (${trimmedFundName})` : ""}`;

    const confirmMsg =
      mode === "fund"
        ? editData
          ? `Bạn muốn cập nhật ${label}?`
          : ""
        : `Bạn sẽ cập nhật số dư gốc cho ${label}: ${
            type === "gold" ? `${amountNum}g` : `${amountNum}`
          }.\nThao tác này sẽ thay đổi số dư hiện tại. Tiếp tục?`;

    if (confirmMsg && !confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const data = {
        type: mode === "fund" ? ("funds" as const) : type,
        amount: amountNum,
        // Base amount updates shouldn't edit notes; preserve existing description if any.
        ...(mode !== "fund" && editData?.description
          ? { description: editData.description }
          : {}),
        createdBy: displayName,
        ...(trimmedFundName ? { fundName: trimmedFundName } : {}),
      } as Omit<AssetEntry, "id" | "timestamp">;

      // Gold base updates shouldn't require value input; preserve existing value if any.
      if (mode !== "fund" && type === "gold" && editData?.cost !== undefined) {
        data.cost = editData.cost;
      }

      const selectedDate = new Date();

      if (editData) {
        await updateAssetEntry(editData.id, data, selectedDate);
      } else {
        await addAssetEntry(data, selectedDate);
      }

      handleClose();
    } catch (error) {
      console.error("Failed to save asset:", error);
      alert("Lỗi khi lưu tài sản");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
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
                <h2 className="text-2xl font-bold text-white">
                  {mode === "fund"
                    ? editData
                      ? "Cập nhật quỹ"
                      : "Tạo quỹ"
                    : "Cập nhật số dư gốc"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Fund Name (for fund mode) */}
                {mode === "fund" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Tên quỹ
                    </Label>
                    <Input
                      type="text"
                      value={fundName}
                      onChange={(e) => setFundName(e.target.value)}
                      placeholder="VD: Quỹ khẩn cấp"
                      className="bg-white/3 border-white/10"
                      maxLength={30}
                    />
                  </div>
                )}

                {/* Type Selector (only for asset mode) */}
                {mode !== "fund" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Loại tài sản
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                    {(["gold", "funds", "savings"] as AssetType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-3 rounded-xl transition-all text-center ${
                          type === t
                            ? "bg-purple-600/70 border border-purple-400"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="text-2xl mb-1">{ASSET_ICONS[t]}</div>
                        <p className="text-xs font-medium text-white">
                          {ASSET_LABELS[t].split(" ").slice(1).join(" ")}
                        </p>
                      </button>
                    ))}
                    </div>
                  </div>
                )}

                {/* Fund Selector (when adding/updating a fund asset) */}
                {mode !== "fund" && type === "funds" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Chọn quỹ
                    </Label>
                    {fundOptions.length === 0 ? (
                      <p className="text-sm text-zinc-500 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        Hãy tạo quỹ trước.
                      </p>
                    ) : (
                      <Select value={fundName} onValueChange={setFundName}>
                        <SelectTrigger className="bg-white/3 border-white/10 h-12 rounded-2xl text-white">
                          <SelectValue placeholder="Chọn quỹ..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fundOptions.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Amount */}
                {mode !== "fund" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Số dư gốc {type === "gold" ? "(grams)" : "(₫)"}
                    </Label>
                    <Input
                      type="number"
                      step={type === "gold" ? "0.01" : "1"}
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={type === "gold" ? "10.5" : "100000"}
                      className="bg-white/3 border-white/10"
                    />
                  </div>
                )}

                {/* No value input for gold base updates */}

                {/* No note fields for base amount updates */}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    className="flex-1 border-0 bg-white/5 hover:bg-white/10 h-14 transition-all font-medium rounded-2xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white border-0 shadow-xl shadow-purple-900/30 h-14 transition-all font-bold rounded-2xl"
                  >
                    {loading
                      ? "Đang lưu..."
                      : mode === "fund"
                        ? editData
                          ? "Cập nhật quỹ"
                          : "Tạo quỹ"
                        : "Cập nhật số dư gốc"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
