import { circleAdmin } from "./client";
import type { CommunityMember, PaginatedResponse, TaggedMember, MemberTag } from "./types";

export async function listMembers(params: {
  page?: number;
  per_page?: number;
  status?: string;
}) {
  return circleAdmin.get<PaginatedResponse<CommunityMember>>(
    "community_members",
    params as Record<string, string | number>,
  );
}

export async function getMember(id: number) {
  return circleAdmin.get<CommunityMember>(`community_members/${id}`);
}

export async function searchMembers(params: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<CommunityMember>>(
    "community_members/search",
    params,
  );
}

export async function createMember(data: {
  email: string;
  name?: string;
  headline?: string;
  space_ids?: number[];
  space_group_ids?: number[];
  member_tag_ids?: number[];
  skip_invitation?: boolean;
}) {
  return circleAdmin.post<CommunityMember>("community_members", data);
}

export async function updateMember(
  id: number,
  data: Partial<CommunityMember>,
) {
  return circleAdmin.put<CommunityMember>(`community_members/${id}`, data);
}

export async function deactivateMember(id: number) {
  return circleAdmin.delete(`community_members/${id}`);
}

export async function banMember(id: number) {
  return circleAdmin.put(`community_members/${id}/ban_member`);
}

export async function deleteMemberPermanently(id: number) {
  return circleAdmin.put(`community_members/${id}/delete_member`);
}

export async function getMemberSpaces(params: {
  community_member_id?: number;
  user_email?: string;
  page?: number;
  per_page?: number;
}) {
  return circleAdmin.get<PaginatedResponse<unknown>>(
    "community_member_spaces",
    params as Record<string, string | number>,
  );
}

export async function getMemberAccessGroups(memberId: number, params?: { page?: number; per_page?: number }) {
  return circleAdmin.get<PaginatedResponse<unknown>>(
    `community_members/${memberId}/access_groups`,
    params as Record<string, string | number>,
  );
}

// Member Tags
export async function listMemberTags(params?: { page?: number; per_page?: number }) {
  return circleAdmin.get<PaginatedResponse<MemberTag>>(
    "member_tags",
    params as Record<string, string | number>,
  );
}

export async function createMemberTag(data: { name: string }) {
  return circleAdmin.post<MemberTag>("member_tags", data);
}

export async function updateMemberTag(id: number, data: { name: string }) {
  return circleAdmin.put<MemberTag>(`member_tags/${id}`, data);
}

export async function deleteMemberTag(id: number) {
  return circleAdmin.delete(`member_tags/${id}`);
}

// Tagged Members
export async function listTaggedMembers(params: {
  member_tag_id?: number;
  community_member_id?: number;
  page?: number;
  per_page?: number;
}) {
  return circleAdmin.get<PaginatedResponse<TaggedMember>>(
    "tagged_members",
    params as Record<string, string | number>,
  );
}

export async function addTagToMember(data: {
  member_tag_id: number;
  community_member_id: number;
}) {
  return circleAdmin.post<TaggedMember>("tagged_members", data);
}

export async function removeTagFromMember(taggedMemberId: number) {
  return circleAdmin.delete(`tagged_members/${taggedMemberId}`);
}
