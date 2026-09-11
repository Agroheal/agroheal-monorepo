import { motion } from "framer-motion";
import { BookOpen, Sprout, Coins, ArrowRight } from "lucide-react";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";

const steps = [
  {
    icon: BookOpen,
    title: "Learn",
    description:
      "Learn how to farm a wide range of crops/livestock, produce organic fertilizers/pesticides, and livestock feed, including BSFL.",
    color: "bg-green-800 text-white",
  },
  {
    icon: Sprout,
    title: "Practice",
    description:
      "Secure a farm slot for life-long learning and practice in organic farming. Learn with real crops on real land with expert guidance. ",
    color: "bg-[#d17547] text-white",
  },
  {
    icon: Coins,
    title: "Earn",
    description:
      "Engage in managed cooperative cluster farming. Cycle 1 doubles biological capacity from 2 to 4 fruiting bags per slot, and from Cycle 2 onward, receive up to 40% projected quarterly harvest distributions from net produce sales (AgroHeal is an agricultural cooperative, not an investment platform).",
    color: "bg-[#e8b130] text-white",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <SectionDivider position="bottom" className="text-muted" />
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="About LEAP"
          title="Join the Learn to Earn Agribusiness Platform"
          // description="Agroheal is simplifying farming so everyone can join in."
          description=" Learn. Practice. Earn"
          className="mb-16"
        />

        {/* Journey line (desktop) */}
        <div className="relative">
          <svg
            aria-hidden="true"
            className="hidden md:block absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full h-24 text-border/60"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C180,20 260,100 400,60 C540,20 660,100 800,60 C940,20 1020,100 1200,60"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="8 10"
            />
          </svg>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className="relative group"
              >
                <div className="relative  rounded-3xl p-8 shadow-soft transition-all duration-300 h-full border border-border/60 hover:shadow-elevated hover:-translate-y-1">
                  {/* Step Number */}
                  {/* <div className=" absolute -top-4 -left-4 w-11 h-11 rounded-full bg-background/90 border border-border flex items-center justify-center  font-bold text-foreground shadow-soft">
                    {index + 1}
                  </div> */}

                  {/* Icon */}
                  <div className="relative mb-0">
                    {/* <div
                      className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft`}
                    >
                      <step.icon className={`w-8 h-8`} />
                    </div> */}
                    <div
                      aria-hidden="true"
                      className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Content */}
                  <h3 className=" text-xl font-medium text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-green-800 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow for non-last items */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute -right-7 top-1/2 -translate-y-1/2 z-10">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-background/90 border border-border shadow-soft">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
