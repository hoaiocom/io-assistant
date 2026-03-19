"use client";

import useSWR from "swr";
import {
  BarChart3,
  Users,
  FolderOpen,
  FileText,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";


function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
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
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

interface Contributor {
  id: number;
  name: string;
  avatar_url: string | null;
  posts_count: number;
  comments_count: number;
  activity_score: number;
}

interface LeaderboardEntry {
  community_member_id: number;
  name: string;
  avatar_url: string | null;
  headline: string | null;
  public_uid: string;
  total_points: number;
}

interface Space {
  id: number;
  name: string;
  space_type: string;
  post_ids: number[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useSWR("/api/analytics");
  const { data: topContributors, isLoading: loadingContributors } = useSWR(
    "/api/analytics/top-contributors"
  );
  const { data: leaderboard, isLoading: loadingLeaderboard } = useSWR(
    "/api/analytics/leaderboard"
  );
  const { data: spaces, isLoading: loadingSpaces } = useSWR(
    "/api/spaces"
  );

  const contributors: Contributor[] = topContributors?.records ?? (Array.isArray(topContributors) ? topContributors : []);
  const leaderboardEntries: LeaderboardEntry[] = Array.isArray(leaderboard) ? leaderboard : leaderboard?.records ?? [];
  const spaceList: Space[] = spaces?.records ?? spaces ?? [];

  const typeDistribution = analytics?.spaces?.typeDistribution ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Community insights and performance metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={analytics?.members?.total ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Members"
          value={analytics?.members?.totalActive ?? 0}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Spaces"
          value={analytics?.spaces?.totalSpaces ?? 0}
          icon={FolderOpen}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Posts"
          value={analytics?.content?.totalPosts ?? 0}
          icon={FileText}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Data</CardTitle>
              <CardDescription>
                Member activity score distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Activity data visualization
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Chart integration coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Member Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                      <span className="text-sm font-medium text-emerald-700">
                        Active
                      </span>
                      <span className="text-lg font-bold text-emerald-700">
                        {analytics?.members?.totalActive ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                      <span className="text-sm font-medium text-red-700">
                        Inactive
                      </span>
                      <span className="text-lg font-bold text-red-700">
                        {analytics?.members?.totalInactive ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    Top Contributors
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingContributors ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : contributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contributors.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={c.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">
                          {c.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.posts_count + c.comments_count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spaces" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(typeDistribution).map(
              ([type, count]) => (
                <Card key={type}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {type}
                      </p>
                      <p className="text-2xl font-bold">{count as number}</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
                  </CardContent>
                </Card>
              )
            )}
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Spaces by Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSpaces ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {spaceList
                    .sort(
                      (a, b) =>
                        (b.post_ids?.length ?? 0) - (a.post_ids?.length ?? 0)
                    )
                    .slice(0, 10)
                    .map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {space.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {space.space_type}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {space.post_ids?.length ?? 0} posts
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Published Posts
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">
                      {analytics?.content?.publishedPosts ?? 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Draft Posts</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">
                      {analytics?.content?.draftPosts ?? 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">
                      {analytics?.content?.totalPosts ?? 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Leaderboard</CardTitle>
              <CardDescription>
                Top members by gamification points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLeaderboard
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-7 w-7 rounded-full" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    : leaderboardEntries.map((entry, index) => (
                        <TableRow key={entry.community_member_id}>
                          <TableCell>
                            <span
                              className={`text-sm font-bold ${
                                index < 3
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              #{index + 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage
                                  src={entry.avatar_url ?? undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {initials(entry.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium">
                                  {entry.name}
                                </span>
                                {entry.headline && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {entry.headline}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {entry.total_points.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {entry.total_points.toLocaleString()} pts
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  {!loadingLeaderboard && leaderboardEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No leaderboard data available
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
