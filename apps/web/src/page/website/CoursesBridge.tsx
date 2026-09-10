import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSESDATA } from "@/helpers/courses";

export default function CoursesBridge() {
  // Show exactly the first 7 courses, followed by the "+ Others and counting" card
  const previewCourses = COURSESDATA.slice(0, 7);
  const othersCount = Math.max(0, COURSESDATA.length - 7);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 selection:bg-green-100 selection:text-green-900">
      {/* ── Top Hero Section ── */}
      <section className="bg-[#031d0f] text-white pt-32 pb-20 md:pt-40 md:pb-24 border-b border-green-950">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#d1ef75] text-xs font-semibold tracking-wide uppercase mb-6"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Organic Farming Academy</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-display"
          >
            Practical, Field-Tested <br />
            <span className="text-[#d1ef75]">Organic Farming Knowledge</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 font-sans font-light"
          >
            Master container gardening, biofertilizer production, indigenous microorganisms (IMO), and zero-chemical farming. Available on-demand to all Green Card members.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup?redirect=/dashboard/courses">
              <Button size="lg" className="w-full sm:w-auto bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full shadow-md">
                Unlock Academy Access (₦2,000)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/signin?redirect=/dashboard/courses">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium h-12 px-8 rounded-full backdrop-blur-xs transition-colors shadow-none"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 7 Courses + Others Preview Grid ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100/70 px-3 py-1 rounded-full">
              Curated Curriculum Preview
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 font-display">
              Featured Academy Modules
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-light">
              Get lifetime on-demand streaming access to our full library with your Green Card.
            </p>
          </div>

          {/* Grid: 7 Courses + 1 "+ Others and counting" Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                  <img
                    src={course.thumbnail || course.Image}
                    alt={course.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Title & Short Description */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-green-800 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-gray-500 line-clamp-3 mt-2 font-light leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 8th Card: "+ Others and counting" */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="group relative rounded-2xl overflow-hidden border border-green-900 bg-[#031d0f] text-white p-6 flex flex-col justify-between shadow-xs hover:border-green-700 transition-all duration-300 min-h-[240px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-[#d1ef75]" />
                </div>
                <div className="text-2xl font-black text-[#d1ef75] tracking-tight mb-2">
                  +{othersCount} Others and counting
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Plus all advanced agroecology, livestock integration, and pest biological defense blueprints inside the member portal.
                </p>
              </div>

              <Link
                to="/signup?redirect=/dashboard/courses"
                className="inline-flex items-center justify-between text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-colors mt-4 border border-white/10"
              >
                <span>View Full Library</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d1ef75]" />
              </Link>
            </motion.div>
          </div>

          {/* Bottom Card CTA */}
          <div className="mt-16 max-w-3xl mx-auto bg-[#031d0f] text-white rounded-3xl p-8 md:p-10 shadow-xl border border-green-900 text-center">
            <h3 className="text-xl md:text-2xl font-bold font-display mb-3 text-white">
              One Lifetime Pass. Unlimited Farming Blueprints.
            </h3>
            <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto mb-6 font-light">
              Get instant access to every video course, printable SOP, and community practical guides with your ₦2,000 Green Card.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 mb-8">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#d1ef75]" /> Zero recurring monthly subscription
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#d1ef75]" /> Practical farm video demonstrations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#d1ef75]" /> Verified member ID card included
              </span>
            </div>
            <Link to="/signup?redirect=/dashboard/courses">
              <Button size="lg" className="bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full">
                Get Green Card & Access Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
