"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
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
import { CATEGORIES } from "@/lib/constants";
import { formatInputNumber, parseInputNumber } from "@/lib/utils";
import { addTransaction } from "@/hooks/useTransactions";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [timestamp, setTimestamp] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCats = CATEGORIES.filter((c) => c.type === type);
  const amount = parseInputNumber(amountDisplay);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatInputNumber(e.target.value));
  };

  const reset = () => {
    setType("expense");
    setCategoryId("");
    setDescription("");
    setAmountDisplay("");
    setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return setError("Chọn danh mục nào!");
    if (amount <= 0) return setError("Nhập số tiền đi bạn!");

    setLoading(true);
    setError("");
    try {
      const displayName = localStorage.getItem("nhaminh-displayname") ?? "Ai đó";
      const senderToken = sessionStorage.getItem("fcm-token") ?? undefined;

      await addTransaction(
        {
          type,
          categoryId,
          description: description.trim(),
          amount,
          createdBy: displayName,
          ...(senderToken ? { senderToken } : {}),
        },
        new Date(timestamp)
      );

      reset();
      setOpen(false);
      onSuccess?.();
    } catch {
      setError("Lỗi lưu giao dịch, thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-900/60"
        aria-label="Thêm giao dịch"
      >
        <Plus className="w-7 h-7 text-white" />
      </motion.button>

      {/* Backdrop + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
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
                {/* Handle */}
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-bold text-lg">Thêm giao dịch</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Toggle */}
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setType(t); setCategoryId(""); }}
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

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Danh mục</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue placeholder="Chọn danh mục..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-white/10">
                        {filteredCats.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-white/10">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Số tiền (VND)</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={amountDisplay}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-12 text-xl font-bold pr-16 text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                        ₫
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Mô tả (tùy chọn)</Label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="VD: Cơm trưa, xăng xe..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-11"
                      maxLength={80}
                    />
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Thời gian</Label>
                    <Input
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-11 [color-scheme:dark]"
                    />
                  </div>

                  {error && (
                    <p className="text-rose-400 text-sm text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Lưu giao dịch
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
