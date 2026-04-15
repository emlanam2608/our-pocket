"use client";

import { useState } from "react";
import { User, Check, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProfileSettingsProps {
  currentName: string;
  onUpdate: (newName: string) => void;
}

export function ProfileSettings({
  currentName,
  onUpdate,
}: ProfileSettingsProps) {
  const [name, setName] = useState(currentName);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setName(currentName);
    }
  };

  const handleSave = () => {
    if (name.trim()) {
      onUpdate(name.trim());
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 group transition-all hover:opacity-80">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:scale-105 transition-transform duration-300">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-base leading-none group-hover:text-purple-400 transition-colors">
              Nhà Mình
            </p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-zinc-500 text-xs">Xin chào, {currentName}</p>
              <Settings2 className="w-2.5 h-2.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs bg-[#09090b]/95 backdrop-blur-xl border-white/10 text-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-linear-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-400" />
            Cài đặt tài khoản
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-6">
          <div className="grid gap-2 text-left">
            <Label
              htmlFor="name"
              className="text-zinc-400 ml-1 text-xs font-semibold uppercase tracking-wider"
            >
              Tên hiển thị
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-11 bg-white/3 border-white/5 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-14 text-base rounded-2xl placeholder:text-zinc-600"
                placeholder="Nhập tên của bạn..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 border-0 bg-white/5 hover:bg-white/10 h-14 transition-all font-medium rounded-2xl"
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-xl shadow-purple-900/30 h-14 transition-all font-bold gap-2 rounded-2xl"
            onClick={handleSave}
          >
            <Check className="w-4 h-4" />
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
