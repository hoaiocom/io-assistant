"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Archive,
  Copy,
  Eye,
  FileText,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { safeFormat } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";


interface AccessGroup {
  id: number;
  name: string;
  description: string | null;
  status: string;
}

interface ProfileField {
  id: number;
  label: string;
  field_type: string;
  key: string;
}

interface Form {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface CourseSection {
  id: number;
  name: string;
  position: number;
  space_id: number;
}

interface CourseLesson {
  id: number;
  name: string;
  position: number;
  section_id: number;
  space_id: number;
  published: boolean;
}

export default function SettingsPage() {
  // Access Groups
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Profile Fields
  const [createFieldOpen, setCreateFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [creatingField, setCreatingField] = useState(false);

  // Forms
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [creatingForm, setCreatingForm] = useState(false);

  // Courses
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionSpaceId, setNewSectionSpaceId] = useState("");
  const [creatingSec, setCreatingSec] = useState(false);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonSectionId, setNewLessonSectionId] = useState("");
  const [newLessonSpaceId, setNewLessonSpaceId] = useState("");
  const [creatingLesson, setCreatingLesson] = useState(false);

  const { data: community, isLoading: loadingCommunity } = useSWR(
    "/api/community"
  );
  const {
    data: accessGroups,
    isLoading: loadingGroups,
    mutate: mutateGroups,
  } = useSWR("/api/access-groups");
  const {
    data: profileFields,
    isLoading: loadingFields,
    mutate: mutateFields,
  } = useSWR("/api/profile-fields");
  const {
    data: forms,
    isLoading: loadingForms,
    mutate: mutateForms,
  } = useSWR("/api/forms");
  const {
    data: sections,
    isLoading: loadingSections,
    mutate: mutateSections,
  } = useSWR("/api/courses/sections");
  const {
    data: lessons,
    isLoading: loadingLessons,
    mutate: mutateLessons,
  } = useSWR("/api/courses/lessons");
  const { data: spaces } = useSWR("/api/spaces");

  const groupList: AccessGroup[] = accessGroups?.records ?? accessGroups ?? [];
  const fieldList: ProfileField[] = profileFields?.records ?? profileFields ?? [];
  const formList: Form[] = forms?.records ?? forms ?? [];
  const sectionList: CourseSection[] = sections?.records ?? sections ?? [];
  const lessonList: CourseLesson[] = lessons?.records ?? lessons ?? [];
  const spaceList: { id: number; name: string }[] = spaces?.records ?? spaces ?? [];

