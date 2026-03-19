// Circle API shared types

export interface PaginatedResponse<T> {
  page: number;
  per_page: number;
  has_next_page: boolean;
  count: number;
  page_count: number;
  records: T[];
}

export interface CircleErrorResponse {
  success: false;
  message: string;
  error_details?: Record<string, unknown>;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  locale: string;
  is_private: boolean;
  allow_signups_to_public_community: boolean;
  weekly_digest_enabled: boolean;
  prefs: {
    brand_color?: string;
    brand_text_color?: string;
    has_posts?: boolean;
    has_spaces?: boolean;
  };
  community_setting?: {
    ios_app_enabled?: boolean;
    deactivate_account_enabled?: boolean;
  };
}

export interface CommunityMember {
  id: number;
  user_id: number;
  community_id: number;
  first_name: string | null;
  last_name: string | null;
  name: string;
  email: string;
  headline: string | null;
  avatar_url: string | null;
  profile_url: string;
  public_uid: string;
  active: boolean;
  accepted_invitation: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  profile_confirmed_at: string | null;
  sso_provider_user_id: string | null;
  posts_count: number;
  comments_count: number;
  activity_score: number;
  member_tags: MemberTag[];
  profile_fields?: Record<string, unknown>;
  flattened_profile_fields?: Record<string, unknown>;
  gamification_stats?: {
    points: number;
    level: number;
    level_name: string;
  };
}

export interface MemberTag {
  id: number;
  name: string;
  slug: string;
  body: string | null;
  community_id: number;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: number;
  name: string;
  slug: string;
  url: string;
  space_type: "basic" | "event" | "members" | "image" | "course" | "chat";
  community_id: number;
  is_private: boolean;
  is_post_disabled: boolean;
  display_view: string;
  cover_image_url: string | null;
  space_group_id: number | null;
  post_ids: number[];
  topics: Topic[];
}

export interface SpaceGroup {
  id: number;
  name: string;
  slug: string;
  community_id: number;
  space_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  name: string;
  slug: string;
  url: string;
  status: "published" | "draft";
  body: string;
  tiptap_body: Record<string, unknown> | null;
  space_id: number;
  space_name: string;
  space_slug: string;
  user_id: number;
  user_email: string;
  user_name: string;
  user_avatar_url: string | null;
  comments_count: number;
  likes_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_image_url: string | null;
  is_comments_enabled: boolean;
  is_comments_closed: boolean;
  is_liking_enabled: boolean;
  flagged_for_approval_at: string | null;
  topics: Topic[];
}

export interface Comment {
  id: number;
  body: string;
  tiptap_body: Record<string, unknown> | null;
  post_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar_url: string | null;
  parent_comment_id: number | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  space_id: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  name: string;
  slug: string;
  url: string;
  space_id: number;
  body: string;
  tiptap_body: Record<string, unknown> | null;
  status: string;
  event_setting_attributes: {
    start_date?: string;
    end_date?: string;
    location?: string;
    location_type?: string;
    virtual_location_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: number;
  community_member_id: number;
  event_id: number;
  rsvp_status: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface FlaggedContent {
  id: number;
  content_id: number;
  content_type: string;
  status: "inbox" | "approved" | "rejected";
  reported_reason_type: string;
  reported_reason_body: string | null;
  created_at: string;
  updated_at: string;
  flagged_contentable?: Post | Comment;
  reporter?: { name: string; email: string };
}

export interface CommunitySegment {
  id: number;
  title: string;
  rules: Record<string, unknown>;
  visible: boolean;
  audience_count: number;
  created_at: string;
  updated_at: string;
}

export interface AccessGroup {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationLink {
  id: number;
  token: string;
  url: string;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface ProfileField {
  id: number;
  label: string;
  field_type: string;
  key: string;
  choices: string[];
  required: boolean;
  pages: string[];
}

export interface Form {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: number;
  form_id: number;
  community_member_id: number;
  answers: Record<string, unknown>;
  created_at: string;
}

export interface LeaderboardEntry {
  community_member_id: number;
  name: string;
  avatar_url: string | null;
  points: number;
  level: number;
  level_name: string;
  rank: number;
}

export interface CourseSection {
  id: number;
  name: string;
  position: number;
  space_id: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: number;
  name: string;
  position: number;
  section_id: number;
  space_id: number;
  body: string | null;
  tiptap_body: Record<string, unknown> | null;
  published: boolean;
}

// Headless API course types (member-facing)

export interface HeadlessLessonProgress {
  status: "incomplete" | "completed";
  needs_to_complete_previous_lesson?: boolean;
}

export interface HeadlessCourseLessonSummary {
  id: number;
  name: string;
  is_featured_media_enabled: boolean;
  featured_media_duration: number | null;
  dripped_at: string | null;
  progress: HeadlessLessonProgress;
}

export interface HeadlessCourseSection {
  id: number;
  name: string;
  drip_delay: number;
  notify_students_enabled: boolean;
  is_dripped: boolean;
  dripped_at: string | null;
  lessons: HeadlessCourseLessonSummary[];
}

export interface HeadlessCourseLesson {
  id: number;
  name: string;
  enforce_featured_media_completion: boolean;
  autocomplete_on_featured_media_completion: boolean;
  is_comments_enabled: boolean;
  is_featured_media_enabled: boolean;
  featured_media: {
    filename: string;
    content_type: string;
    metadata: {
      identified?: boolean;
      width?: number;
      height?: number;
      duration?: number;
      analyzed?: boolean;
    };
    byte_size: number;
    type: string;
    url: string;
    webvtt_file_url: string | null;
    chapters_url: string | null;
    preview_thumbnails_url: string | null;
    image_variants: {
      thumbnail: string | null;
    };
    signed_id: string;
  } | null;
  is_featured_media_download_enabled: boolean;
  space: {
    id: number;
    name: string;
    slug: string;
  };
  bookmark_id: number | null;
  chat_room_uuid: string | null;
  rich_text_body: {
    body: Record<string, unknown>;
    attachments?: unknown[];
    inline_attachments?: unknown[];
    sgids_to_object_map?: Record<string, unknown>;
    format?: string;
    community_members?: unknown[];
    entities?: unknown[];
    group_mentions?: unknown[];
    polls?: unknown[];
  } | null;
  featured_media_duration: number | null;
  section_id: number;
  dripped_at: string | null;
  progress: HeadlessLessonProgress;
  lesson_label?: string;
  section_label?: string;
}

export interface SpaceMember {
  id: number;
  community_member_id: number;
  space_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface TaggedMember {
  id: number;
  community_member_id: number;
  member_tag_id: number;
  community_member: CommunityMember;
}

export interface LiveRoom {
  id: number;
  name: string;
  slug: string;
  status: string;
}

export interface Message {
  id: number;
  rich_text_body: Record<string, unknown>;
  user_email: string;
  created_at: string;
}
