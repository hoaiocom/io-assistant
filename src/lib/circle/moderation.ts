import { circleAdmin } from "./client";
import type { FlaggedContent, CommunitySegment, PaginatedResponse } from "./types";

// Flagged Contents
export async function listFlaggedContents(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}) {
  return circleAdmin.get<PaginatedResponse<FlaggedContent>>(
    "flagged_contents",
    params as Record<string, string | number>,
  );
}

export async function flagContent(data: {
  content_id: number;
  content_type: string;
  reported_reason_type: string;
  reported_reason_body?: string;
}) {
  return circleAdmin.post<FlaggedContent>("flagged_contents", {
    flagged_content: data,
  });
}

// Advanced Search
export async function advancedSearch(params: {
  query: string;
  type?: string;
  page?: number;
  per_page?: number;
}) {
  return circleAdmin.get<PaginatedResponse<unknown>>(
    "advanced_search",
    params as Record<string, string | number>,
  );
}

// Community Segments
export async function listSegments(params?: {
  page?: number;
  per_page?: number;
  title?: string;
}) {
  return circleAdmin.get<PaginatedResponse<CommunitySegment>>(
    "community_segments",
    params as Record<string, string | number>,
  );
}

export async function createSegment(data: {
  title: string;
  visible?: boolean;
  rules?: Record<string, unknown>;
}) {
  return circleAdmin.post<CommunitySegment>("community_segments", data);
}

export async function updateSegment(
  id: number,
  data: Partial<CommunitySegment>,
) {
  return circleAdmin.put<CommunitySegment>(`community_segments/${id}`, data);
}

export async function deleteSegment(id: number) {
  return circleAdmin.delete(`community_segments/${id}`);
}

export async function duplicateSegment(id: number, title: string) {
  return circleAdmin.post<CommunitySegment>(
    `community_segments/${id}/duplicate`,
    { title },
  );
}
