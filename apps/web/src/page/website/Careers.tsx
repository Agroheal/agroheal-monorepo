import { motion } from "framer-motion";
import { MapPin, Clock, ArrowRight, Sparkles, CheckCircle2, Users, Sprout, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTASection } from "../../components/webComponents/CTASection";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

const openRoles: JobPosting[] = [
  {
    id: "farm-coordinator",
    title: "Group Farm Operations Coordinator",
    department: "Field Operations",
    location: "Ogun / Lagos State, Nigeria",
    type: "Full-time / On-site",
    description: "Oversee group farm cluster setup, physical production batches, substrate monitoring, and coordinator expense audits across group farms.",
    requirements: [
      "Experience in farm management, horticulture, or agricultural extension",
      "Demonstrated team leadership and record-keeping discipline",
      "Strong communication and local stakeholder coordination skills"
    ]
  },
  {
    id: "mushroom-agronomist",
    title: "Commercial Mushroom Agronomist",
    department: "Production & R&D",
    location: "Ijebu-Ode / Sagamu Cluster, Nigeria",
    type: "Full-time / Hybrid",
    description: "Lead oyster mushroom substrate formulation, fruiting house climate control, harvest quality assurance, and disease prevention protocols.",
    requirements: [
      "Degree or practical certification in Agronomy, Crop Science, or Biotechnology",
      "Practical experience in commercial oyster or button mushroom cultivation",
      "Obsession with yield optimization and contamination control"
    ]
  },
  {
    id: "growth-lead",
    title: "Community Growth & Affiliate Specialist",
    department: "Marketing & Growth",
    location: "Remote / Hybrid",
    type: "Full-time",
    description: "Drive community expansion, empower affiliate network leaders, coordinate onboarding webinars, and nurture grassroots participation in agricultural projects.",
    requirements: [
      "Proven track record in community management or performance marketing in Nigeria",
      "Fluency with social channels, WhatsApp community automation, and webinar hosting",
      "Passion for financial empowerment through modern agricultural syndicates"
    ]
  },
  {
    id: "fullstack-eng",
    title: "Full-Stack Software Engineer (React / Node / PostgreSQL)",
    department: "Technology",
    location: "Remote (Nigeria)",
    type: "Full-time / Contract",
    description: "Architect and maintain the AgroHeal web app, financial ledger, 5x7 matrix engine, offline farm records, and administrative dashboards.",
    requirements: [
      "Deep proficiency in React, TypeScript, Tailwind CSS, and Node.js / Express",
      "Experience with PostgreSQL, Row Level Security, and high-integrity financial ledgers",
      "Passion for building reliable, beautiful software for the real economy"
    ]
  }
];

const perks = [
  {
    icon: Sprout,
    title: "Real Agricultural Impact",
    desc: "Every line of code, farm record, and field visit directly empowers Nigerian farmers and increases domestic food security."
  },
  {
    icon: Users,
    title: "High-Autonomy Culture",
    desc: "We value ownership, speed, and integrity. You have the freedom to execute ideas and see immediate operational impact."
  },
  {
    icon: HeartHandshake,
    title: "Competitive Pay & Farm Shares",
    desc: "Competitive compensation packages with performance bonuses and opportunities for project slot allocations."
  }
];

export default function Careers() {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  });

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Banner */}
          <motion.div {...fadeUp(0.1)} className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Careers at Agroheal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-950 tracking-tight mb-6" style={{ fontFamily: "'Georgia', serif" }}>
              Help Us Cultivate the Future of Sustainable Agriculture
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              We are building the operating system for commercial community farming in Nigeria. Join our mission to empower thousands of entrepreneurs through sustainable agriculture and digital technology.
            </p>
          </motion.div>

          {/* Perks Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  {...fadeUp(0.2 + idx * 0.1)}
                  className="bg-white rounded-2xl p-7 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mb-5 text-green-800">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{perk.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{perk.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Open Roles Section */}
          <motion.div {...fadeUp(0.3)} className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
                  Open Positions
                </h2>
                <p className="text-gray-500 text-sm mt-1">Discover where your skills can create maximum impact.</p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-green-100/80 text-green-800 text-xs font-semibold rounded-full">
                {openRoles.length} Active Roles
              </span>
            </div>

            <div className="space-y-6">
              {openRoles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm hover:border-green-600/40 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-0.5 rounded-md">
                          {role.department}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {role.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
                    </div>

                    <a
                      href={`mailto:careers@agroheal.solutions?subject=${encodeURIComponent(`Application: ${role.title}`)}&body=${encodeURIComponent(`Hello AgroHeal Team,\n\nI am applying for the ${role.title} position.\n\nPlease find my resume attached.\n\nBest regards,\n`)}`}
                    >
                      <Button className="bg-green-800 hover:bg-green-900 text-white gap-2 text-sm font-semibold rounded-xl">
                        Apply for Role
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{role.description}</p>

                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Key Requirements:</h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {role.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{role.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* General Application Banner */}
          <motion.div {...fadeUp(0.4)} className="bg-gradient-to-br from-green-950 to-[#042817] text-white rounded-3xl p-8 md:p-12 shadow-xl mb-16 text-center max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>
              Don't See Your Exact Role?
            </h3>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto mb-8 font-light">
              We are constantly looking for mission-driven problem solvers, local extension workers, agritech engineers, and creative builders. Send us your CV and tell us how you'd like to contribute.
            </p>
            <a
              href="mailto:careers@agroheal.solutions?subject=General%20Application%20-%20AgroHeal&body=Hello%20AgroHeal%20Team%2C%0A%0AI%20am%20submitting%20a%20general%20application%20to%20collaborate%20with%20AgroHeal.%0A%0ABest%20regards%2C"
            >
              <Button className="bg-[#d1ef75] hover:bg-[#bce055] text-green-950 font-bold px-8 py-6 text-sm rounded-2xl transition-transform hover:scale-105">
                Send General Application
              </Button>
            </a>
          </motion.div>
        </div>

        <CTASection />
      </main>
    </div>
  );
}
