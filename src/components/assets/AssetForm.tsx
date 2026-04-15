"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { AssetEntry, AssetType, ASSET_LABELS, ASSET_ICONS } from "@/lib/constants";
import { addAssetEntry, updateAssetEntry } from "@/hooks/useAssets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AssetFormProps {
  editData?: AssetEntry | null;
  onClose: () => void;
  displayName: string;
}

export function AssetForm({ editData, onClose, displayName }: AssetFormProps) {
  const [open, setOpen] = useState(!!editData);
  const [type, setType] = useState<AssetType>(editData?.type || "gold");
  const [amount, setAmount] = useState(editData?.amount.toString() || "");
  const [cost, setCost] = useState(editData?.cost?.toString() || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [date, setDate] = useState(
    editData ? editData.timestamp.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setOpen(true);
      setType(editData.type);
      setAmount(editData.amount.toString());
      setCost(editData.cost?.toString() || "");
      setDescription(editData.description || "");
      setDate(editData.timestamp.toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleClose = () => {
    setOpen(false);
    setType("gold");
    setAmount("");
    setCost("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const data = {
        type,
        amount: amountNum,
        description,
        createdBy: displayName,
      } as any;

      if (type === "gold" && cost) {
        const costNum = parseFloat(cost);
        if (!isNaN(costNum) && costNum > 0) {
          data.cost = costNum;
        }
      }

      const selectedDate = new Date(date);

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
      {/* Floating Button */}
      {!editData && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-32 right-4 z-40 w-14 h-14 rounded-full bg-linear-to-r from-violet-600 to-purple-600 shadow-xl shadow-purple-900/30 text-white flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
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
                  {editData ? "Chỉnh sửa tài sản" : "Thêm tài sản"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selector */}
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
                          {ASSET_LABELS[t].split(" ")[1]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                    Số lượng {type === "gold" ? "(grams)" : "(₫)"}
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

                {/* Cost (for gold) */}
                {type === "gold" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Giá trị (₫)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="2000000"
                      className="bg-white/3 border-white/10"
                    />
                  </div>
                )}

                {/* Description (for funds/savings) */}
                {type !== "gold" && (
                  <div>
                    <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                      Ghi chú
                    </Label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ví dụ: Tiết kiệm tháng 4"
                      className="bg-white/3 border-white/10"
                    />
                  </div>
                )}

                {/* Date */}
                <div>
                  <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block ml-1">
                    Ngày
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white/3 border-white/10"
                  />
                </div>

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
                    {loading ? "Đang lưu..." : editData ? "Cập nhật" : "Thêm"}
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
