"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Zap,
  Plus,
  Copy,
  ExternalLink,
  Ban,
  Mail,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { safeFormat } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";


interface InvitationLink {
  id: number;
  token: string;
  url: string;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

export default function AutomationPage() {
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const {
    data: invitations,
    isLoading: loadingInvitations,
    mutate: mutateInvitations,
  } = useSWR("/api/invitations");

  const invitationList: InvitationLink[] = invitations?.records ?? invitations ?? [];

  async function handleCreateInvite() {
    setCreatingInvite(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_uses: inviteMaxUses ? Number(inviteMaxUses) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Invitation link created");
      setCreateInviteOpen(false);
      setInviteMaxUses("");
      mutateInvitations();
    } catch {
      toast.error("Failed to create invitation link");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleRevokeInvite(id: number) {
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      toast.success("Invitation link revoked");
      mutateInvitations();
    } catch {
      toast.error("Failed to revoke invitation");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  async function handleSendMessage() {
    if (!recipientEmail || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          body: messageBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Message sent successfully");
      setRecipientEmail("");
      setMessageBody("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
        <p className="text-muted-foreground mt-1">
          Invitations, webhooks, and messaging
        </p>
      </div>

      <Tabs defaultValue="invitations">
        <TabsList>
          <TabsTrigger value="invitations">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Zap className="mr-1.5 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="mr-1.5 h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage community invitation links
            </p>
            <Dialog
              open={createInviteOpen}
              onOpenChange={setCreateInviteOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create invitation link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-uses">
                      Max uses (leave empty for unlimited)
                    </Label>
                    <Input
                      id="max-uses"
                      type="number"
                      placeholder="Unlimited"
                      value={inviteMaxUses}
                      onChange={(e) => setInviteMaxUses(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                  >
                    {creatingInvite ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingInvitations ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : invitationList.length === 0 ? (
            <div className="text-center py-16">
              <ExternalLink className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No invitation links created yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitationList.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono truncate max-w-[300px]">
                          {inv.url}
                        </p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copyToClipboard(inv.url)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy URL</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {inv.uses_count}
                          {inv.max_uses
                            ? ` / ${inv.max_uses} uses`
                            : " uses"}
                        </span>
                        <span>
                          Created{" "}
                          {safeFormat(inv.created_at, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={inv.active ? "default" : "secondary"}
                      className={
                        inv.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {inv.active ? "Active" : "Revoked"}
                    </Badge>
                    {inv.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeInvite(inv.id)}
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration</CardTitle>
              <CardDescription>
                Receive real-time events from Circle via webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Webhook URL
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    POST /api/webhooks/circle
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/api/webhooks/circle`
                      )
                    }
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Configure this URL in your Circle community settings to
                  receive webhook events for member joins, post creation, and
                  other community activities.
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-center py-8 rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Coming soon: webhook event log
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Direct Message</CardTitle>
              <CardDescription>
                Send a message to a community member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="msg-email">Recipient Email</Label>
                <Input
                  id="msg-email"
                  type="email"
                  placeholder="member@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg-body">Message</Label>
                <textarea
                  id="msg-body"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your message..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    sendingMessage || !recipientEmail || !messageBody.trim()
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
