"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Calendar,
  Shield,
  BarChart3,
  Zap,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Members", icon: Users, href: "/admin/members" },
  { label: "Spaces", icon: FolderOpen, href: "/admin/spaces" },
  { label: "Posts", icon: FileText, href: "/admin/posts" },
  { label: "Events", icon: Calendar, href: "/admin/events" },
  { label: "Moderation", icon: Shield, href: "/admin/moderation" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "Automation", icon: Zap, href: "/admin/automation" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
        <Image
          src="/scholar-favicon-full.png"
          alt="IO Scholar"
          width={30}
          height={30}
          className="rounded-lg"
        />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          IO Assistant
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[11px] text-sidebar-foreground/40">
          IO Scholar Admin
        </p>
      </div>
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
