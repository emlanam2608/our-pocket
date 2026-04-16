"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Transaction } from "@/lib/constants";
import { formatInputNumber, parseInputNumber } from "@/lib/utils";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/hooks/useTransactions";
import {
  addAssetEntry,
  useAssets,
  getUniqueFundNames,
} from "@/hooks/useAssets";

interface TransactionFormProps {
  houseId: string; // NEW: which house this form is for
  editData?: Transaction | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TransactionForm({
  houseId,
  editData,
  onClose,
  onSuccess,
}: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [assetAmountDisplay, setAssetAmountDisplay] = useState("");
  const [assetCostDisplay, setAssetCostDisplay] = useState("");
  const [fundName, setFundName] = useState("");
  const [newFundName, setNewFundName] = useState("");
  const [timestamp, setTimestamp] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  // Get assets for fund selection
  const { assets } = useAssets(houseId);
  const fundNames = getUniqueFundNames(assets);

  // Get selected category
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);
  const isAssetLinked =
    selectedCategory &&
    "assetType" in selectedCategory &&
    selectedCategory.assetType;
  const assetType = isAssetLinked ? selectedCategory.assetType : null;
  const isFundsCategory = categoryId === "add_funds";

  // Sync with editData
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setCategoryId(editData.categoryId);
      setDescription(editData.description || "");
      setAmountDisplay(formatInputNumber(String(editData.amount)));
      setAssetAmountDisplay(
        editData.assetAmount
          ? formatInputNumber(String(editData.assetAmount))
          : "",
      );
      setAssetCostDisplay(
        editData.assetCost ? formatInputNumber(String(editData.assetCost)) : "",
      );
      setTimestamp(format(editData.timestamp, "yyyy-MM-dd'T'HH:mm"));
      setOpen(true);
    }
  }, [editData]);

  const filteredCats = CATEGORIES.filter((c) => c.type === type);
  const amount = parseInputNumber(amountDisplay);

  const reset = () => {
    setType("expense");
    setCategoryId("");
    setDescription("");
    setAmountDisplay("");
    setAssetAmountDisplay("");
    setAssetCostDisplay("");
    setFundName("");
    setNewFundName("");
    setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setError("");
    onClose?.();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const amountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatInputNumber(val);

    // Manage cursor position to avoid jumping to the end
    const cursor = e.target.selectionStart;
    const oldLen = val.length;

    setAmountDisplay(formatted);

    // After state update, input will re-render and cursor might jump.
    // However, on a controlled component with Next.js/React, we sometimes need a timeout
    // or to trust React's reconciliation if the value doesn't change too much.
    // The previous jump was likely caused by "000" -> "0" transformation.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return setError("Chọn danh mục nào!");
    if (amount <= 0) return setError("Nhập số tiền đi bạn!");

    // Validate asset fields if asset-linked
    if (isAssetLinked) {
      if (assetType === "gold") {
        const assetAmount = parseInputNumber(assetAmountDisplay);
        if (assetAmount <= 0) {
          return setError("Nhập số lượng vàng đi!");
        }
      }
      // For funds, validate fund name
      if (assetType === "funds") {
        const selectedFund = newFundName || fundName;
        if (!selectedFund) {
          return setError("Chọn hoặc tạo tên quỹ đi!");
        }
      }
    }

    setLoading(true);
    setError("");
    try {
      const displayName =
        localStorage.getItem("nhaminh-displayname") ?? "Ai đó";
      const selectedDate = new Date(timestamp);

      if (editData) {
        // UPDATE
        await updateTransaction(
          houseId,
          editData.id,
          {
            type,
            categoryId,
            description: description.trim(),
            amount,
            ...(isAssetLinked && assetType === "gold"
              ? { assetAmount: parseInputNumber(assetAmountDisplay) }
              : {}),
          },
          selectedDate,
        );
      } else {
        // CREATE
        const senderToken = sessionStorage.getItem("fcm-token") ?? undefined;

        await addTransaction(
          houseId,
          {
            type,
            categoryId,
            description: description.trim(),
            amount,
            createdBy: displayName,
            ...(senderToken ? { senderToken } : {}),
            ...(isAssetLinked && assetType === "gold"
              ? { assetAmount: parseInputNumber(assetAmountDisplay) }
              : {}),
          },
          selectedDate,
        );

        // Also create asset entry if asset-linked
        if (isAssetLinked && assetType) {
          const assetData: any = {
            type: assetType,
            createdBy: displayName,
          };
          if (assetType === "gold") {
            assetData.amount = parseInputNumber(assetAmountDisplay);
          } else if (assetType === "funds") {
            assetData.fundName = newFundName || fundName;
            assetData.amount = amount;
            assetData.description =
              description.trim() || `Thêm ${assetData.fundName}`;
          } else {
            assetData.amount = amount;
            assetData.description = description.trim() || `Thêm ${assetType}`;
          }
          await addAssetEntry(houseId, assetData, selectedDate);
        }
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error("Transaction Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi xử lý giao dịch, thử lại nhé!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editData) return;
    if (!confirm("Xóa giao dịch này nhé?")) return;

    setDeleteLoading(true);
    try {
      await deleteTransaction(houseId, editData.id);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error("Delete Error:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi xóa giao dịch!");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-900/60"
      >
        <Plus className="w-7 h-7 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            >
              <div className="bg-zinc-900 border border-white/10 rounded-t-3xl p-6 safe-bottom">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">
                    {editData ? "Sửa giao dịch" : "Thêm giao dịch"}
                  </h2>
                  <div className="flex items-center gap-2">
                    {editData && (
                      <button
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        {deleteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setCategoryId("");
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          type === t
                            ? t === "expense"
                              ? "bg-rose-500/80 text-white shadow"
                              : "bg-emerald-500/80 text-white shadow"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {t === "expense" ? "💸 Chi tiêu" : "💰 Thu nhập"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                      Danh mục
                    </Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue placeholder="Chọn danh mục..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-white/10">
                        {filteredCats.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="text-white hover:bg-white/10"
                          >
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                      Số tiền (VND)
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={amountDisplay}
                        onChange={amountChange}
                        placeholder="0"
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-12 text-xl font-bold pr-16 text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                        ₫
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                      Mô tả (tùy chọn)
                    </Label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="VD: Cơm trưa, xăng xe..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-11"
                      maxLength={80}
                    />
                  </div>

                  {/* Asset-linked fields */}
                  {isAssetLinked && assetType === "gold" && (
                    <>
                      <div className="space-y-1.5 pt-2 border-t border-white/10">
                        <Label className="text-yellow-400 text-xs uppercase tracking-wider">
                          Số lượng vàng (grams)
                        </Label>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={assetAmountDisplay}
                            onChange={(e) =>
                              setAssetAmountDisplay(e.target.value)
                            }
                            placeholder="0.00"
                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-12 text-lg font-semibold pr-8 text-right"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                            g
                          </span>
                        </div>
                      </div>
                      ""
                    </>
                  )}
                  {isAssetLinked && assetType !== "gold" && (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      {assetType === "funds" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-green-400 text-xs uppercase tracking-wider">
                              Chọn quỹ
                            </Label>
                            {fundNames.length > 0 && !newFundName && (
                              <Select
                                value={fundName}
                                onValueChange={setFundName}
                              >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                  <SelectValue placeholder="Chọn quỹ hiện có..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-white/10">
                                  {fundNames.map((name) => (
                                    <SelectItem
                                      key={name}
                                      value={name}
                                      className="text-white hover:bg-white/10"
                                    >
                                      {name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {fundNames.length > 0 && !newFundName && (
                              <p className="text-xs text-zinc-500 text-center">
                                hoặc
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-green-400 text-xs uppercase tracking-wider">
                              Tạo quỹ mới
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                value={newFundName}
                                onChange={(e) => {
                                  setNewFundName(e.target.value);
                                  if (e.target.value) setFundName("");
                                }}
                                placeholder="VD: Quỹ khẩn cấp"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-11 flex-1"
                                maxLength={30}
                              />
                              {newFundName && (
                                <button
                                  type="button"
                                  onClick={() => setNewFundName("")}
                                  className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      ""
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                      Ngày
                    </Label>
                    <Input
                      type="date"
                      value={timestamp.split("T")[0]}
                      onChange={(e) => setTimestamp(e.target.value + "T12:00")}
                      className="bg-white/5 border-white/10 text-white h-11 [color-scheme:dark]"
                    />
                  </div>

                  {error && (
                    <p className="text-rose-400 text-sm text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || deleteLoading}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {editData ? "Cập nhật" : "Lưu giao dịch"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
