const MEMBER_API_BASE = "https://app.circle.so/api/headless/v1";

async function memberRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${MEMBER_API_BASE}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Member API error: ${res.status} ${(err as { message?: string }).message || ""}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Home & Feed
export function getHomeFeed(token: string, params?: { page?: number; per_page?: number }) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`home${query}`, token);
}

// Spaces
export function getSpaces(token: string) {
  return memberRequest<unknown>("spaces", token);
}

export function getSpaceDetail(token: string, spaceId: number) {
  return memberRequest<unknown>(`spaces/${spaceId}`, token);
}

export function joinSpace(token: string, spaceId: number) {
  return memberRequest<unknown>(`spaces/${spaceId}/join`, token, { method: "POST" });
}

export function leaveSpace(token: string, spaceId: number) {
  return memberRequest<unknown>(`spaces/${spaceId}/leave`, token, { method: "DELETE" });
}

// Posts
export function getSpacePosts(
  token: string,
  spaceId: number,
  params?: {
    page?: number;
    per_page?: number;
    sort?: string;
    past_events?: string;
    topics?: string;
  },
) {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  const query = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return memberRequest<unknown>(`spaces/${spaceId}/posts${query ? `?${query}` : ""}`, token);
}

export function getPostDetail(token: string, spaceId: number, postId: number) {
  return memberRequest<unknown>(`spaces/${spaceId}/posts/${postId}`, token);
}

export function createMemberPost(
  token: string,
  spaceId: number,
  data: { name: string; body: string; tiptap_body?: Record<string, unknown> },
) {
  return memberRequest<unknown>(`spaces/${spaceId}/posts`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Comments
export function getPostComments(
  token: string,
  postId: number,
  params?: { page?: number; per_page?: number; sort?: string },
) {
  const query = new URLSearchParams(
    Object.entries(params || {}).map(([k, v]) => [k, String(v)]),
  ).toString();
  return memberRequest<unknown>(`posts/${postId}/comments${query ? `?${query}` : ""}`, token);
}

export function createMemberComment(
  token: string,
  postId: number,
  data: { body: string },
) {
  return memberRequest<unknown>(`posts/${postId}/comments`, token, {
    method: "POST",
    body: JSON.stringify({ comment: data }),
  });
}

// Bookmarks
export function getBookmarks(token: string, params?: { page?: number; per_page?: number }) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`bookmarks${query}`, token);
}

export function createBookmark(
  token: string,
  data: { record_id: number; bookmark_type: string },
) {
  return memberRequest<unknown>("bookmarks", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteBookmark(token: string, bookmarkId: number) {
  return memberRequest<unknown>(`bookmarks/${bookmarkId}`, token, { method: "DELETE" });
}

// Notifications
export function getNotifications(token: string, params?: { page?: number; per_page?: number }) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`notifications${query}`, token);
}

export function markNotificationRead(token: string, notificationId: number) {
  return memberRequest<unknown>(`notifications/${notificationId}/mark_as_read`, token, {
    method: "POST",
  });
}

export function markAllNotificationsRead(token: string) {
  return memberRequest<unknown>("notifications/mark_all_as_read", token, {
    method: "POST",
  });
}

export function getNewNotificationsCount(token: string) {
  return memberRequest<unknown>("notifications/new_notifications_count", token);
}

// Community Members (directory)
export function getCommunityMembers(
  token: string,
  params?: {
    page?: number;
    per_page?: number;
    search_text?: string;
    sort?: string;
    space_id?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.search_text) query.set("search_text", params.search_text);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.space_id) query.set("space_id", String(params.space_id));
  const qs = query.toString();
  return memberRequest<unknown>(`community_members${qs ? `?${qs}` : ""}`, token);
}

// Profile
export function getProfile(token: string) {
  return memberRequest<unknown>("profile", token);
}

export function getMemberProfile(token: string) {
  return memberRequest<unknown>("community_member", token);
}

export function getPublicProfile(token: string, memberId: number) {
  return memberRequest<unknown>(`community_members/${memberId}/public_profile`, token);
}

