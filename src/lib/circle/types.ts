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
