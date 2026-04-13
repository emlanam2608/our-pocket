"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";

interface MonthPickerProps {
  month: Date;
  onChange: (m: Date) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
      <button
        onClick={() => onChange(subMonths(month, 1))}
        className="text-zinc-400 hover:text-white transition-colors p-1"
        aria-label="Tháng trước"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <motion.p
        key={month.toISOString()}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 text-center text-white font-semibold text-sm capitalize"
      >
        {format(month, "MMMM yyyy", { locale: vi })}
      </motion.p>

      <button
        onClick={() => onChange(addMonths(month, 1))}
        className="text-zinc-400 hover:text-white transition-colors p-1"
        aria-label="Tháng sau"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
