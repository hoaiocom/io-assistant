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
  params?: { page?: number; per_page?: number; sort?: string },
) {
  const query = new URLSearchParams(
    Object.entries(params || {}).map(([k, v]) => [k, String(v)]),
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

// Chat / Messages
export function getChatRooms(token: string, params?: { page?: number; per_page?: number }) {
  const query = params ? `?page=${params.page || 1}&per_page=${params.per_page || 20}` : "";
  return memberRequest<unknown>(`messages${query}`, token);
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

// Likes
export function likePost(token: string, postId: number) {
  return memberRequest<unknown>(`posts/${postId}/user_likes`, token, { method: "POST" });
}

export function unlikePost(token: string, postId: number) {
  return memberRequest<unknown>(`posts/${postId}/user_likes`, token, { method: "DELETE" });
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