// Space Chat (for space_type: "chat")
// Resolves a space's embedded chat room UUID from its detail endpoint,
// then proxies to the chat room messages API.
export async function getSpaceChatRoomUuid(
  token: string,
  spaceId: number,
): Promise<string | null> {
  const detail = (await getSpaceDetail(token, spaceId)) as Record<string, unknown>;
  const chatRoom = detail?.chat_room as Record<string, unknown> | undefined;
  const uuid =
    detail?.chat_room_uuid ??
    chatRoom?.uuid ??
    detail?.embedded_chat_room_uuid ??
    null;
  return typeof uuid === "string" ? uuid : null;
}

export async function getSpaceChatMessages(
  token: string,
  spaceId: number,
  params?: { id?: number; previous_per_page?: number; next_per_page?: number },
) {
  const uuid = await getSpaceChatRoomUuid(token, spaceId);
  if (!uuid) throw new Error("Chat room UUID not found for this space");
  const query = new URLSearchParams();
  if (params?.id) query.set("id", String(params.id));
  if (params?.previous_per_page) query.set("previous_per_page", String(params.previous_per_page));
  if (params?.next_per_page) query.set("next_per_page", String(params.next_per_page));
  const qs = query.toString();
  return memberRequest<unknown>(
    `messages/${uuid}/chat_room_messages${qs ? `?${qs}` : ""}`,
    token,
  );
}

export async function getSpaceChatParticipants(
  token: string,
  spaceId: number,
  params?: { page?: number; per_page?: number },
) {
  const uuid = await getSpaceChatRoomUuid(token, spaceId);
  if (!uuid) throw new Error("Chat room UUID not found for this space");
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();
  return memberRequest<unknown>(
    `messages/${uuid}/chat_room_participants${qs ? `?${qs}` : ""}`,
    token,
  );
}

export async function sendSpaceChatMessage(
  token: string,
  spaceId: number,
  data: { rich_text_body: Record<string, unknown>; parent_message_id?: number | null },
) {
  const uuid = await getSpaceChatRoomUuid(token, spaceId);
  if (!uuid) throw new Error("Chat room UUID not found for this space");
  return memberRequest<unknown>(
    `messages/${uuid}/chat_room_messages`,
    token,
    { method: "POST", body: JSON.stringify(data) },
  );
}

// Chat / Messages (DMs & Group Chats)
export function getChatRooms(token: string, params?: { page?: number; per_page?: number }) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`messages${query}`, token);
}

export function getUnreadChatRooms(token: string) {
  return memberRequest<unknown>("messages/unread_chat_rooms", token);
}

export function getChatRoom(token: string, uuid: string) {
  return memberRequest<unknown>(`messages/${uuid}`, token);
}

export function createChatRoom(
  token: string,
  data: { chat_room: Record<string, unknown> },
) {
  return memberRequest<unknown>("messages", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function markChatRoomAsRead(token: string, uuid: string) {
  return memberRequest<unknown>(`messages/${uuid}/mark_all_as_read`, token, {
    method: "POST",
  });
}

export function getChatRoomParticipants(
  token: string,
  chatRoomUuid: string,
) {
  return memberRequest<unknown>(
    `messages/${chatRoomUuid}/chat_room_participants`,
    token,
  );
}

export function getChatMessages(
  token: string,
  chatRoomUuid: string,
  params?: { page?: number; per_page?: number },
) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(
    `messages/${chatRoomUuid}/chat_room_messages${query}`,
    token,
  );
}

export function getChatMessage(
  token: string,
  chatRoomUuid: string,
  messageId: number,
) {
  return memberRequest<unknown>(
    `messages/${chatRoomUuid}/chat_room_messages/${messageId}`,
    token,
  );
}

export function sendChatMessage(
  token: string,
  chatRoomUuid: string,
  data: { rich_text_body: Record<string, unknown> },
) {
  return memberRequest<unknown>(
    `messages/${chatRoomUuid}/chat_room_messages`,
    token,
    { method: "POST", body: JSON.stringify(data) },
  );
}

export function deleteChatMessage(
  token: string,
  chatRoomUuid: string,
  messageId: number,
) {
  return memberRequest<unknown>(
    `messages/${chatRoomUuid}/chat_room_messages/${messageId}`,
    token,
    { method: "DELETE" },
  );
}

export function searchCommunityMembersForChat(
  token: string,
  query: string,
) {
  return memberRequest<unknown>("search/community_members", token, {
    method: "POST",
    body: JSON.stringify({ search_text: query }),
  });
}

// Chat Threads
export function getChatThreads(
  token: string,
  params?: { page?: number; per_page?: number },
) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`chat_threads${query}`, token);
}

