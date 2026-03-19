"use client";

import { useState } from "react";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";

export function CommunityShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <CommunityHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <CommunitySidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