  // Access Groups CRUD
  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await fetch("/api/access-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Access group created");
      setCreateGroupOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      mutateGroups();
    } catch {
      toast.error("Failed to create access group");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleArchiveGroup(id: number) {
    try {
      const res = await fetch(`/api/access-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Access group archived");
      mutateGroups();
    } catch {
      toast.error("Failed to archive");
    }
  }

  // Profile Fields CRUD
  async function handleCreateField() {
    if (!newFieldLabel.trim()) return;
    setCreatingField(true);
    try {
      const res = await fetch("/api/profile-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newFieldLabel,
          field_type: newFieldType,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Profile field created");
      setCreateFieldOpen(false);
      setNewFieldLabel("");
      setNewFieldType("text");
      mutateFields();
    } catch {
      toast.error("Failed to create profile field");
    } finally {
      setCreatingField(false);
    }
  }

  async function handleArchiveField(id: number) {
    try {
      const res = await fetch(`/api/profile-fields/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Profile field archived");
      mutateFields();
    } catch {
      toast.error("Failed to archive");
    }
  }

  // Forms CRUD
  async function handleCreateForm() {
    if (!newFormName.trim()) return;
    setCreatingForm(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFormName }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Form created");
      setCreateFormOpen(false);
      setNewFormName("");
      mutateForms();
    } catch {
      toast.error("Failed to create form");
    } finally {
      setCreatingForm(false);
    }
  }

  async function handleDeleteForm(id: number) {
    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Form deleted");
      mutateForms();
    } catch {
      toast.error("Failed to delete form");
    }
  }

  async function handleDuplicateForm(id: number) {
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Form duplicated");
      mutateForms();
    } catch {
      toast.error("Failed to duplicate form");
    }
  }

  // Courses CRUD
  async function handleCreateSection() {
    if (!newSectionName.trim() || !newSectionSpaceId) return;
    setCreatingSec(true);
    try {
      const res = await fetch("/api/courses/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSectionName,
          space_id: Number(newSectionSpaceId),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Section created");
      setCreateSectionOpen(false);
      setNewSectionName("");
      setNewSectionSpaceId("");
      mutateSections();
    } catch {
      toast.error("Failed to create section");
    } finally {
      setCreatingSec(false);
    }
  }

  async function handleDeleteSection(id: number) {
    try {
      const res = await fetch(`/api/courses/sections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Section deleted");
      mutateSections();
    } catch {
      toast.error("Failed to delete section");
    }
  }

  async function handleCreateLesson() {
    if (!newLessonName.trim() || !newLessonSectionId || !newLessonSpaceId)
      return;
    setCreatingLesson(true);
    try {
      const res = await fetch("/api/courses/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLessonName,
          section_id: Number(newLessonSectionId),
          space_id: Number(newLessonSpaceId),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Lesson created");
      setCreateLessonOpen(false);
      setNewLessonName("");
      setNewLessonSectionId("");
      setNewLessonSpaceId("");
      mutateLessons();
    } catch {
      toast.error("Failed to create lesson");
    } finally {
      setCreatingLesson(false);
    }
  }

  async function handleDeleteLesson(id: number) {
    try {
      const res = await fetch(`/api/courses/lessons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Lesson deleted");
      mutateLessons();
    } catch {
      toast.error("Failed to delete lesson");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Community configuration and management
        </p>
      </div>

      <Tabs defaultValue="community">
        <TabsList className="flex-wrap">
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="access-groups">Access Groups</TabsTrigger>
          <TabsTrigger value="profile-fields">Profile Fields</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        {/* Community Tab */}
        <TabsContent value="community" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Information</CardTitle>
              <CardDescription>
                Read-only view of your community settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCommunity ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </div>
              ) : community ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">
                        {community.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Slug</p>
                      <p className="text-sm font-medium">
                        {community.slug}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Locale</p>
                      <p className="text-sm font-medium">
                        {community.locale}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Visibility
                      </p>
                      <Badge variant={community.is_private ? "secondary" : "default"}>
                        {community.is_private ? "Private" : "Public"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Allow Signups
                      </p>
                      <Badge
                        variant={
                          community.allow_signups_to_public_community
                            ? "default"
                            : "secondary"
                        }
                        className={
                          community.allow_signups_to_public_community
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : ""
                        }
                      >
                        {community.allow_signups_to_public_community
                          ? "Yes"
                          : "No"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Weekly Digest
                      </p>
                      <Badge
                        variant={
                          community.weekly_digest_enabled
                            ? "default"
                            : "secondary"
                        }
                        className={
                          community.weekly_digest_enabled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : ""
                        }
                      >
                        {community.weekly_digest_enabled
                          ? "Enabled"
                          : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Unable to load community data
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Groups Tab */}
        <TabsContent value="access-groups" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage access group permissions
            </p>
            <Dialog
              open={createGroupOpen}
              onOpenChange={setCreateGroupOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create access group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Name</Label>
                    <Input
                      id="group-name"
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-desc">Description</Label>
                    <Input
                      id="group-desc"
                      placeholder="Optional description"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateGroupOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={creatingGroup || !newGroupName.trim()}
                  >
                    {creatingGroup ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingGroups ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No access groups yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupList.map((group) => (
                <Card key={group.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        group.status === "active" ? "default" : "secondary"
                      }
                      className={
                        group.status === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {group.status}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleArchiveGroup(group.id)}
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profile Fields Tab */}
        <TabsContent value="profile-fields" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Custom member profile fields
            </p>
            <Dialog
              open={createFieldOpen}
              onOpenChange={setCreateFieldOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Field
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create profile field</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-label">Label</Label>
                    <Input
                      id="field-label"
                      placeholder="Field label"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newFieldType}
                      onValueChange={setNewFieldType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateFieldOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateField}
                    disabled={creatingField || !newFieldLabel.trim()}
                  >
                    {creatingField ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingFields ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : fieldList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No profile fields yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fieldList.map((field) => (
                <Card key={field.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Key: {field.key}
                      </p>
                    </div>
                    <Badge variant="outline">{field.field_type}</Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleArchiveField(field.id)}
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Community forms and submissions
            </p>
            <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Form
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create form</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="form-name">Name</Label>
                    <Input
                      id="form-name"
                      placeholder="Form name"
                      value={newFormName}
                      onChange={(e) => setNewFormName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateForm}
                    disabled={creatingForm || !newFormName.trim()}
                  >
                    {creatingForm ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingForms ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : formList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No forms yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formList.map((form) => (
                <Card key={form.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{form.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created{" "}
                        {safeFormat(form.created_at, "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        form.status === "active" ? "default" : "secondary"
                      }
                      className={
                        form.status === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {form.status}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View Submissions"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicateForm(form.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteForm(form.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6 mt-6">
          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sections</h3>
              <Dialog
                open={createSectionOpen}
                onOpenChange={setCreateSectionOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create course section</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="sec-name">Name</Label>
                      <Input
                        id="sec-name"
                        placeholder="Section name"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Space</Label>
                      <Select
                        value={newSectionSpaceId}
                        onValueChange={setNewSectionSpaceId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaceList.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateSectionOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSection}
                      disabled={
                        creatingSec ||
                        !newSectionName.trim() ||
                        !newSectionSpaceId
                      }
                    >
                      {creatingSec ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingSections ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sectionList.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No course sections yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sectionList.map((sec) => (
                  <Card key={sec.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{sec.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Position: {sec.position}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteSection(sec.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lessons</h3>
              <Dialog
                open={createLessonOpen}
                onOpenChange={setCreateLessonOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create course lesson</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="lesson-name">Name</Label>
                      <Input
                        id="lesson-name"
                        placeholder="Lesson name"
                        value={newLessonName}
                        onChange={(e) => setNewLessonName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select
                        value={newLessonSectionId}
                        onValueChange={setNewLessonSectionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionList.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Space</Label>
                      <Select
                        value={newLessonSpaceId}
                        onValueChange={setNewLessonSpaceId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaceList.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateLessonOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateLesson}
                      disabled={
                        creatingLesson ||
                        !newLessonName.trim() ||
                        !newLessonSectionId ||
                        !newLessonSpaceId
                      }
                    >
                      {creatingLesson ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingLessons ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : lessonList.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No course lessons yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {lessonList.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{lesson.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Position: {lesson.position}
                        </p>
                      </div>
                      <Badge
                        variant={lesson.published ? "default" : "secondary"}
                        className={
                          lesson.published
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : ""
                        }
                      >
                        {lesson.published ? "Published" : "Draft"}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
