export const CATEGORIES = [
  { id: "food", label: "🍜 Ăn uống", icon: "🍜", type: "expense" },
  { id: "transport", label: "🚗 Di chuyển", icon: "🚗", type: "expense" },
  { id: "shopping", label: "🛍️ Mua sắm", icon: "🛍️", type: "expense" },
  { id: "health", label: "💊 Sức khỏe", icon: "💊", type: "expense" },
  { id: "entertainment", label: "🎮 Giải trí", icon: "🎮", type: "expense" },
  { id: "utilities", label: "💡 Điện nước", icon: "💡", type: "expense" },
  { id: "rent", label: "🏠 Thuê nhà", icon: "🏠", type: "expense" },
  { id: "education", label: "📚 Giáo dục", icon: "📚", type: "expense" },
  { id: "other_expense", label: "📦 Khác", icon: "📦", type: "expense" },
  { id: "salary", label: "💰 Lương", icon: "💰", type: "income" },
  { id: "bonus", label: "🎁 Thưởng", icon: "🎁", type: "income" },
  { id: "freelance", label: "💻 Freelance", icon: "💻", type: "income" },
  { id: "other_income", label: "✨ Khác", icon: "✨", type: "income" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  shopping: "#ec4899",
  health: "#10b981",
  entertainment: "#8b5cf6",
  utilities: "#f59e0b",
  rent: "#6366f1",
  education: "#14b8a6",
  other_expense: "#6b7280",
  salary: "#22c55e",
  bonus: "#eab308",
  freelance: "#06b6d4",
  other_income: "#a78bfa",
};

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  description: string;
  amount: number;
  timestamp: Date;
  createdBy: string;
  senderToken?: string;
}
