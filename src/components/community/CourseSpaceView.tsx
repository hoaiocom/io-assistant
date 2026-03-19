"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from "swr";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  HeadlessCourseSection,
  HeadlessCourseLessonSummary,
} from "@/lib/circle/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ExternalImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  if (failed && proxyFailed) return null;

  const proxiedSrc = `/api/community/image-proxy?url=${encodeURIComponent(src)}`;
  const effectiveSrc = failed ? proxiedSrc : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (!failed) setFailed(true);
        else setProxyFailed(true);
      }}
    />
  );
}

interface SpaceData {
  id: number;
  name: string;
  slug: string;
  emoji?: string | null;
  space_type: string;
  is_private: boolean;
  is_member?: boolean;
  cover_image_url?: string | null;
  cover_image?: string | null;
  space_group_name?: string;
  policies?: { can_create_post?: boolean };
}

interface ProfileData {
  name?: string;
  first_name?: string;
  avatar_url?: string | null;
}

interface CourseSpaceViewProps {
  space: SpaceData;
  spaceId: string;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDurationHuman(seconds: number): string {
  if (seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

function getSectionDuration(section: HeadlessCourseSection): number {
  return section.lessons.reduce(
    (sum, l) => sum + (l.featured_media_duration || 0),
    0,
  );
}

function LessonStatusIcon({
  lesson,
  onToggle,
}: {
  lesson: HeadlessCourseLessonSummary;
  onToggle: (lessonId: number, currentStatus: string) => void;
}) {
  const isCompleted = lesson.progress?.status === "completed";
  const isLocked = lesson.progress?.needs_to_complete_previous_lesson;

  if (isLocked) {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground/40">
        <Lock className="h-4 w-4" />
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(lesson.id, lesson.progress?.status || "incomplete");
      }}
      className="group/check flex h-6 w-6 shrink-0 items-center justify-center"
    >
      {isCompleted ? (
        <CheckCircle2 className="h-[22px] w-[22px] text-green-600 transition-colors group-hover/check:text-green-700" />
      ) : (
        <Circle className="h-[22px] w-[22px] text-muted-foreground/25 transition-colors group-hover/check:text-primary/50" />
      )}
    </button>
  );
}

function CourseSection({
  section,
  isExpanded,
  onToggleExpand,
  onLessonClick,
  onToggleProgress,
}: {
  section: HeadlessCourseSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLessonClick: (lessonId: number) => void;
  onToggleProgress: (lessonId: number, currentStatus: string) => void;
}) {
  const totalCount = section.lessons.length;
  const sectionDuration = getSectionDuration(section);

  return (
    <div className="border-b last:border-b-0">
      {/* Section header */}
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        )}
        <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
          <h3 className="text-sm font-bold truncate">{section.name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {totalCount} {totalCount === 1 ? "lesson" : "lessons"}
            {sectionDuration > 0 && (
              <> &bull; {formatDurationHuman(sectionDuration)}</>
            )}
          </span>
        </div>
      </button>

      {/* Lessons */}
      {isExpanded && (
        <div className="pb-1">
          {section.lessons.map((lesson) => {
            const isCompleted = lesson.progress?.status === "completed";
            const isLocked = lesson.progress?.needs_to_complete_previous_lesson;
            const duration = lesson.featured_media_duration;

            return (
              <button
                key={lesson.id}
                onClick={() => !isLocked && onLessonClick(lesson.id)}
                disabled={!!isLocked}
                className={cn(
                  "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
                  isLocked
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-muted/40 cursor-pointer",
                )}
              >
                <LessonStatusIcon lesson={lesson} onToggle={onToggleProgress} />
                <span
                  className={cn(
                    "flex-1 text-sm leading-snug",
                    isCompleted
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {lesson.name}
                </span>
                {duration != null && duration > 0 && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDuration(duration)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CourseSpaceView({ space, spaceId }: CourseSpaceViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

  const {
    data: sections,
    isLoading: sectionsLoading,
    mutate: mutateSections,
  } = useSWR<HeadlessCourseSection[]>(
    `/api/community/courses/${spaceId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: profile } = useSWR<ProfileData>(
    "/api/community/profile",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: lessonData, isLoading: lessonLoading } = useSWR(
    selectedLessonId
      ? `/api/community/courses/${spaceId}/lessons/${selectedLessonId}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const stats = useMemo(() => {
    if (!sections)
      return { completed: 0, total: 0, percent: 0, modules: 0, totalDuration: 0 };
    const allLessons = sections.flatMap((s) => s.lessons);
    const completed = allLessons.filter(
      (l) => l.progress?.status === "completed",
    ).length;
    const total = allLessons.length;
    const totalDuration = allLessons.reduce(
      (sum, l) => sum + (l.featured_media_duration || 0),
      0,
    );
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      modules: sections.length,
      totalDuration,
    };
  }, [sections]);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (sections && !initialized) {
      setExpandedSections(new Set(sections.map((s) => s.id)));
      setInitialized(true);
    }
  }, [sections, initialized]);

  const toggleSection = useCallback((sectionId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleAllSections = useCallback(() => {
    if (!sections) return;
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(sections.map((s) => s.id)));
    }
    setAllExpanded(!allExpanded);
  }, [sections, allExpanded]);

  const handleToggleProgress = useCallback(
    async (lessonId: number, currentStatus: string) => {
      const newStatus =
        currentStatus === "completed" ? "incomplete" : "completed";
      try {
        await fetch(
          `/api/community/courses/${spaceId}/lessons/${lessonId}/progress`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        );
        mutateSections();
      } catch {
        // Will re-sync on next fetch
      }
    },
    [spaceId, mutateSections],
  );

  const findNextIncompleteLesson = useCallback(() => {
    if (!sections) return null;
    for (const section of sections) {
      for (const lesson of section.lessons) {
        if (lesson.progress?.status !== "completed") {
          return lesson.id;
        }
      }
    }
    return null;
  }, [sections]);

  const handleContinue = useCallback(() => {
    const nextId = findNextIncompleteLesson();
    if (nextId) {
      setSelectedLessonId(nextId);
    }
  }, [findNextIncompleteLesson]);

  if (selectedLessonId) {
    return (
      <LessonDetailView
        spaceId={spaceId}
        spaceName={space.name}
        lessonData={lessonData}
        isLoading={lessonLoading}
        onBack={() => setSelectedLessonId(null)}
        onToggleProgress={handleToggleProgress}
      />
    );
  }

  const firstName = profile?.first_name || profile?.name?.split(" ")[0] || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {firstName}.
        </h1>
        {stats.total > 0 && (
          <Button
            onClick={handleContinue}
            className="shrink-0 rounded-full px-6"
          >
            Continue
          </Button>
        )}
      </div>

      {/* Progress */}
      {sectionsLoading ? (
        <div className="mb-10 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : sections && stats.total > 0 ? (
        <div className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Progress</h2>
          <div className="rounded-xl border bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Completed {stats.completed} of {stats.total} lessons
              </span>
              <span className="font-semibold tabular-nums">
                {stats.percent}%
              </span>
            </div>
            <Progress value={stats.percent} className="h-2" />
          </div>
        </div>
      ) : null}

      {/* Content */}
      {sectionsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : sections ? (
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Content</h2>
              <p className="text-sm text-muted-foreground">
                {stats.modules}{" "}
                {stats.modules === 1 ? "module" : "modules"} &bull;{" "}
                {stats.total}{" "}
                {stats.total === 1 ? "lesson" : "lessons"}
                {stats.totalDuration > 0 && (
                  <> &bull; {formatDurationHuman(stats.totalDuration)}</>
                )}
              </p>
            </div>
            {sections.length > 1 && (
              <button
                onClick={toggleAllSections}
                className="mt-1 shrink-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {allExpanded ? "Collapse all modules" : "Expand all modules"}
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            {sections.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No content available yet.
                </p>
              </div>
            ) : (
              sections.map((section) => (
                <CourseSection
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggleExpand={() => toggleSection(section.id)}
                  onLessonClick={setSelectedLessonId}
                  onToggleProgress={handleToggleProgress}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-muted-foreground">
            Unable to load course content. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}

export function CourseLockedView({
  space,
  onJoin,
}: {
  space: SpaceData;
  onJoin: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {space.cover_image_url && (
        <div className="relative -mx-4 -mt-6 mb-5 aspect-[3/1] overflow-hidden sm:-mx-6 sm:rounded-xl">
          <ExternalImage
            src={space.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="py-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          {space.emoji && <span className="text-2xl">{space.emoji}</span>}
          <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
        </div>

        {space.space_group_name && (
          <p className="mb-2 text-sm text-muted-foreground">
            {space.space_group_name}
          </p>
        )}

        <div className="mb-6 flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            {space.is_private ? "Private course" : "Course"}
          </Badge>
        </div>

        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
          Join this course to access the content and track your progress.
        </p>

        <Button onClick={onJoin} size="lg" className="rounded-full">
          Enroll in this course
        </Button>
      </div>
    </div>
  );
}

function LessonDetailView({
  spaceId,
  spaceName,
  lessonData,
  isLoading,
  onBack,
  onToggleProgress,
}: {
  spaceId: string;
  spaceName: string;
  lessonData: Record<string, unknown> | null;
  isLoading: boolean;
  onBack: () => void;
  onToggleProgress: (lessonId: number, currentStatus: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-2 h-7 w-64" />
        <Skeleton className="mb-6 h-4 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Button>
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-muted-foreground">Unable to load lesson.</p>
        </div>
      </div>
    );
  }

  const lesson = lessonData as unknown as {
    id: number;
    name: string;
    progress?: { status: string };
    rich_text_body?: { body?: Record<string, unknown> };
    featured_media?: {
      url?: string;
      content_type?: string;
      type?: string;
    } | null;
    is_featured_media_enabled?: boolean;
  };

  const isCompleted = lesson.progress?.status === "completed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        {spaceName}
      </Button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {lesson.name}
      </h1>

      {lesson.is_featured_media_enabled && lesson.featured_media?.url && (
        <div className="mb-6 overflow-hidden rounded-xl border">
          {lesson.featured_media.content_type?.startsWith("video/") ? (
            <video
              src={lesson.featured_media.url}
              controls
              className="w-full"
              controlsList="nodownload"
            />
          ) : lesson.featured_media.content_type?.startsWith("audio/") ? (
            <div className="p-6">
              <audio
                src={lesson.featured_media.url}
                controls
                className="w-full"
              />
            </div>
          ) : lesson.featured_media.content_type?.startsWith("image/") ? (
            <img src={lesson.featured_media.url} alt="" className="w-full" />
          ) : null}
        </div>
      )}

      {lesson.rich_text_body?.body && (
        <div className="prose prose-sm max-w-none mb-6 rounded-xl border bg-card p-5">
          <TiptapRenderer content={lesson.rich_text_body.body} />
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <button
          onClick={() =>
            onToggleProgress(
              lesson.id,
              lesson.progress?.status || "incomplete",
            )
          }
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
            isCompleted
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-muted/50 hover:bg-muted",
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
          )}
          <span className="text-sm font-medium">
            {isCompleted ? "Completed" : "Mark as complete"}
          </span>
        </button>
      </div>
    </div>
  );
}

function TiptapRenderer({ content }: { content: Record<string, unknown> }) {
  const renderNode = (
    node: Record<string, unknown>,
    index: number,
  ): React.ReactNode => {
    const type = node.type as string;
    const children = node.content as Record<string, unknown>[] | undefined;
    const text = node.text as string | undefined;
    const marks = node.marks as Array<{
      type: string;
      attrs?: Record<string, unknown>;
    }> | undefined;

    if (type === "text" && text) {
      let element: React.ReactNode = text;
      if (marks) {
        for (const mark of marks) {
          if (mark.type === "bold") {
            element = <strong key={index}>{element}</strong>;
          } else if (mark.type === "italic") {
            element = <em key={index}>{element}</em>;
          } else if (mark.type === "link") {
            element = (
              <a
                key={index}
                href={mark.attrs?.href as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {element}
              </a>
            );
          } else if (mark.type === "code") {
            element = (
              <code
                key={index}
                className="rounded bg-muted px-1.5 py-0.5 text-xs"
              >
                {element}
              </code>
            );
          }
        }
      }
      return element;
    }

    const childElements = children?.map((child, i) => renderNode(child, i));

    switch (type) {
      case "doc":
        return <div key={index}>{childElements}</div>;
      case "paragraph":
        return <p key={index}>{childElements}</p>;
      case "heading": {
        const level = (node.attrs as Record<string, unknown>)?.level as number;
        if (level === 1) return <h1 key={index}>{childElements}</h1>;
        if (level === 2) return <h2 key={index}>{childElements}</h2>;
        if (level === 3) return <h3 key={index}>{childElements}</h3>;
        if (level === 4) return <h4 key={index}>{childElements}</h4>;
        if (level === 5) return <h5 key={index}>{childElements}</h5>;
        return <h6 key={index}>{childElements}</h6>;
      }
      case "bulletList":
        return <ul key={index}>{childElements}</ul>;
      case "orderedList":
        return <ol key={index}>{childElements}</ol>;
      case "listItem":
        return <li key={index}>{childElements}</li>;
      case "blockquote":
        return <blockquote key={index}>{childElements}</blockquote>;
      case "codeBlock":
        return (
          <pre key={index}>
            <code>{childElements}</code>
          </pre>
        );
      case "hardBreak":
        return <br key={index} />;
      case "horizontalRule":
        return <hr key={index} />;
      case "image": {
        const attrs = node.attrs as Record<string, unknown>;
        return (
          <img
            key={index}
            src={attrs?.src as string}
            alt={(attrs?.alt as string) || ""}
            className="rounded-lg"
          />
        );
      }
      case "mention":
        return (
          <span key={index} className="font-medium text-primary">
            @mention
          </span>
        );
      default:
        return childElements ? <div key={index}>{childElements}</div> : null;
    }
  };

  return <>{renderNode(content, 0)}</>;
}
