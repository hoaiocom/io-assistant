import { circleAdmin } from "./client";
import type {
  CommunityMember,
  Space,
  Post,
  LeaderboardEntry,
  PaginatedResponse,
} from "./types";

export async function getLeaderboard(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<LeaderboardEntry>>(
    "gamification/leaderboard",
    params,
  );
}

export async function getMemberStats() {
  const [active, inactive] = await Promise.all([
    circleAdmin.get<PaginatedResponse<CommunityMember>>(
      "community_members",
      { page: 1, per_page: 1 },
    ),
    circleAdmin.get<PaginatedResponse<CommunityMember>>(
      "community_members",
      { page: 1, per_page: 1, status: "inactive" },
    ),
  ]);
  return {
    totalActive: active.count,
    totalInactive: inactive.count,
    total: active.count + inactive.count,
  };
}

export async function getSpaceStats() {
  // Fetch one page of 60 spaces (covers most communities). The `count`
  // field gives the true total without paginating through every page.
  const result = await circleAdmin.get<PaginatedResponse<Space>>("spaces", {
    page: 1,
    per_page: 60,
  });

  const typeDistribution: Record<string, number> = {};
  for (const space of result.records) {
    typeDistribution[space.space_type] =
      (typeDistribution[space.space_type] || 0) + 1;
  }

  return {
    totalSpaces: result.count,
    typeDistribution,
    spaces: result.records,
  };
}

export async function getContentStats(spaceId?: number) {
  const params: Record<string, string | number> = { page: 1, per_page: 1 };
  if (spaceId) params.space_id = spaceId;

  const [published, draft] = await Promise.all([
    circleAdmin.get<PaginatedResponse<Post>>("posts", {
      ...params,
      status: "published",
    }),
    circleAdmin.get<PaginatedResponse<Post>>("posts", {
      ...params,
      status: "draft",
    }),
  ]);

  return {
    publishedPosts: published.count,
    draftPosts: draft.count,
    totalPosts: published.count + draft.count,
  };
}

export async function getTopContributors(limit = 10) {
  const members = await circleAdmin.get<PaginatedResponse<CommunityMember>>(
    "community_members",
    { page: 1, per_page: limit },
  );
  return members.records
    .sort((a, b) => b.posts_count + b.comments_count - (a.posts_count + a.comments_count))
    .slice(0, limit);
}
