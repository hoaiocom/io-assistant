"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { BookOpen, Lock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CourseSpace {
  id: number;
  name: string;
  slug: string;
  cover_image_url?: string | null;
  cover_image?: string | null;
  space_type: string;
  space_group_name?: string;
  emoji?: string | null;
  is_private: boolean;
  is_member?: boolean;
  members_count?: number;
  course_topics?: Array<{ id: number; name: string }>;
}

type CourseTopicsResponse = {
  records?: Array<{ id: number; name: string; admin_only?: boolean }>;
};

function getCoverUrl(space: CourseSpace): string | null {
  const raw = space.cover_image_url || null;
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return null;
}

function CourseCover({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  if (!src || (failed && proxyFailed)) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-muted/60">
        <BookOpen className="h-10 w-10 text-muted-foreground/25" />
      </div>
    );
  }

  const proxiedSrc = `/api/community/image-proxy?url=${encodeURIComponent(src)}`;
  const effectiveSrc = failed ? proxiedSrc : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      onError={() => {
        if (!failed) {
          setFailed(true);
        } else {
          setProxyFailed(true);
        }
      }}
    />
  );
}

export default function CoursesPage() {
  const [tab, setTab] = useState<"all" | "my">("all");
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  const { data, isLoading } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
  });

  const { data: topicsData } = useSWR<CourseTopicsResponse>(
    "/api/community/course-topics?per_page=200",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  );

  const topics = topicsData?.records || [];

  const allCourses: CourseSpace[] = (
    Array.isArray(data) ? data : data?.records || []
  ).filter((s: { space_type: string }) => s.space_type === "course");

  const courses = useMemo(() => {
    const base = tab === "my" ? allCourses.filter((c) => c.is_member) : allCourses;
    if (!selectedTopics.length) return base;
    return base.filter((c) => {
      const ids = (c.course_topics || []).map((t) => t.id);
      if (!ids.length) return false;
      return selectedTopics.every((id) => ids.includes(id));
    });
  }, [allCourses, selectedTopics, tab]);

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId],
    );
  };

  const topicsAvailableOnCourses = allCourses.some(
    (c) => Array.isArray(c.course_topics) && c.course_topics.length > 0,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Học tập</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setTab("all")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "all"
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          All courses
        </button>
        <button
          onClick={() => setTab("my")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "my"
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          My courses
        </button>
      </div>

      {topics.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Topics</div>
            {selectedTopics.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTopics([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {topics.map((t) => {
              const active = selectedTopics.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className="shrink-0"
                >
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="h-8 rounded-full px-3 text-xs font-medium"
                  >
                    {t.name}
                  </Badge>
                </button>
              );
            })}
          </div>
          {selectedTopics.length > 0 && !topicsAvailableOnCourses && (
            <div className="mt-2 text-xs text-muted-foreground">
              Topic filtering depends on courses including topic metadata in the spaces response.
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {tab === "my"
              ? "You haven't enrolled in any courses yet."
              : "No courses available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {courses.map((course) => {
            const coverUrl = getCoverUrl(course);

            return (
              <Link
                key={course.id}
                href={`/community/spaces/${course.id}`}
                className="group"
              >
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow group-hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <CourseCover src={coverUrl} alt={course.name} />
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {course.emoji && (
                      <span className="mr-1">{course.emoji}</span>
                    )}
                    {course.name}
                  </h3>

                  {course.space_group_name && (
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {course.space_group_name}
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {course.members_count != null &&
                      course.members_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.members_count}
                        </span>
                      )}
                    {course.is_private && (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Private space
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
