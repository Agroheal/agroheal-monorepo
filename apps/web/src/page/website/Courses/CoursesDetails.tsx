import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Lock,
  Menu,
  Play,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCourseBySlug, type Lesson } from "@/helpers/coursesDetails";
import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import NoDataFound from "../../../assets/Icon/searching.json";
import { supabase } from "@/lib/supabaseClient";

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const fallbackCourse = useMemo(() => getCourseBySlug(slug || ""), [slug]);
  const [course, setCourse] = useState(fallbackCourse);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    fallbackCourse?.lessons[0] || null,
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "academy_courses")
          .maybeSingle();

        if (data?.value?.courses && Array.isArray(data.value.courses)) {
          const match = data.value.courses.find((c: any) => c.slug === slug);
          if (match && isMounted) {
            setCourse(match);
            if (match.lessons?.length > 0) {
              setActiveLesson((prev) => prev || match.lessons[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch dynamic course overrides, using fallback:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [slug]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <main className="pb-16">
          <div className="container mx-auto px-4 text-center">
            <Lottie
              animationData={NoDataFound}
              width={250}
              height={250}
              loop={true}
            />
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Course Not Found
            </h1>
            <p className="text-green-800 font-semibold mb-8">
              The course you're looking for doesn't exist.
            </p>
            <Button className="bg-green-800 text-white cursor-pointer hover:bg-green-800/80 duration-300">
              <Link to="/dashboard/courses">Browse Courses</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const progress = Math.round(
    (completedLessons.size / course.lessons.length) * 100,
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-0">
        {/* Mobile Header */}
        <div className="lg:hidden relative z-10 bg-background/95 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard/courses"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Courses</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 mr-2" />
              Lessons
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-r border-border bg-card/50 h-[calc(100vh-5rem)] sticky top-20">
            <div className="p-6 border-b border-border">
              <Link
                to="/dashboard/courses"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Courses</span>
              </Link>
              <h2 className=" text-lg font-semibold text-foreground line-clamp-2">
                {course.title}
              </h2>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
                <span>{course.lessons.length} lessons</span>
              </div>

              {/* Progress Bar */}
              {/* <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-cta rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div> */}
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="p-4 space-y-1">
                {course.lessons.map((lesson, index) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    isActive={activeLesson?.id === lesson.id}
                    isCompleted={completedLessons.has(lesson.id)}
                    isLocked={!course.free && index > 0}
                    onClick={() => {
                      if (course.free || index === 0) {
                        setActiveLesson(lesson);
                      }
                    }}
                    onToggleComplete={() => toggleComplete(lesson.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            >
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 h-full w-80 bg-card border-r border-border shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className=" font-semibold text-foreground">Lessons</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-4 border-b border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-cta rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-10rem)]">
                  <div className="p-4 space-y-1">
                    {course.lessons.map((lesson, index) => (
                      <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        isActive={activeLesson?.id === lesson.id}
                        isCompleted={completedLessons.has(lesson.id)}
                        isLocked={!course.free && index > 0}
                        onClick={() => {
                          if (course.free || index === 0) {
                            setActiveLesson(lesson);
                            setSidebarOpen(false);
                          }
                        }}
                        onToggleComplete={() => toggleComplete(lesson.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </motion.aside>
            </div>
          )}

          {/* Main Content - Video Player */}
          <div className="flex-1 min-w-0">
            <div className="p-4 lg:p-8 max-w-5xl mx-auto">
              {activeLesson ? (
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Video Player */}
                  {/* <div className="rounded-2xl overflow-hidden bg-muted border border-border shadow-elevated">
                    <AspectRatio ratio={16 / 9} className="relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeLesson.videoId}?autoplay=1&mute=0&modestbranding=1&rel=0&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&playsinline=1`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={false}
                        className="w-full h-full pointer-events-none"
                      />

                      <div className="absolute inset-0 z-10 pointer-events-none" />
                    </AspectRatio>
                  </div> */}

                  <div className="rounded-2xl overflow-hidden bg-muted border border-border shadow-elevated">
                    <AspectRatio ratio={16 / 9} className="relative">
                      {/* YouTube Video */}
                      <iframe
                        src={`https://www.youtube.com/embed/${activeLesson.videoId}?autoplay=1&mute=0&modestbranding=1&rel=0&controls=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&playsinline=1`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={false}
                        className="w-full h-full"
                      />

                      {/* Top overlay - blocks YouTube logo and title */}
                      <div className="absolute top-0 left-0 right-0 h-[12%] sm:h-[15%] z-10 pointer-events-auto" />

                      {/* Bottom overlay - blocks controls except play button area */}
                      <div className="absolute bottom-0 left-0 right-0 h-[12%] sm:h-[15%] z-10 pointer-events-auto" />

                      {/* Left overlay - blocks left side */}
                      <div className="absolute top-[12%] sm:top-[15%] bottom-[12%] sm:bottom-[15%] left-0 w-[20%] sm:w-[25%] z-10 pointer-events-auto" />

                      {/* Right overlay - blocks right side */}
                      <div className="absolute top-[12%] sm:top-[15%] bottom-[12%] sm:bottom-[15%] right-0 w-[20%] sm:w-[25%] z-10 pointer-events-auto" />
                    </AspectRatio>
                  </div>

                  {/* Lesson Info */}
                  <div className="mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h1 className=" text-2xl md:text-3xl font-bold text-foreground">
                          {activeLesson.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {activeLesson.duration}
                          </span>
                          {completedLessons.has(activeLesson.id) && (
                            <Badge
                              variant="secondary"
                              className="inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={
                          completedLessons.has(activeLesson.id)
                            ? "outline"
                            : "destructive"
                        }
                        onClick={() => toggleComplete(activeLesson.id)}
                      >
                        {completedLessons.has(activeLesson.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          "Mark as Complete"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Course Info Card */}
                  <div className="mt-8 p-6 rounded-xl bg-card border border-border/50">
                    <h3 className=" text-lg font-semibold text-foreground mb-2">
                      About this course
                    </h3>
                    <p className="text-muted-foreground">
                      {course.description}
                    </p>
                    {!course.free && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground">
                          <Lock className="w-4 h-4 inline mr-2" />
                          This is a premium course. Subscribe to unlock all
                          lessons.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          asChild
                        >
                          <Link to="/signup">Subscribe Now</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">
                    Select a lesson to start learning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface LessonItemProps {
  lesson: Lesson;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
  onToggleComplete: () => void;
}

const LessonItem = ({
  lesson,
  index,
  isActive,
  isCompleted,
  isLocked,
  onClick,
}: LessonItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent",
        isLocked && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium transition-colors",
            isCompleted
              ? "bg-primary text-primary-foreground"
              : isActive
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {isCompleted ? (
            <CheckCircle className="w-4 h-4" />
          ) : isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium line-clamp-2",
              isActive ? "text-foreground" : "text-foreground/80",
            )}
          >
            {index + 1}. {lesson.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lesson.duration}
          </p>
        </div>
      </div>
    </button>
  );
};

export default CourseDetail;
