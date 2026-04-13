"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";

  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"password" | "name">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("nhaminh-displayname");
    if (savedName) setDisplayName(savedName);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Sai mật khẩu, thử lại nhé!");
        setLoading(false);
        return;
      }
      // Check if user has a saved name
      const savedName = localStorage.getItem("nhaminh-displayname");
      if (savedName) {
        await signInAnonymously(auth);
        router.push(from);
      } else {
        setStep("name");
        setLoading(false);
      }
    } catch {
      setError("Có lỗi xảy ra, thử lại nhé!");
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Bạn chưa nhập tên!");
      return;
    }
    setLoading(true);
    localStorage.setItem("nhaminh-displayname", displayName.trim());
    await signInAnonymously(auth);
    router.push(from);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-80 bg-emerald-600/15 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-900/50 mb-4"
          >
            <Home className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nhà Mình</h1>
          <p className="text-zinc-400 text-sm mt-1">Quản lý chi tiêu cùng nhau 💕</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === "password" ? (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium text-zinc-300">Nhập mật khẩu để vào nhà</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400 text-xs uppercase tracking-wider">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 pr-10 h-12"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Vào nhà
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleNameSubmit}
                className="space-y-4"
              >
                <div className="mb-2">
                  <p className="text-base font-semibold text-white">Chào mừng! 🎉</p>
                  <p className="text-sm text-zinc-400 mt-1">Bạn là ai trong nhà này?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400 text-xs uppercase tracking-wider">
                    Tên của bạn
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="VD: Anh, Em, Mình..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 h-12"
                    autoFocus
                    maxLength={30}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !displayName.trim()}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Vào nhà thôi! 🏠
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
