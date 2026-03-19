import { circleAdmin } from "./client";
import type {
  AccessGroup,
  InvitationLink,
  ProfileField,
  Form,
  FormSubmission,
  CourseSection,
  CourseLesson,
  LiveRoom,
  Message,
  PaginatedResponse,
} from "./types";

// Access Groups
export async function listAccessGroups(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<AccessGroup>>("access_groups", params);
}

export async function createAccessGroup(data: { name: string; description?: string }) {
  return circleAdmin.post<AccessGroup>("access_groups", { access_group: data });
}

export async function updateAccessGroup(id: number, data: { name?: string; description?: string }) {
  return circleAdmin.put<AccessGroup>(`access_groups/${id}`, { access_group: data });
}

export async function archiveAccessGroup(id: number) {
  return circleAdmin.delete(`access_groups/${id}`);
}

export async function unarchiveAccessGroup(id: number) {
  return circleAdmin.patch(`access_groups/${id}/unarchive`);
}

export async function listAccessGroupMembers(accessGroupId: number, params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<unknown>>(`access_groups/${accessGroupId}/community_members`, params);
}

export async function addMemberToAccessGroup(accessGroupId: number, email: string) {
  return circleAdmin.post(`access_groups/${accessGroupId}/community_members`, { email });
}

export async function removeMemberFromAccessGroup(accessGroupId: number, email: string) {
  return circleAdmin.delete(`access_groups/${accessGroupId}/community_members`, { email } as unknown as Record<string, string | number>);
}

// Invitation Links
export async function listInvitationLinks(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<InvitationLink>>("invitation_links", params);
}

export async function createInvitationLink(data: Record<string, unknown>) {
  return circleAdmin.post<InvitationLink>("invitation_links", data);
}

export async function getInvitationLink(id: number) {
  return circleAdmin.get<InvitationLink>(`invitation_links/${id}`);
}

export async function revokeInvitationLink(id: number) {
  return circleAdmin.post(`invitation_links/${id}/revoke`);
}

// Profile Fields
export async function listProfileFields(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<ProfileField>>("profile_fields", params);
}

export async function createProfileField(data: Record<string, unknown>) {
  return circleAdmin.post<ProfileField>("profile_fields", data);
}

export async function updateProfileField(id: number, data: Record<string, unknown>) {
  return circleAdmin.put<ProfileField>(`profile_fields/${id}`, data);
}

export async function archiveProfileField(id: number) {
  return circleAdmin.post(`profile_fields/${id}/archive`);
}

export async function unarchiveProfileField(id: number) {
  return circleAdmin.post(`profile_fields/${id}/unarchive`);
}

// Forms
export async function listForms(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<Form>>("forms", params);
}

export async function getForm(id: number) {
  return circleAdmin.get<Form>(`forms/${id}`);
}

export async function createForm(data: Record<string, unknown>) {
  return circleAdmin.post<Form>("forms", data);
}

export async function updateForm(id: number, data: Record<string, unknown>) {
  return circleAdmin.put<Form>(`forms/${id}`, data);
}

export async function deleteForm(id: number) {
  return circleAdmin.delete(`forms/${id}`);
}

export async function duplicateForm(id: number) {
  return circleAdmin.post<Form>(`forms/${id}/duplicate`);
}

export async function listFormSubmissions(formId: number, params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<FormSubmission>>(`forms/${formId}/submissions`, params);
}

// Course Sections & Lessons
export async function listCourseSections(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<CourseSection>>("course_sections", params);
}

export async function getCourseSection(id: number) {
  return circleAdmin.get<CourseSection>(`course_sections/${id}`);
}

export async function createCourseSection(data: Record<string, unknown>) {
  return circleAdmin.post<CourseSection>("course_sections", data);
}

export async function updateCourseSection(id: number, data: Record<string, unknown>) {
  return circleAdmin.put<CourseSection>(`course_sections/${id}`, data);
}

export async function deleteCourseSection(id: number) {
  return circleAdmin.delete(`course_sections/${id}`);
}

export async function listCourseLessons(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<CourseLesson>>("course_lessons", params);
}

export async function getCourseLesson(id: number) {
  return circleAdmin.get<CourseLesson>(`course_lessons/${id}`);
}

export async function createCourseLesson(data: Record<string, unknown>) {
  return circleAdmin.post<CourseLesson>("course_lessons", data);
}

export async function updateCourseLesson(id: number, data: Record<string, unknown>) {
  return circleAdmin.put<CourseLesson>(`course_lessons/${id}`, data);
}

export async function deleteCourseLesson(id: number) {
  return circleAdmin.delete(`course_lessons/${id}`);
}

// Live Rooms
export async function listLiveRooms(params?: Record<string, string | number>) {
  return circleAdmin.get<PaginatedResponse<LiveRoom>>("live/rooms", params);
}

export async function getLiveRoomTranscripts(roomId: number) {
  return circleAdmin.get<unknown>(`live/rooms/${roomId}/transcripts`);
}

// Messages
export async function createMessage(data: {
  rich_text_body: Record<string, unknown>;
  user_email?: string;
  user_emails?: string[];
}) {
  return circleAdmin.post<Message>("messages", data);
}

// Chat Preferences
export async function updateChatPreferences(data: {
  messaging_enabled?: boolean;
  group_messaging_enabled?: boolean;
  voice_messages_enabled?: boolean;
  member_to_member_messaging_enabled?: boolean;
}) {
  return circleAdmin.put("chat_preferences", data);
}
