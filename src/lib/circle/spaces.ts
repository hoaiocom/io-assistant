import { circleAdmin } from "./client";
import type { Space, SpaceGroup, SpaceMember, PaginatedResponse } from "./types";

export async function listSpaces(params?: {
  page?: number;
  per_page?: number;
  sort?: string;
}) {
  return circleAdmin.get<PaginatedResponse<Space>>(
    "spaces",
    params as Record<string, string | number>,
  );
}

export async function getSpace(id: number) {
  return circleAdmin.get<Space>(`spaces/${id}`);
}

export async function createSpace(data: {
  name: string;
  slug?: string;
  space_group_id?: number;
  space_type?: string;
  is_private?: boolean;
}) {
  return circleAdmin.post<Space>("spaces", data);
}

export async function updateSpace(id: number, data: Partial<Space>) {
  return circleAdmin.put<Space>(`spaces/${id}`, data);
}

export async function deleteSpace(id: number) {
  return circleAdmin.delete(`spaces/${id}`);
}

export async function getSpaceAISummaries(spaceId: number) {
  return circleAdmin.get<unknown>(`spaces/${spaceId}/ai_summaries`);
}

// Space Groups
export async function listSpaceGroups(params?: { page?: number; per_page?: number }) {
  return circleAdmin.get<PaginatedResponse<SpaceGroup>>(
    "space_groups",
    params as Record<string, string | number>,
  );
}

export async function getSpaceGroup(id: number) {
  return circleAdmin.get<SpaceGroup>(`space_groups/${id}`);
}

export async function createSpaceGroup(data: { name: string }) {
  return circleAdmin.post<SpaceGroup>("space_groups", data);
}

export async function updateSpaceGroup(id: number, data: { name: string }) {
  return circleAdmin.put<SpaceGroup>(`space_groups/${id}`, data);
}

export async function deleteSpaceGroup(id: number) {
  return circleAdmin.delete(`space_groups/${id}`);
}

// Space Members
export async function listSpaceMembers(params: {
  space_id: number;
  page?: number;
  per_page?: number;
}) {
  return circleAdmin.get<PaginatedResponse<SpaceMember>>(
    "space_members",
    params as Record<string, string | number>,
  );
}

export async function addSpaceMember(data: {
  space_id: number;
  email: string;
}) {
  return circleAdmin.post<SpaceMember>("space_members", data);
}

export async function removeSpaceMember(params: {
  space_id: number;
  email: string;
}) {
  return circleAdmin.delete("space_members", params as Record<string, string | number>);
}

// Space Group Members
export async function addSpaceGroupMember(data: {
  space_group_id: number;
  email: string;
}) {
  return circleAdmin.post("space_group_members", data);
}

export async function removeSpaceGroupMember(params: {
  space_group_id: number;
  email: string;
}) {
  return circleAdmin.delete("space_group_members", params as Record<string, string | number>);
}
