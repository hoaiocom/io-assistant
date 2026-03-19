import { circleAdmin } from "./client";
import type { Post, Comment, Topic, PaginatedResponse } from "./types";

export async function listPosts(params: {
  page?: number;
  per_page?: number;
  space_id?: number;
  space_group_id?: number;
  status?: string;
  search_text?: string;
  sort?: string;
}) {
  return circleAdmin.get<PaginatedResponse<Post>>(
    "posts",
    params as Record<string, string | number>,
  );
}

export async function getPost(id: number) {
  return circleAdmin.get<Post>(`posts/${id}`);
}

export async function createPost(data: {
  space_id: number;
  name: string;
  body: string;
  status?: string;
  tiptap_body?: Record<string, unknown>;
  user_email?: string;
  user_id?: number;
}) {
  return circleAdmin.post<Post>("posts", data);
}

export async function updatePost(id: number, data: Partial<Post>) {
  return circleAdmin.put<Post>(`posts/${id}`, data);
}

export async function deletePost(id: number) {
  return circleAdmin.delete(`posts/${id}`);
}

export async function getPostSummary(postId: number) {
  return circleAdmin.get<{ summary: string }>(`posts/${postId}/summary`);
}

export async function unfollowPost(postId: number, communityMemberId: number) {
  return circleAdmin.delete(`posts/${postId}/post_followers`, {
    community_member_id: communityMemberId,
  });
}

// Comments
export async function listComments(params: {
  page?: number;
  per_page?: number;
  space_id?: number;
  post_id?: number;
  search_text?: string;
}) {
  return circleAdmin.get<PaginatedResponse<Comment>>(
    "comments",
    params as Record<string, string | number>,
  );
}

export async function getComment(id: number) {
  return circleAdmin.get<Comment>(`comments/${id}`);
}

export async function createComment(data: {
  body: string;
  post_id: number;
  parent_comment_id?: number;
  skip_notifications?: boolean;
}) {
  return circleAdmin.post<Comment>("comments", data);
}

export async function deleteComment(id: number) {
  return circleAdmin.delete(`comments/${id}`);
}

// Topics
export async function listTopics(params?: { page?: number; per_page?: number }) {
  return circleAdmin.get<PaginatedResponse<Topic>>(
    "topics",
    params as Record<string, string | number>,
  );
}

export async function createTopic(data: { name: string; space_id: number }) {
  return circleAdmin.post<Topic>("topics", data);
}

export async function updateTopic(id: number, data: { name: string }) {
  return circleAdmin.put<Topic>(`topics/${id}`, data);
}

export async function deleteTopic(id: number) {
  return circleAdmin.delete(`topics/${id}`);
}
