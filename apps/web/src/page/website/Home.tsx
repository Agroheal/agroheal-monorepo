import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Sprout,
  ChevronDown,
  ArrowRight,
  Globe,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { AgrohealImages } from "@/constant/Image";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [expandedHub, setExpandedHub] = useState<number | null>(null);
  const [expandedHowItWorks, setExpandedHowItWorks] = useState<number | null>(
    null,
  );

  const advantages = [
    {
      badge: "AGRICULTURAL TRAINING",
      title: "Sustainable Agriculture Training",
      desc: "Learn modern profitable farming systems from industry experts through our structured playbook.",
    },
    {
      badge: "FARMLAND ACCESS",
      title: "Access to Farmlands",
      desc: "Secure permanent farmland access without the traditional barrier of heavy capital costs.",
    },
    {
      badge: "COORDINATOR SUPPORT",
      title: "End-to-End Support",
      desc: "Guidance from professional managers and coordinators from land preparation to harvest and sales.",
    },
    {
      badge: "VALUE ADDITION",
      title: "Processing & Value Addition",
      desc: "Convert raw products into processed consumer items to multiply your profitability.",
    },
    {
      badge: "BRAND ARCHITECTURE",
      title: "Branding & Packaging Support",
      desc: "Package and brand your agricultural goods with premium designs built to win consumer trust.",
    },
    {
      badge: "GLOBAL COMMERCE",
      title: "Market Access & Export Opportunities",
      desc: "Sell into established local retail chains and international food markets through Agroheal’s network.",
    },
  ];

  const featuredHubs = [
    {
      name: "Mushroom Village",
      desc: "Low-Cost Entry to other projects.",
    },
    {
      name: "Gingertown",
      desc: "No. 1 Global Ginger Exporter",
    },
    {
      name: "Organic FoodNation",
      desc: "1,000,000 Hectares Against Hunger.",
    },
  ];

  const projectHubs = [
    {
      name: "Gingertown",
      desc: "No. 1 ginger production, processing & export powerhouse.",
    },
    {
      name: "Mushroom Village",
      desc: "Local & export-focused mushroom ecosystem for medicinal mushrooms and affordable plant protein. Why it matters: affordable & healthy alternative to animal protein, short production cycle, high profitability, export potential, urban and rural production friendly.",
    },
    {
      name: "Ugu, Okra & Ewedu Base",
      desc: "Affordable shelf-stable Ugu, Okra & Ewedu products for homes and exports. Dried, flakes, powdered, packaged ready-to-cook healthy soup blends. Making affordable nutritious vegetables available all year round.",
    },
    {
      name: "Anomala",
      desc: "The ultimate low-cost swallow for food security. A nutritious blend of sweet potato and cassava.",
    },
    {
      name: "Tomapepp Republic",
      desc: "Stabilizing Nigeria’s most volatile food market to achieve all-year-round affordable tomatoes and pepper supply. Greenhouse support. Processing into paste and powder.",
    },
    {
      name: "Broiler Chicken Hub",
      desc: "Affordable organic poultry meat ecosystem.",
    },
    {
      name: "Cattle Fattening Hub",
      desc: "Integrated cow meat and organic fertilizer generation.",
    },
    {
      name: "Catfish Hub",
      desc: "Catfish production ecosystem for affordable fish protein.",
    },
    {
      name: "RiceUp Naija",
      desc: "Closing Nigeria’s rice production gap.",
    },
    {
      name: "Naija Beans Revolution",
      desc: "Massive beans production and value addition.",
    },
    {
      name: "Plantain Plus",
      desc: "Fresh plantain, flour, chips and exports.",
    },
    {
      name: "Yam365",
      desc: "Stable yam supply and affordable pricing throughout the year.",
    },
    {
      name: "RedOil Network",
      desc: "RedOil stable prices and long-term wealth creation ecosystem.",
    },
  ];

  const testimonials = [
    {
      initials: "AO",
      name: "Amina O.",
      role: "Beginner farmer",
      quote:
        "The lessons are clear and practical. I finally understood composting and soil health in a way I can apply immediately.",
    },
    {
      initials: "CK",
      name: "Chinedu K.",
      role: "Aspiring agropreneur",
      quote:
        "I liked the Learn → Practice → Earn path. It feels structured, not overwhelming, and keeps me focused.",
    },
    {
      initials: "TA",
      name: "Tosin A.",
      role: "Career switcher",
      quote:
        "Seeing the course preview and what comes next made it easy to commit. The platform feels premium and trustworthy.",
    },
    {
      initials: "GM",
      name: "Grace M.",
      role: "Community member",
      quote:
        "The community energy is strong, once you start learning, it’s easy to keep going. I’m excited for farm practice.",
    },
  ];

  const faqs = [
    {
      q: "Do I need farming experience to join?",
      a: "Absolutely not. Agroheal's ecosystem is designed to take you from zero to expert. Through our comprehensive training, structured guides, and hands-on coordinator support, anyone can comfortably run their agribusiness successfully.",
    },
    {
      q: "Can I participate from outside Nigeria?",
      a: "Yes. Remote participants and members of the diaspora can fully register, own slots, and manage their agribusinesses through local substitution frameworks. You receive full reporting and administrative support.",
    },
    {
      q: "How do farm ownership slots work?",
      a: "Each slot represents a managed production unit within a commercial cooperative cluster (such as 2 Oyster Mushroom fruiting bags). Your contribution directly finances biological inputs and infrastructure with zero recurring monthly fees. We are an agricultural cooperative, not an investment platform; members participate in actual biological production sold through established off-taker channels.",
    },
    {
      q: "What support does Agroheal provide?",
      a: "We provide an end-to-end ecosystem: practical training, premium land access, high-quality inputs, modern farming systems, professional value-addition processing, expert product branding, and direct local/international market links.",
    },
    {
      q: "Can I earn without farming myself?",
      a: "Yes. You can leverage our community coordination model where qualified farm substitutes handle the physical operations for a pre-negotiated support fee. You maintain full ownership of the product.",
    },
    {
      q: "Are there export opportunities?",
      a: "Yes. Key hubs such as Gingertown, RedOil, and Spice City are explicitly engineered for the global supply chain, packaging agricultural exports to earn foreign exchange.",
    },
    {
      q: "How are projects managed?",
      a: "Each production hub is run by highly qualified managers, agronomists, and coordinators. Financial transparency is integrated, with real-time updates and group accounts easily accessible through the dashboard.",
    },
    {
      q: "Who can become a participant?",
      a: "Anyone motivated to create long-term wealth, ensure national food security, and build a scalable business in agricultural value chains.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-gray-900 overflow-x-hidden antialiased font-sans">
      <section className="relative min-h-screen flex items-center pt-24 pb-24 md:pb-32 overflow-hidden bg-[#031d0f]">
        {/* Full-bleed video background with designer overlay */}
        <div className="absolute inset-0 z-0 bg-[#031d0f]">
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
          {/* Lighter, high-end organic gradient overlay - beautifully reduced for high video visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031d0f]/80 via-[#031d0f]/45 to-transparent hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#031d0f]/85 via-[#042815]/50 to-[#031d0f]/90 lg:hidden" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#031d0f]/90 to-transparent z-10" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 w-full">
          <div className="max-w-3xl mx-auto lg:mx-0 text-center lg:text-left space-y-6">
            {/* Highly Refined, Sophisticated Headline (scaled down for professional desktop viewing and optimized for mobile) */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight text-center lg:text-left"
              >
                Community Organic Food Production
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-[#d1ef75] font-semibold text-base md:text-lg tracking-wide text-center lg:text-left"
              >
                #GrowWhatYouEat
              </motion.p>
            </div>

            {/* Clean Professional Supporting Copy (justified on mobile, left-aligned on desktop) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-gray-200 text-base md:text-lg leading-relaxed max-w-2xl font-light font-sans text-justify lg:text-left"
            >
              <ul className="list-disc list-outside pl-5 space-y-2 mt-4 text-left text-base md:text-lg font-semibold">
                <li>Join in Community Farming</li>
                <li>
                  Farm from anywhere through WhatsApp group chat coordination
                </li>
                <li>Process. Brand. Sell. Prosper.</li>
              </ul>
            </motion.div>

            {/* Contemporary Geometric Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 group text-sm md:text-base shadow-lg shadow-green-950/20"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/signin"
                className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-950 font-bold px-8 py-4 rounded-xl transition-all duration-300 text-sm md:text-base"
              >
                <span>Sign In</span>
              </Link>

              <a
                href="#projects-section"
                className="inline-flex items-center justify-center text-white hover:text-white/80 font-semibold py-3 px-4 gap-1 text-sm md:text-base"
              >
                <span>Explore Projects</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING ECOSYSTEM PILLARS RIBBON - RUMPUT OVERLAPPING LAYOUT */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 -mt-20 md:-mt-28 mb-16">
        <div className="bg-gradient-to-r from-[#051c0e] to-[#072d17] border border-green-800/40 text-white rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-green-800/40">
            {/* Column 1 */}
            <div className="flex gap-4 items-start md:px-4 pt-4 md:pt-0">
              <BookOpen className="w-6 h-6 text-[#d1ef75] shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm tracking-wide text-white mb-1 uppercase">
                  Learn
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Learn organic farming to save up to 50% in fertilizer and feed
                  costs.
                </p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex gap-4 items-start md:px-6 pt-6 md:pt-0">
              <Sprout className="w-6 h-6 text-[#d1ef75] shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm tracking-wide text-white mb-1 uppercase">
                  Access Land
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Secure managed agricultural land slots within specialized
                  production cities.
                </p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex gap-4 items-start md:px-6 pt-6 md:pt-0">
              <Award className="w-6 h-6 text-[#d1ef75] shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm tracking-wide text-white mb-1 uppercase">
                  Process & Brand
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Transform raw crops into branded, high-margin finished
                  products.
                </p>
              </div>
            </div>

            {/* Column 4 */}
            <div className="flex gap-4 items-start md:px-6 pt-6 md:pt-0">
              <Globe className="w-6 h-6 text-[#d1ef75] shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm tracking-wide text-white mb-1 uppercase">
                  Sell & Prosper
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Distribute into local channels and capture international
                  export profits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE AGROHEAL ADVANTAGE / WHY WE SUCCEED */}
      <section className="pt-10 pb-28 bg-white relative z-10">
        <div className="container mx-auto px-6 max-w-6xl text-center space-y-12">
          <div>
            <span className="text-green-700 text-xs font-bold uppercase tracking-wider block mb-2">
              Why We Succeed
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[#072412] tracking-tight">
              The Agroheal Advantage
            </h3>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-sm">
              Our mission is to build profitable farmers while solving hunger
              sustainably. Participants are not left alone, we facilitate:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {advantages.map((adv, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-6 bg-[#fbfdfb] border border-gray-200/60 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CheckCircle2 className="w-6 h-6 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-[#072412]">
                    {adv.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EXPLORE THE HUBS (Minimalist Modern Tech Grid) */}
      <section
        id="projects-section"
        className="pt-12 pb-24 bg-[#020e06] text-white relative z-10"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[#d1ef75] border border-[#d1ef75]/25 bg-[#d1ef75]/5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4">
              Production
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
              Join Production
            </h2>
            <span className="mx-auto block h-px w-1/2 max-w-[200px] rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-items-center gap-8 mb-14">
            {featuredHubs.map((project, idx) => {
              return (
                <div
                  key={idx}
                  className={`group w-full max-w-[520px] md:max-w-[560px] mx-auto p-6 md:p-8 rounded-3xl transition-all duration-300 border border-slate-200/70 bg-slate-50/95 flex flex-col md:flex-row items-center gap-6 overflow-hidden shadow-sm hover:shadow-[0_24px_48px_rgba(46,125,50,0.18)] hover:bg-white justify-self-center ${idx === 2 ? "md:col-span-2 lg:col-span-2" : ""}`}
                >
                  <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                    <h3 className="text-base sm:text-xl md:text-3xl font-extrabold mt-0 mb-2 text-slate-900 leading-tight tracking-tight whitespace-nowrap overflow-hidden truncate">
                      {project.name}
                    </h3>

                    <p className="text-sm md:text-base text-slate-700 leading-relaxed mt-0">
                      {project.desc}
                    </p>
                  </div>

                  <div className="w-full md:w-40 h-32 md:h-36 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    <img
                      src={
                        project.name === "Gingertown"
                          ? AgrohealImages.HowItWorksTwo
                          : project.name === "Mushroom Village"
                            ? AgrohealImages.Mushroom
                            : AgrohealImages.HowItWorksOne
                      }
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative pt-16 md:pt-28 pb-28 bg-[#f9fafb] text-[#072412] overflow-hidden z-10 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* Header Title */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#072412] tracking-tight mb-4">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                title: "Mushroom Village:",
                subtitle:
                  "Double production capacity in Cycle 1, earn up to 40% estimated quarterly harvest returns from Cycle 2 onwards.",
                description:
                  "How it Works:\n\nParticipants join Mushroom Group Farms to learn and earn from the commercial production of Oyster Mushrooms.\n\n1. Secure Your Green Card (₦2,000)\nStart with a one-time ₦2,000 Green Card fee. This grants you permanent lifetime access to our organic training academy, your digital Green Card ID, and affiliate referral earning rights.\n\n2. Secure Your Farm Slot (₦5,000 per slot)\nEach group farm targets 1,000 production slots (operational kickoff at 250 slots). Secure your slot with a one-time ₦5,000 payment (70% covers fruiting house setup, racks, labor, and 2 initial substrate bags; 10% sponsor bonus; 20% platform admin). There are zero monthly maintenance fees.\n\n3. Cycle 1: Capacity Doubling (Months 1–3)\nYour 2 starter bags yield approximately 2kg of fresh mushrooms. 90% of harvest proceeds are ploughed back into production to double your capacity from 2 to 4 bags per slot without spending an extra kobo.\n\n4. Cycle 2+ Estimated Quarterly Surplus Dividends (Every 3 Months Thereafter)\nYour 4 bags produce approximately 4kg. After substrate bag replacement costs are deducted, up to 40% of net harvest surplus proceeds are credited directly to your bank-withdrawable wallet every quarter based on realized sales. (AgroHeal is an agricultural cooperative, not an investment platform; returns represent commodity crop sales, not fixed financial interest).\n\n5. Commercial Off-Taker Market\nFresh mushrooms are supplied directly to established supermarket chains, hotels, restaurants, and dried for high-value export contracts.",
              },
              {
                title: "Organic FoodNation",
                subtitle: "1 Million Hectares Against Hunger — Integrated Organic Cluster",
                description:
                  "How it Works:\n\nParticipants join Integrated Cluster Farms to learn and earn from mass organic food production.\n\n1. Secure Your Green Card (₦2,000)\nStart with a one-time ₦2,000 Green Card fee for permanent lifetime membership and access to comprehensive organic farming blueprints.\n\n2. Secure Your Farm Slot\nJoin a cooperative group farm cluster. Slot contributions fund certified organic inputs, land prep, and automated irrigation. No hidden monthly utilities.\n\n3. Sustainable Crop & Livestock Integration\nIntercropped organic vegetables, grains, plantain, and livestock produce high yields with low-cost on-farm organic compost and biopesticides.\n\n4. Harvest Distribution\nHarvested produce is sold directly to established Farm-to-Table food distribution networks to eliminate middlemen and maximize member dividends.",
              },
              {
                title: "Pioneers Gingertown",
                subtitle: "Cooperative Flagship Farm Funded via Mushroom Cycle 2 Profits",
                description:
                  "How it Works:\n\nPioneers Gingertown Group Farm is the premier ginger production cluster under AgroHeal cooperative management.\n\n1. Sustained by Mushroom Cycle 2 Profits\nRather than ongoing individual slot levies, Pioneers Gingertown Group Farm is directly funded and sustained through proceeds generated from Cycle 2 onwards of our Mushroom Flagship project.\n\n2. High-Grade Organic Ginger Cultivation\nOperates 1-Hectare commercial ginger acreage equipped with modern drip irrigation and biological soil enrichment.\n\n3. Expert Cooperative Agronomy\nManaged on the ground by certified agronomists and experienced agricultural labor, eliminating the need for members to perform physical farm work.\n\n4. Export & Value-Added Spice Channels\nHarvested produce is cured, dried, and supplied to industrial spice processors and off-taker export markets, enriching the cooperative's long-term asset base.",
              },
            ].map((card, index) => {
              const words = card.description.split(/\s+/).filter(Boolean);
              const needsReadMore = words.length > 150;
              const preview = needsReadMore
                ? (() => {
                    const tokens = card.description.match(/(\s+|\S+)/g) ?? [];
                    let count = 0;
                    const previewTokens: string[] = [];

                    for (const token of tokens) {
                      previewTokens.push(token);
                      if (/\S/.test(token)) {
                        count += 1;
                        if (count >= 150) break;
                      }
                    }

                    return previewTokens.join("") + "...";
                  })()
                : card.description;
              const isExpanded = expandedHowItWorks === index;

              return (
                <div
                  key={card.title}
                  className="rounded-3xl border border-green-700/30 bg-[#020e06] p-8 shadow-2xl text-center lg:text-left"
                >
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight text-center lg:text-left mb-6">
                    <span className="text-[#d1ef75]">{card.title}</span>
                  </h3>
                  <p className="text-base md:text-lg font-semibold text-[#d1ef75] mb-6">
                    {card.subtitle}
                  </p>
                  <div className="mt-6 text-sm md:text-base text-gray-200 leading-relaxed text-justify mb-8 whitespace-pre-line">
                    {needsReadMore && !isExpanded ? (
                      <>
                        {preview}
                        <button
                          type="button"
                          onClick={() => setExpandedHowItWorks(index)}
                          className="mt-4 inline-flex text-[#d1ef75] font-semibold text-sm"
                        >
                          Read More
                        </button>
                      </>
                    ) : (
                      card.description
                    )}
                  </div>
                  {needsReadMore && isExpanded ? (
                    <button
                      type="button"
                      onClick={() => setExpandedHowItWorks(null)}
                      className="text-[#d1ef75] font-semibold text-sm"
                    >
                      Show less
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Statutory Cooperative Notice */}
          <div className="mt-14 p-5 sm:p-6 rounded-3xl bg-white border border-gray-200/90 text-gray-600 text-xs sm:text-sm leading-relaxed shadow-xs flex items-start gap-4">
            <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-sm border border-amber-200">
              ℹ
            </span>
            <div>
              <strong className="text-gray-950 block mb-1 font-bold text-sm">Cooperative Notice — We Are Not An Investment Platform:</strong>
              AgroHeal Solutions Ltd is an agricultural cooperative and agro-education platform, <strong>not an investment company, financial broker, or collective investment scheme (CIS)</strong>. We do not promise, offer, or guarantee fixed financial returns or interest. Projected surplus returns (e.g. <em>&quot;earn up to 40%&quot;</em>) represent estimated commodity sales dividends derived strictly from actual biological agricultural harvests and commercial off-taker distribution.
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12 pb-24 bg-[#020e06] text-white relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[#d1ef75] border border-[#d1ef75]/25 bg-[#d1ef75]/5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4">
              Processing
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
              Explore Processing
            </h2>
            <span className="mx-auto block h-px w-1/2 max-w-[200px] rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            {projectHubs.map((project, idx) => {
              const formattedIndex = String(idx + 1).padStart(2, "0");
              const isGreen = idx % 2 === 0;
              const isExpanded = expandedHub === idx;
              const maxLength = 110;
              const isTooLong = project.desc.length > maxLength;
              const displayDesc =
                isExpanded || !isTooLong
                  ? project.desc
                  : `${project.desc.slice(0, maxLength).trim()}...`;

              return (
                <div
                  key={idx}
                  className={`group p-8 rounded-2xl transition-all duration-300 flex h-full flex-col justify-between relative overflow-hidden backdrop-blur-sm border border-slate-300/30 ${
                    isGreen
                      ? "bg-[#041a0d]/40 hover:bg-[#041a0d]/80 hover:border-green-800/40"
                      : "bg-white/[0.08] hover:bg-white/[0.14] hover:border-green-500/20"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 ${
                      isGreen
                        ? "bg-gradient-to-r from-transparent via-green-500/0 to-transparent group-hover:via-green-500/20"
                        : "bg-gradient-to-r from-transparent via-[#d1ef75]/0 to-transparent group-hover:via-[#d1ef75]/20"
                    }`}
                  />

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <span
                        className={`text-xs font-mono tracking-wider ${
                          isGreen ? "text-gray-500" : "text-white/40"
                        }`}
                      >
                        HUB {formattedIndex}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold tracking-wide mb-2 text-[#d1ef75]">
                      {project.name}
                    </h3>
                    <p
                      className={`text-xs md:text-sm leading-relaxed font-light font-sans ${
                        isGreen ? "text-gray-400" : "text-gray-300"
                      }`}
                    >
                      {displayDesc}
                    </p>
                    {isTooLong ? (
                      <button
                        type="button"
                        onClick={() => setExpandedHub(isExpanded ? null : idx)}
                        className="text-[#d1ef75] font-semibold text-sm mt-4"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section className="relative py-28 bg-[#031d0f] text-white overflow-hidden z-10 border-t-2 border-white/20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#d1ef75] border border-[#d1ef75]/25 bg-[#d1ef75]/5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              Loved by learners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-2xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials circle */}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                        {test.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">
                          {test.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                          {test.role}
                        </span>
                      </div>
                    </div>
                    {/* Golden Quote SVG */}
                    <svg
                      className="w-6 h-6 text-[#020e06] opacity-80 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Testimonial Quote Text */}
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-6 font-normal">
                    “{test.quote}”
                  </p>
                </div>

                {/* Golden Outline Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-3.5 h-3.5 text-[#020e06]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION (Accordion) */}
      <section className="pt-12 pb-28 bg-white relative z-10 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-green-700 border border-green-200 bg-green-50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4">
              Questions
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#072412] tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#fbfcfb] rounded-2xl border border-gray-200/60 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-bold text-xs md:text-sm text-[#072412] pr-4">
                      {faq.q}
                    </span>
                    <span className="shrink-0 text-green-700">
                      {isOpen ? (
                        <Minus className="w-4 h-4 transition-transform text-[#2e7d32]" />
                      ) : (
                        <Plus className="w-4 h-4 transition-transform text-[#2e7d32]" />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-6 pt-0 text-xs md:text-sm text-gray-500 border-t border-gray-200/60 leading-relaxed bg-white font-light text-justify">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
