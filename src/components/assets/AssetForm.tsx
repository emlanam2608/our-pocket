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
  mode?: "fund" | "record"; // "fund" for fund creation/rename, "record" for quick add
  fundOptions?: string[];
  recordType?: "gold" | "funds"; // for "record" mode
}

export function AssetForm({
  editData,
  onClose,
  displayName,
  open,
  onOpenChange,
  mode = "fund",
  fundOptions = [],
  recordType,
}: AssetFormProps) {
  const [internalOpen, setInternalOpen] = useState(!!editData);
  const [amount, setAmount] = useState(editData?.amount?.toString() || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [fundName, setFundName] = useState(editData?.fundName || "");
  const [loading, setLoading] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const finalMode = mode || "fund";

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
      setAmount(editData.amount?.toString() || "");
      setDescription(editData.description || "");
      setFundName(editData.fundName || "");
    }
  }, [editData, open, onOpenChange]);

  const handleClose = () => {
    setIsOpen(false);
    setAmount("");
    setDescription("");
    setFundName("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFundName = fundName.trim();
    const normalizedFundName = trimmedFundName.toLocaleLowerCase();

    // Handle "record" mode - quick add for gold or funds (allows negative numbers)
    if (finalMode === "record") {
      const amountNum = parseFloat(amount);
      if (amount === "" || isNaN(amountNum) || amountNum === 0) {
        alert("Vui lòng nhập số lượng hợp lệ");
        return;
      }

      if (!recordType) {
        alert("Lỗi: loại tài sản không được chỉ định");
        return;
      }

      if (recordType === "funds" && !trimmedFundName) {
        alert("Vui lòng chọn quỹ");
        return;
      }

      setLoading(true);
      try {
        const trimmedDescription = description.trim();
        const data = {
          type: recordType,
          amount: amountNum,
          createdBy: displayName,
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
          ...(trimmedFundName ? { fundName: trimmedFundName } : {}),
        } as Omit<AssetEntry, "id" | "timestamp">;

        await addAssetEntry(data, new Date());
        handleClose();
      } catch (error) {
        console.error("Failed to save asset:", error);
        alert("Lỗi khi lưu tài sản");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fund mode - create/rename fund
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

    const label = `quỹ \"${trimmedFundName}\"`;
    const confirmMsg = editData ? `Bạn muốn cập nhật ${label}?` : "";

    if (confirmMsg && !confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const data = {
        type: "funds" as const,
        amount: editData?.amount ?? 0,
        createdBy: displayName,
        fundName: trimmedFundName,
      } as Omit<AssetEntry, "id" | "timestamp">;

      const selectedDate = new Date();

      if (editData) {
        await updateAssetEntry(editData.id, data, selectedDate);
      } else {
        await addAssetEntry(data, selectedDate);
      }

      handleClose();
    } catch (error) {
      console.error("Failed to save fund:", error);
      alert("Lỗi khi lưu quỹ");
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
                  {finalMode === "record"
                    ? `Thêm ${recordType === "gold" ? "vàng" : "quỹ"}`
                    : editData
                      ? "Cập nhật quỹ"
                      : "Tạo quỹ"}
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
                {finalMode === "fund" && (
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

                {/* Fund Selector (when adding to a fund in record mode) */}
                {finalMode === "record" && recordType === "funds" && (
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

                {/* Amount (for record mode) */}
                {finalMode === "record" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      {recordType === "gold" ? "Số lượng (cây)" : "Số tiền (₫)"}
                    </Label>
                    <Input
                      type="number"
                      step={recordType === "gold" ? "any" : "1"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={
                        recordType === "gold"
                          ? "10.5 cây hoặc -5 cây"
                          : "100000 hoặc -50000"
                      }
                      className="bg-white/3 border-white/10"
                    />
                  </div>
                )}

                {/* Description/Note (for record mode) */}
                {finalMode === "record" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Ghi chú (tùy chọn)
                    </Label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="VD: Mua từ cửa hàng X"
                      className="bg-white/3 border-white/10"
                      maxLength={100}
                    />
                  </div>
                )}

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
                      : finalMode === "record"
                        ? `Thêm ${recordType === "gold" ? "vàng" : "quỹ"}`
                        : editData
                          ? "Cập nhật quỹ"
                          : "Tạo quỹ"}
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
