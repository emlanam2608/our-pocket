"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import { formatVND } from "@/lib/utils";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import type { Transaction } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseChartProps {
  transactions: Transaction[];
  loading: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 text-sm">
        <p className="text-zinc-300 font-medium">{payload[0].name}</p>
        <p className="text-white font-bold">{formatVND(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function ExpenseChart({ transactions, loading }: ExpenseChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const grouped: Record<string, number> = {};
    for (const t of expenses) {
      const amount = Number(t.amount) || 0;
      grouped[t.categoryId] = (grouped[t.categoryId] || 0) + amount;
    }

    return Object.entries(grouped)
      .map(([cat, total]) => {
        const catInfo = CATEGORIES.find((c) => c.id === cat);
        return {
          name: catInfo?.label ?? cat,
          value: total,
          color: CATEGORY_COLORS[cat] ?? "#6b7280",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [transactions]);

  if (loading) {
    return (
      <Skeleton className="h-56 rounded-2xl skeleton-shimmer bg-white/5" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl h-40 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Chưa có chi tiêu nào 🎉</p>
      </div>
    );
  }

  const activeIndex = selectedIndex ?? hoveredIndex;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-4 outline-none focus:outline-none"
    >
      <p className="text-zinc-300 text-sm font-semibold mb-3 px-1">
        Chi tiêu theo danh mục
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart style={{ outline: "none" }}>
          <defs>
            <filter id="pie-blur">
              <feGaussianBlur stdDeviation="1.25" />
            </filter>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="transparent"
            rootTabIndex={-1}
            shape={(props: unknown) => {
              const p = props as {
                cx: number;
                cy: number;
                innerRadius: number;
                outerRadius: number;
                startAngle: number;
                endAngle: number;
                fill: string;
                index?: number;
              };

              const idx = typeof p.index === "number" ? p.index : -1;
              const dim = activeIndex !== null && idx !== activeIndex;
              const active = activeIndex !== null && idx === activeIndex;

              return (
                <Sector
                  cx={p.cx}
                  cy={p.cy}
                  innerRadius={p.innerRadius}
                  outerRadius={p.outerRadius + (active ? 8 : 0)}
                  startAngle={p.startAngle}
                  endAngle={p.endAngle}
                  fill={p.fill}
                  opacity={dim ? 0.25 : 1}
                  filter={dim ? "url(#pie-blur)" : undefined}
                  stroke="transparent"
                />
              );
            }}
            onMouseEnter={(_, idx) => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(_, idx) =>
              setSelectedIndex((cur) => (cur === idx ? null : idx))
            }
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                stroke="transparent"
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string, _entry: unknown, idx?: number) => (
              <span
                className="text-zinc-400 text-xs"
                style={{
                  opacity:
                    activeIndex === null || idx == null || idx === activeIndex
                      ? 1
                      : 0.35,
                }}
              >
                {value}
              </span>
            )}
            iconSize={8}
            iconType="circle"
            onClick={(_e: unknown, payload: unknown) => {
              const p = payload as { index?: number };
              const index = p.index;
              if (typeof index !== "number") return;
              setSelectedIndex((cur) => (cur === index ? null : index));
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
