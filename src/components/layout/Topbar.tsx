"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="flex-1" />

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={loggingOut}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        {loggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Sign out
      </Button>
    </header>
  );
}