export function getChatThread(token: string, threadId: number) {
  return memberRequest<unknown>(`chat_threads/${threadId}`, token);
}

export function getUnreadChatThreads(token: string) {
  return memberRequest<unknown>("chat_threads/unread_chat_threads", token);
}

// Search
export function searchContent(
  token: string,
  searchText: string,
  params?: { page?: number; per_page?: number },
) {
  const query = new URLSearchParams({
    search_text: searchText,
    ...(params?.page ? { page: String(params.page) } : {}),
    ...(params?.per_page ? { per_page: String(params.per_page) } : {}),
  }).toString();
  return memberRequest<unknown>(`search?${query}`, token);
}

// Events
export function getCommunityEvents(
  token: string,
  params?: {
    page?: number;
    per_page?: number;
    past_events?: boolean;
    filter_date_start?: string;
    filter_date_end?: string;
    status?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.past_events !== undefined)
    query.set("past_events", String(params.past_events));
  if (params?.filter_date_start)
    query.set("filter_date[start_date]", params.filter_date_start);
  if (params?.filter_date_end)
    query.set("filter_date[end_date]", params.filter_date_end);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return memberRequest<unknown>(`community_events${qs ? `?${qs}` : ""}`, token);
}

export function getEventAttendees(
  token: string,
  eventId: number,
  params?: { page?: number; per_page?: number },
) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`events/${eventId}/event_attendees${query}`, token);
}

export function rsvpToEvent(token: string, eventId: number) {
  return memberRequest<unknown>(`events/${eventId}/event_attendees`, token, {
    method: "POST",
  });
}

// Courses
export function getCourseSections(token: string, courseId: number) {
  return memberRequest<unknown>(`courses/${courseId}/sections`, token);
}

export function getCourseLesson(token: string, courseId: number, lessonId: number) {
  return memberRequest<unknown>(`courses/${courseId}/lessons/${lessonId}`, token);
}

export function updateLessonProgress(
  token: string,
  courseId: number,
  lessonId: number,
  data: Record<string, unknown>,
) {
  return memberRequest<unknown>(
    `courses/${courseId}/lessons/${lessonId}/progress`,
    token,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

// Post likes
export function likePost(token: string, postId: number) {
  return memberRequest<unknown>(`posts/${postId}/user_likes`, token, { method: "POST" });
}

export function unlikePost(token: string, postId: number) {
  return memberRequest<unknown>(`posts/${postId}/user_likes`, token, { method: "DELETE" });
}

// Comment likes
export function likeComment(token: string, commentId: number) {
  return memberRequest<unknown>(`comments/${commentId}/user_likes`, token, { method: "POST" });
}

export function unlikeComment(token: string, commentId: number) {
  return memberRequest<unknown>(`comments/${commentId}/user_likes`, token, { method: "DELETE" });
}

// Comment replies
export function createReply(
  token: string,
  commentId: number,
  data: { body: string },
) {
  return memberRequest<unknown>(`comments/${commentId}/replies`, token, {
    method: "POST",
    body: JSON.stringify({ reply: data }),
  });
}

// Delete comment
export function deleteComment(token: string, postId: number, commentId: number) {
  return memberRequest<unknown>(`posts/${postId}/comments/${commentId}`, token, {
    method: "DELETE",
  });
}

// Delete reply
export function deleteReply(token: string, commentId: number, replyId: number) {
  return memberRequest<unknown>(`comments/${commentId}/replies/${replyId}`, token, {
    method: "DELETE",
  });
}

// Reactions
export function addReaction(
  token: string,
  data: { chat_room_message: number; emoji: string },
) {
  return memberRequest<unknown>("reactions", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeReaction(
  token: string,
  data: { chat_room_message: number; emoji: string },
) {
  return memberRequest<unknown>("reactions", token, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}
