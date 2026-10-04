import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Video,
  Clock,
  CheckCircle2,
  Users,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration: string;
  modulesCount: number;
  lessonsCount: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "published" | "draft";
  enrolledMembers: number;
  description: string;
}

const INITIAL_COURSES: CourseItem[] = [
  {
    id: "c1",
    title: "Commercial Mushroom Cultivation Masterclass",
    slug: "commercial-mushroom-cultivation",
    category: "Mushroom Village",
    duration: "4 Weeks (12 Lessons)",
    modulesCount: 4,
    lessonsCount: 12,
    level: "Beginner",
    status: "published",
    enrolledMembers: 245,
    description: "Practical step-by-step masterclass on oyster mushroom substrate preparation, bag inoculation, incubation, and fruiting management.",
  },
  {
    id: "c2",
    title: "Ginger & Spices Processing Blueprint",
    slug: "ginger-spices-processing",
    category: "Gingertown",
    duration: "3 Weeks (8 Lessons)",
    modulesCount: 3,
    lessonsCount: 8,
    level: "Intermediate",
    status: "published",
    enrolledMembers: 118,
    description: "Post-harvest ginger washing, solar dehydration, essential oil extraction, and bulk export quality standards.",
  },
  {
    id: "c3",
    title: "Organic Food Security & Soil Ecology",
    slug: "organic-food-security",
    category: "Organic FoodNation",
    duration: "2 Weeks (6 Lessons)",
    modulesCount: 2,
    lessonsCount: 6,
    level: "Beginner",
    status: "published",
    enrolledMembers: 84,
    description: "Composting techniques, bio-fertilizer formulation, and pesticide-free pest control methods for clustered community farmlands.",
  },
  {
    id: "c4",
    title: "LEAP Cluster Farming & Farm Group Leadership",
    slug: "leap-cluster-farming",
    category: "Governance & Leadership",
    duration: "1 Week (4 Lessons)",
    modulesCount: 2,
    lessonsCount: 4,
    level: "Advanced",
    status: "published",
    enrolledMembers: 35,
    description: "Operating manual for Farm Group Coordinators: tracking bag colonization, expense logging, and quarterly harvest reconciliation.",
  },
];

export default function CoursesAdminPage() {
  const [courses] = useState<CourseItem[]>(INITIAL_COURSES);

  const totalLessons = courses.reduce((sum, c) => sum + c.lessonsCount, 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + c.enrolledMembers, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            AgroHeal Academy &amp; Content Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Curate learning curricula, video masterclasses, and agricultural guides for Green Card members.
          </p>
        </div>

        <Button size="sm" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Create New Course
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Published Masterclasses</p>
            <p className="text-2xl font-bold text-foreground mt-1">{courses.length}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">All active in member portal</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Curriculum Lessons</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalLessons}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Video &amp; downloadable resources</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Video className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Enrolled Members</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalEnrolled}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Completed lessons tracked</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Users className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Card key={c.id} className="p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
                  {c.category}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Published
                </span>
              </div>

              <h3 className="font-bold text-sm text-foreground mb-1.5">{c.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.description}</p>

              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{c.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{c.modulesCount} Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{c.enrolledMembers} Enrolled</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground font-mono">
                slug: /{c.slug}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Edit Modules
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary"
                  onClick={() => window.open(`https://agroheal.solutions/dashboard/courses/${c.slug}`, "_blank")}
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
