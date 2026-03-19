"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";

export function CommunityShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/chat");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <CommunityHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {!isChatRoute && (
          <CommunitySidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        )}
        <main className={isChatRoute ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}>
          {children}
        </main>
      </div>
    </div>
  );
}
