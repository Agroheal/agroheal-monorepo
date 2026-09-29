import { motion } from "framer-motion";
import { ChevronDown, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "../webComponents/SectionDivider";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* <img
          src={heroImage}
          alt="Organic farmland at golden hour"
          className="w-full h-full object-cover"
        /> */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="https://ik.imagekit.io/noah/Untitled%20video%20-%20Made%20with%20Clipchamp.mp4"
            type="video/mp4"
          />
        </video>

        {/* <div className="absolute inset-0 bg-gradient-to-r from-[#e8b130]/5 via-green-800/80 to-green-800/80" /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        {/* Soft grain / texture */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, hsl(var(--primary-foreground)) 0%, transparent 40%), radial-gradient(circle at 80% 30%, hsl(var(--primary-foreground)) 0%, transparent 35%), radial-gradient(circle at 60% 80%, hsl(var(--primary-foreground)) 0%, transparent 45%)",
          }}
        />
      </div>
      {/* Organic glow blobs */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
      />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="mx-auto max-w-8xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hidden items-start gap-2 px-4 py-2 rounded-full bg-[#e8b130]/20 border border-[#e8b130]/30 text-[#e8b130] font-medium text-sm mb-6">
              <Sprout className="w-4 h-4 text-[#e8b130]" />
              Premium organic farming education
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-left text-4xl md:text-5xl lg:text-5xl font-medium text-primary-foreground leading-[1.05] mb-6"
          >
            Farm for Africa Challenge: <br />
            <span className=""> TEAM NIGERIA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-lg text-left md:text-xl text-primary-foreground/85 mb-8 max-w-2xl leading-relaxed"
          >
            LET'S FARM to cut food costs by over 50% & create an income stream
            for every participant. <br />
            <br /> Through the Learn to Earn Agribusiness Platform (LEAP),
            Agroheal is simplifying farming so everyone can join in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="hidden items-start"
          >
            <Button
              size="lg"
              asChild
              className="bg-green-800 p-5 rounded-full border-2 border-none hover:text-green-800 hover:bg-green-800/80 cursor-pointer duration-300"
            >
              <Link to="/signup" className="gap-2">
                Read More
              </Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="hidden mt-6 text-sm text-primary-foreground/70"
          >
            Built for clarity, confidence, and real-world practice.
          </motion.p>
        </div>
      </div>

      {/* Decorative Elements */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background to-transparent" /> */}

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-primary-foreground/70">
          <span className="text-xs font-semibold tracking-wide">
            Scroll to explore
          </span>
          <ChevronDown
            className="h-5 w-5 motion-safe:animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Organic transition into next section */}
      <SectionDivider position="bottom" className="text-background" />
    </section>
  );
}
