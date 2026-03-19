"use client";

import useSWR from "swr";
import {
  Users,
  Activity,
  FolderOpen,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";


function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useSWR("/api/analytics");
  const { data: topContributors, isLoading: loadingContributors } = useSWR(
    "/api/analytics/top-contributors"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          IO Scholar Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Community overview and quick insights
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={analytics?.members?.total ?? 0}
          icon={Users}
          description="All community members"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Members"
          value={analytics?.members?.totalActive ?? 0}
          icon={Activity}
          description={`${analytics?.members?.totalInactive ?? 0} inactive`}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Spaces"
          value={analytics?.spaces?.totalSpaces ?? 0}
          icon={FolderOpen}
          isLoading={isLoading}
        />
        <StatCard
          title="Published Posts"
          value={analytics?.content?.publishedPosts ?? 0}
          icon={FileText}
          description={`${analytics?.content?.draftPosts ?? 0} drafts`}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest community events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Coming soon</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Activity feed will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Top Contributors</CardTitle>
            </div>
            <CardDescription>
              Most active members by posts and comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingContributors ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topContributors?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No contributor data yet
              </p>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(topContributors) ? topContributors : topContributors?.records ?? [])?.map(
                  (member: {
                    id: number;
                    name: string;
                    avatar_url: string | null;
                    posts_count: number;
                    comments_count: number;
                  }) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.posts_count} posts &middot;{" "}
                          {member.comments_count} comments
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
