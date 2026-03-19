"use client";

import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="hidden md:flex h-full items-center justify-center">
      <div className="text-center px-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessageCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Your Messages</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          Select a conversation from the sidebar or start a new one to begin messaging.
        </p>
      </div>
    </div>
  );
}
