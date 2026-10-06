import { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Video,
  Clock,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  Filter,
  PlayCircle,
  Eye,
  Edit3,
  Star,
  Layers,
  Save,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ADMIN_COURSES_CATALOG,
  type AdminCourse,
  type CourseLesson,
} from "@/data/coursesCatalog";

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<AdminCourse[]>(ADMIN_COURSES_CATALOG);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Database persistence state
  const [savingDb, setSavingDb] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [activeCourseForLessons, setActiveCourseForLessons] = useState<AdminCourse | null>(null);
  const [editableLessons, setEditableLessons] = useState<CourseLesson[]>([]);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New course form state
  const [newCourse, setNewCourse] = useState<Partial<AdminCourse>>({
    title: "",
    slug: "",
    category: "",
    duration: "1h 00m",
    description: "",
    status: "published",
    rating: 5.0,
    lessons: [],
  });

  useEffect(() => {
    loadCoursesFromDb();
  }, []);

  async function loadCoursesFromDb() {
    setLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "academy_courses")
        .maybeSingle();

      if (error) throw error;
      if (data?.value?.courses && Array.isArray(data.value.courses) && data.value.courses.length > 0) {
        setCourses(data.value.courses);
      }
    } catch (err) {
      console.warn("Could not load courses from DB, using baseline:", err);
    } finally {
      setLoadingDb(false);
    }
  }

  async function saveAllCoursesToDb(updatedCourses: AdminCourse[]) {
    setSavingDb(true);
    try {
      const { error } = await supabase
        .from("system_configs")
        .upsert({
          key: "academy_courses",
          value: {
            courses: updatedCourses,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setFeedback({ type: "success", text: "Curriculum and video links saved to database successfully!" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to persist courses to database." });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSavingDb(false);
    }
  }

  function extractYouTubeId(urlOrId: string): string {
    if (!urlOrId) return "";
    const trimmed = urlOrId.trim();
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : trimmed;
  }

  // Open lessons modal with copy of lessons
  const handleOpenLessonsModal = (course: AdminCourse) => {
    setActiveCourseForLessons(course);
    setEditableLessons(JSON.parse(JSON.stringify(course.lessons || [])));
  };

  const handleUpdateLesson = (index: number, field: keyof CourseLesson, value: string) => {
    setEditableLessons((prev) => {
      const updated = [...prev];
      if (field === "videoId") {
        updated[index] = { ...updated[index], videoId: extractYouTubeId(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleAddLesson = () => {
    const newLessonId = `${activeCourseForLessons?.id || Date.now()}-${editableLessons.length + 1}`;
    const newLesson: CourseLesson = {
      id: newLessonId,
      title: `Lesson ${editableLessons.length + 1}`,
      duration: "30:00",
      videoId: "",
    };
    setEditableLessons((prev) => [...prev, newLesson]);
  };

  const handleDeleteLesson = (index: number) => {
    setEditableLessons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLessons = async () => {
    if (!activeCourseForLessons) return;
    const updatedCourse: AdminCourse = {
      ...activeCourseForLessons,
      lessons: editableLessons,
      lessonsCount: editableLessons.length,
    };

    const updatedCourses = courses.map((c) =>
      c.id === updatedCourse.id ? updatedCourse : c
    );

    setCourses(updatedCourses);
    setActiveCourseForLessons(null);
    await saveAllCoursesToDb(updatedCourses);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.category));
    return ["All", ...Array.from(set).sort()];
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory =
        selectedCategory === "All" || c.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.lessons.some((l) => l.title.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessonsCount, 0),
    [courses]
  );

  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    const updated = courses.map((c) => (c.id === editingCourse.id ? editingCourse : c));
    setCourses(updated);
    setEditingCourse(null);
    await saveAllCoursesToDb(updated);
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.slug) return;
    const created: AdminCourse = {
      id: String(Date.now()),
      title: newCourse.title.trim(),
      slug: newCourse.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      category: newCourse.category?.trim() || "General Agriculture",
      duration: newCourse.duration || "1h 00m",
      lessonsCount: 0,
      rating: 5.0,
      description: newCourse.description || "",
      status: "published",
      lessons: [],
    };
    const updated = [created, ...courses];
    setCourses(updated);
    setIsCreating(false);
    setNewCourse({
      title: "",
      slug: "",
      category: "",
      duration: "1h 00m",
      description: "",
      status: "published",
      rating: 5.0,
      lessons: [],
    });
    await saveAllCoursesToDb(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            AgroHeal Academy &amp; Curriculum Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Curate learning curricula, practical masterclasses, and editable YouTube video guides for Green Card members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCoursesFromDb}
            disabled={loadingDb || savingDb}
            className="text-xs h-8 border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingDb ? "animate-spin" : ""}`} />
            Reload DB
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => saveAllCoursesToDb(courses)}
            disabled={savingDb}
            className="text-xs h-8 border-primary/40 text-primary hover:bg-primary/10"
          >
            {savingDb ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save All to DB
          </Button>

          <Button
            size="sm"
            className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-8"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Masterclass
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/30 border-red-500/40 text-red-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between border-border bg-card">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Published Masterclasses</p>
            <p className="text-2xl font-bold text-foreground mt-1">{courses.length}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All available in member portal
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border bg-card">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Curriculum Video Lessons</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalLessons}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Video &amp; practical guides</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Video className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border bg-card">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Instructional Categories</p>
            <p className="text-2xl font-bold text-foreground mt-1">{categories.length - 1}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Farming, organics &amp; horticulture</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by course title, category, slug, or lesson topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((c) => (
          <Card
            key={c.id}
            className="p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-all shadow-sm bg-card hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary max-w-[200px] truncate">
                  {c.category}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {c.status === "published" ? "Published" : "Draft"}
                </span>
              </div>

              <h3 className="font-bold text-sm text-foreground mb-1.5 line-clamp-1" title={c.title}>
                {c.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8" title={c.description}>
                {c.description || "Practical masterclass with step-by-step guidance for agricultural success."}
              </p>

              <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-muted/40 rounded-lg text-[11px] text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5" title="Estimated Duration">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{c.duration}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Lessons Count">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{c.lessonsCount} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5" title="Rating">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate">{c.rating} / 5.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span className="truncate max-w-[180px]">/{c.slug}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-primary gap-1 hover:bg-primary/10"
                  onClick={() => handleOpenLessonsModal(c)}
                >
                  <Eye className="w-3 h-3" />
                  View &amp; Edit Lessons ({c.lessonsCount})
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex-1 gap-1 border-border"
                  onClick={() => setEditingCourse(c)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() =>
                    window.open(
                      `https://agroheal.solutions/dashboard/courses/${c.slug}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No courses match your filter</p>
          <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or selecting "All Categories".</p>
        </div>
      )}

      {/* View & Edit Lessons Dialog */}
      <Dialog
        open={Boolean(activeCourseForLessons)}
        onOpenChange={(open) => !open && setActiveCourseForLessons(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col p-4 sm:p-6 bg-card border-border">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  {activeCourseForLessons?.category}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {editableLessons.length} lessons • {activeCourseForLessons?.duration}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddLesson}
                className="text-xs h-7 gap-1 border-primary/40 text-primary hover:bg-primary/10 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lesson
              </Button>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Curriculum &amp; Video Links: {activeCourseForLessons?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add or update YouTube video IDs, duration, and lesson titles. Changes are persisted live to the platform database.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 my-3">
            {editableLessons.length > 0 ? (
              editableLessons.map((lesson: CourseLesson, index: number) => (
                <div
                  key={lesson.id || index}
                  className="p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {index + 1}
                      </span>
                      <Input
                        value={lesson.title}
                        onChange={(e) => handleUpdateLesson(index, "title", e.target.value)}
                        placeholder="Lesson Title (e.g. Day 1: Bed Preparation)"
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(index)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Duration</label>
                      <Input
                        value={lesson.duration}
                        onChange={(e) => handleUpdateLesson(index, "duration", e.target.value)}
                        placeholder="e.g. 45:00"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        YouTube Video ID or Full Link
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={lesson.videoId || ""}
                          onChange={(e) => handleUpdateLesson(index, "videoId", e.target.value)}
                          placeholder="e.g. yMSHPl11JHI or paste YouTube URL"
                          className="h-8 text-xs font-mono flex-1"
                        />
                        {lesson.videoId && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="h-8 px-2.5 text-xs text-primary border-primary/30 shrink-0 gap-1"
                            onClick={() =>
                              window.open(
                                `https://www.youtube.com/watch?v=${lesson.videoId}`,
                                "_blank"
                              )
                            }
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                No lessons defined yet. Click &quot;Add Lesson&quot; to begin building this curriculum.
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveCourseForLessons(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLesson}
                className="text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Lesson
              </Button>
              <Button
                size="sm"
                onClick={handleSaveLessons}
                disabled={savingDb}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                {savingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {savingDb ? "Saving..." : "Save Curriculum to DB"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog
        open={Boolean(editingCourse)}
        onOpenChange={(open) => !open && setEditingCourse(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              Edit Masterclass Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update metadata, category, and display parameters.
            </DialogDescription>
          </DialogHeader>

          {editingCourse && (
            <div className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Title
                </label>
                <Input
                  value={editingCourse.title}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, title: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Category
                  </label>
                  <Input
                    value={editingCourse.category}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        category: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Duration
                  </label>
                  <Input
                    value={editingCourse.duration}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        duration: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Description
                </label>
                <Textarea
                  value={editingCourse.description}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Status
                  </label>
                  <select
                    value={editingCourse.status}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        status: e.target.value as "published" | "draft",
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Slug
                  </label>
                  <Input
                    value={editingCourse.slug}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, slug: e.target.value })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCourse(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground"
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Create New Masterclass
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new course curriculum to the AgroHeal training database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Course Title
              </label>
              <Input
                placeholder="e.g. Snail Farming & Mucus Extraction"
                value={newCourse.title}
                onChange={(e) => {
                  const title = e.target.value;
                  const autoSlug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  setNewCourse({ ...newCourse, title, slug: autoSlug });
                }}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Category
                </label>
                <Input
                  placeholder="e.g. Livestock"
                  value={newCourse.category}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, category: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Duration
                </label>
                <Input
                  placeholder="e.g. 2 Weeks (6 Lessons)"
                  value={newCourse.duration}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, duration: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Slug (URL identifier)
              </label>
              <Input
                placeholder="snail-farming-and-mucus-extraction"
                value={newCourse.slug}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, slug: e.target.value })
                }
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Description
              </label>
              <Textarea
                placeholder="Course outline and primary learning outcomes..."
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground"
              disabled={!newCourse.title || !newCourse.slug}
              onClick={handleCreateCourse}
            >
              Create Masterclass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
