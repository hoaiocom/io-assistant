"use client";

import Link from "next/link";
import useSWR from "swr";
import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CourseSpace {
  id: number;
  name: string;
  slug: string;
  cover_image_url?: string | null;
  space_type: string;
  space_group_name?: string;
  emoji?: string | null;
  is_member?: boolean;
}

export default function CoursesPage() {
  const { data, isLoading } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
  });

  const spaces: CourseSpace[] = (
    Array.isArray(data) ? data : data?.records || []
  ).filter((s: { space_type: string }) => s.space_type === "course");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Courses</h1>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((course) => (
            <Link
              key={course.id}
              href={`/community/spaces/${course.id}`}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm"
            >
              {course.cover_image_url ? (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted/50">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  {course.emoji && <span className="text-lg">{course.emoji}</span>}
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {course.name}
                  </h3>
                </div>
                {course.space_group_name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.space_group_name}
                  </p>
                )}
                <div className="mt-2">
                  {course.is_member ? (
                    <Badge variant="secondary" className="text-[10px]">Enrolled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">View course</Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
