import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScrollText,
  Users,
  Wallet,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Sprout,
  CheckCircle2,
  FileCheck,
  Scale,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LegalSectionItem {
  id: string;
  title: string;
  shortTitle: string;
  icon: any;
  badge: string;
  summary: string;
  clauses: {
    number: string;
    heading: string;
    body: string[];
    highlights?: string[];
  }[];
}

const legalSections: LegalSectionItem[] = [
  {
    id: "terms",
    title: "Platform Terms of Service & General Conditions",
    shortTitle: "Terms of Service",
    icon: ScrollText,
    badge: "General Governance",
    summary:
      "Core operating guidelines, membership eligibility, code of conduct, and our non-custodial agtech status.",
    clauses: [
      {
        number: "1.1",
        heading: "Nature & Scope of the Platform",
        body: [
          "Agroheal Solutions Ltd. ('Agroheal') is an agricultural technology, cooperative enablement, and organic agribusiness facilitation platform registered under the Laws of the Federal Republic of Nigeria.",
          "Agroheal provides digital agribusiness educational curriculum (LEAP Modules), coordination infrastructure for collaborative smallholder farming clusters, biological supply inputs, and off-taker linkage services.",
          "Agroheal is strictly an agricultural production, technology, and cooperative facilitation enterprise. Agroheal is NOT a deposit-taking financial institution, microfinance bank, asset management entity, or collective investment scheme (CIS).",
        ],
        highlights: [
          "Cooperative AgTech Facilitation",
          "Not a Banking or Investment Fund",
        ],
      },
      {
        number: "1.2",
        heading: "Membership Eligibility & Account Authenticity",
        body: [
          "Access to Agroheal is open to individuals who are at least eighteen (18) years of age and possess full legal capacity to enter into binding agreements.",
          "Each participant must maintain a single, authentic member profile. The creation of duplicate accounts, synthetic identities, or automated bot scripts to exploit matrix placements or referral trees is strictly prohibited and grounds for immediate permanent disqualification and forfeiture of accrued bonuses.",
          "Members are solely responsible for safeguarding their login credentials and must immediately notify Agroheal Support upon suspicion of unauthorized account access.",
        ],
      },
      {
        number: "1.3",
        heading: "Strict Non-Deposit & Non-Banking Policy",
        body: [
          "Agroheal maintains an absolute Zero-Cash-Deposit Policy. The platform does NOT accept, store, or hold member fiat deposits, savings, or interest-bearing balances.",
          "Internal wallet balances reflect solely: (a) audited agricultural produce harvest proceeds, and (b) legitimate marketing commissions earned through verified educational Green Card enrollments. Members cannot deposit money directly into their wallet.",
        ],
        highlights: [
          "Zero Cash Top-Ups Allowed",
          "Wallet is Strictly an Earnings Ledger",
        ],
      },
      {
        number: "1.4",
        heading: "Service Updates & Legal Amendments",
        body: [
          "Agroheal reserves the right to amend, update, or revise these Terms in alignment with regulatory standards, economic realities, or technological improvements.",
          "Continued use of the platform following the publication of revised terms constitutes full and unconditional acceptance of the updated terms.",
        ],
      },
    ],
  },
  {
    id: "agreement",
    title: "LEAP Group Farming & Practical Cluster Agreement",
    shortTitle: "Group Farming Agreement",
    icon: Sprout,
    badge: "Farm Operations",
    summary:
      "Binding operational terms for practical cluster farming, ₦5,000 slot setup, Cycle 1 biological doubling, and quarterly 40% harvest distributions.",
    clauses: [
      {
        number: "2.1",
        heading: "Cluster Model & Practical Farm Slots",
        body: [
          "The Learn to Earn Agribusiness Program (LEAP) practical framework enables members to cultivate organic high-value crops (including Oyster Mushrooms, Organic Ginger, and vegetables) in coordinated cluster farms led by Agroheal agronomists.",
          "Participation is organized into discrete 'Farm Slots'. Each slot represents an allocated physical production unit within the collective group farm estate.",
        ],
      },
      {
        number: "2.2",
        heading: "One-Time Slot Setup Fee & Capital Allocation",
        body: [
          "Each practical farm slot requires a one-time setup contribution of ₦5,000. Setup contributions are allocated transparently as follows:",
          "a. 70% (₦3,500) is deployed directly into physical biological assets and infrastructure: two (2) mature starter fruiting bags, sterile agricultural substrate, spore inoculation, irrigation fittings, and disease management.",
          "b. 10% (₦500) is designated as a direct sponsor honorarium to the introducing community leader.",
          "c. 20% (₦1,000) is dedicated to operational cluster administration, logistics, and expert agronomic oversight.",
          "Zero Recurring Monthly Maintenance Fees: Unlike legacy models, modern LEAP cluster slots require NO ongoing monthly maintenance fee. Ongoing operational costs are sustained directly through harvest off-take.",
        ],
        highlights: [
          "₦5,000 One-Time Setup Fee",
          "70% Biological Assets (2 Starter Bags)",
          "Zero Recurring Monthly Dues",
        ],
      },
      {
        number: "2.3",
        heading: "Cycle 1 (Months 1–6): Biological Capacity Doubling",
        body: [
          "The initial 6-month operational season (Cycle 1) is dedicated to biological establishment and farm estate expansion.",
          "All harvest proceeds generated during Cycle 1 are automatically reinvested into spore multiplication and substrate expansion, successfully doubling the member's physical production capacity from two (2) starter bags to four (4) mature fruiting bags per slot.",
          "By entering into this agreement, participants authorize this biological doubling mechanism as a foundation for long-term sustainable harvest yields.",
        ],
        highlights: [
          "Capacity Doubling: 2 Bags ➔ 4 Bags",
          "Foundational Establishment Cycle",
        ],
      },
      {
        number: "2.4",
        heading: "Cycle 2+ (Month 7 Onward): 40% Quarterly Harvest Distributions",
        body: [
          "Commencing in Cycle 2 (Month 7 onward), mature flushes and off-take produce sales are aggregated quarterly.",
          "Forty Percent (40%) of net harvest sales proceeds are credited directly to the slot owner's wallet on a quarterly distribution calendar.",
          "The remaining Sixty Percent (60%) is retained for cluster operational continuity: substrate replenishment, cold-chain off-taker logistics, on-site farm supervisor compensation, and pest/environmental controls.",
        ],
        highlights: [
          "40% Net Harvest Credited Quarterly",
          "60% Retained for Ongoing Cluster Upkeep",
        ],
      },
      {
        number: "2.5",
        heading: "On-Site Farm Supervision & WhatsApp Community",
        body: [
          "A resident Agroheal Farm Supervisor oversees day-to-day nursery temperature, misting, sanitation, and harvesting operations.",
          "Members receive photographic and biometric harvest reporting via their cluster's designated WhatsApp community channel and digital dashboard.",
        ],
      },
    ],
  },
  {
    id: "affiliate",
    title: "Community Affiliate & 5x7 Matrix Compensation Terms",
    shortTitle: "Affiliate & 5x7 Matrix",
    icon: Users,
    badge: "Reward Architecture",
    summary:
      "Guidelines for the ₦2,000 Green Card, ₦1,000 direct referral rewards, 5x7 spillover tree, and the ₦10,000 wallet threshold for unsubscribed members.",
    clauses: [
      {
        number: "3.1",
        heading: "The Digital Green Card Lifetime Membership",
        body: [
          "The Agroheal Green Card is an optional, permanent digital credential secured via a one-time ₦2,000 registration fee.",
          "Green Card holders unlock unrestricted lifetime access to the LEAP educational course curriculum, community organogram visualization, and entitlement to earn matrix commissions.",
        ],
      },
      {
        number: "3.2",
        heading: "Direct Referral Honorarium",
        body: [
          "Any verified member who directly introduces a new participant who activates a Green Card receives an instant ₦1,000 direct referral bonus credited to their wallet balance.",
        ],
        highlights: ["₦1,000 Direct Sponsor Bonus"],
      },
      {
        number: "3.3",
        heading: "The 5x7 Spillover Producer-Consumer Matrix",
        body: [
          "The Agroheal community network operates a forced 5x7 organizational matrix. Each participant possesses five (5) direct frontline positions, expanding across seven (7) vertical generations.",
          "Members benefit from collective community spillover generated by upline coordinators and collaborative growth across the cluster network.",
        ],
      },
      {
        number: "3.4",
        heading: "Unsubscribed Member Accumulation & Withdrawal Lock",
        body: [
          "Members who register freely with Agroheal without immediately subscribing to a project or purchasing a farm slot are entitled to refer others and accumulate referral bonuses in their wallet balance without expiration.",
          "Withdrawal Qualification Requirement: In order to withdraw accumulated funds to an external bank account, an unsubscribed member must either:",
          "a. Purchase an active project subscription or practical farm slot, OR",
          "b. Accumulate at least ₦10,000 in wallet balance, which can then be applied directly via the dashboard to activate their lifetime project subscription from wallet credit.",
          "Once subscribed, the member is fully qualified to request bank withdrawals for any balance meeting the standard ₦2,000 minimum threshold.",
        ],
        highlights: [
          "Unsubscribed Members Can Freely Earn",
          "₦10,000 Wallet Balance Can Activate Subscription",
          "Prevents Non-Participating Extraction",
        ],
      },
    ],
  },
  {
    id: "wallet",
    title: "Wallet, Non-Deposit Policy & Balance Reinvestment",
    shortTitle: "Wallet & Reinvestment",
    icon: Wallet,
    badge: "Fintech Rules",
    summary:
      "Clarification of the non-custodial earnings ledger, prohibition of cash deposits, and direct reinvestment into farm slots.",
    clauses: [
      {
        number: "4.1",
        heading: "Non-Custodial Ledger Specification",
        body: [
          "The user balance on Agroheal is an internal accounting ledger reflecting accrued agricultural harvest shares and verified marketing compensations. It is NOT a bank account or stored-value instrument.",
          "Agroheal does not offer any facility for users to transfer cash or fund their wallets from bank accounts or payment gateways. There is no deposit button.",
        ],
      },
      {
        number: "4.2",
        heading: "Balance Reinvestment into Practical Slots",
        body: [
          "Members retain full authority to deploy their verified wallet balance toward purchasing practical farm slots, subscribing to new agricultural categories, or renewing project access at checkout.",
          "Reinvestment transactions are processed atomically through cryptographic double-entry ledger entries (pay_checkout_with_wallet) with zero service surcharges.",
        ],
        highlights: [
          "Reinvest Directly from Balance",
          "Zero Deductions on Reinvestment",
        ],
      },
      {
        number: "4.3",
        heading: "External Bank Disbursals & Settlement",
        body: [
          "Qualified members may request external bank withdrawals to their verified Nigerian NUBAN bank accounts.",
          "Withdrawal requests are reviewed and settled via automated banking rails or scheduled administrative settlement batches within 24 to 72 business hours.",
          "Minimum withdrawal amount is ₦2,000. All account names must match verified KYC records.",
        ],
      },
    ],
  },
  {
    id: "risk",
    title: "Agricultural & Biological Risk Disclosure",
    shortTitle: "Risk Disclosure",
    icon: AlertTriangle,
    badge: "Statutory Disclosure",
    summary:
      "Important disclosure regarding biological crop variability, climate factors, and non-guaranteed agricultural returns.",
    clauses: [
      {
        number: "5.1",
        heading: "Inherent Biological & Agronomic Factors",
        body: [
          "Agriculture, horticulture, and mushroom cultivation involve living biological organisms subject to natural biological life cycles, ambient temperature swings, humidity fluctuations, spore viability, and pest pressures.",
          "While Agroheal deploys climate-managed grow-rooms, sterile substrate protocols, and commercial agricultural safeguards, actual biomass yield and flush volumes may vary across seasons.",
        ],
      },
      {
        number: "5.2",
        heading: "Non-Guarantee of Fixed Financial Returns",
        body: [
          "Agroheal explicitly does NOT offer, promise, or guarantee fixed financial returns, interest rates, capital doubling guarantees, or fixed dividend yields.",
          "All seasonal distributions represent actual sales of harvested agricultural produce to verified off-takers at prevailing market commodity prices.",
          "Participants should view farm slots as practical agricultural engagements, food security contributions, and biological production assets, not speculative financial paper.",
        ],
        highlights: [
          "No Fixed Financial Guarantees",
          "Returns Reflect Real Farm Produce Sales",
        ],
      },
      {
        number: "5.3",
        heading: "Force Majeure & Catastrophic Climate Events",
        body: [
          "Neither party shall be held liable for failure or delay in performance caused by circumstances beyond reasonable control, including extreme natural disasters, floods, civil unrest, or catastrophic epidemic lockdowns.",
          "In such events, Agroheal shall implement standard salvage and emergency recovery protocols to protect biological cultures and cluster infrastructure.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy, NDPR Compliance & Next-of-Kin",
    shortTitle: "Privacy & NDPR",
    icon: Lock,
    badge: "Data Protection",
    summary:
      "Compliance with the Nigeria Data Protection Regulation (NDPR), secure data storage, and the Next-of-Kin inheritance succession clause.",
    clauses: [
      {
        number: "6.1",
        heading: "Nigeria Data Protection Regulation (NDPR) Compliance",
        body: [
          "Agroheal is committed to protecting member personal information in strict compliance with the Nigeria Data Protection Act (NDPA) and NDPR standards.",
          "We collect only essential information required for platform authentication, cluster communication, KYC compliance, and settlement of harvest payouts (Full Name, Phone Number, Email Address, and NUBAN Account Number).",
        ],
      },
      {
        number: "6.2",
        heading: "Confidentiality & Non-Disclosure to Third Parties",
        body: [
          "Agroheal does NOT sell, rent, monetize, or trade member personal information to third-party marketing entities.",
          "Data is shared strictly with regulated financial processing partners (e.g. Flutterwave, Paystack) exclusively for executing authorized transactions and identity verification.",
        ],
      },
      {
        number: "6.3",
        heading: "Next-of-Kin & Legal Inheritance Succession Clause",
        body: [
          "Agricultural assets, practical farm slots, quarterly harvest rights, and accumulated wallet balances are legally recognized property rights.",
          "In the event of a member's permanent incapacitation or death, all verified farm slots, accumulated ledger balances, and ongoing quarterly harvest distributions shall legally transfer to the designated Next-of-Kin registered on the member's profile.",
          "Transfer of ownership requires formal submission of verified legal documentation (Death Certificate, Medical Certification, or Letters of Administration) to Agroheal Legal Compliance.",
        ],
        highlights: [
          "Guaranteed Next-of-Kin Inheritance",
          "Seamless Transmission of Farm Slots & Balances",
        ],
      },
    ],
  },
];

const Legal = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [activeSectionId, setActiveSectionId] = useState<string>("terms");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Sync with URL hash if present
  useEffect(() => {
    const hash = location.hash.replace("#", "").toLowerCase();
    if (hash && legalSections.some((s) => s.id === hash)) {
      setActiveSectionId(hash);
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } else if (location.pathname === "/terms") {
      setActiveSectionId("terms");
    } else if (location.pathname === "/privacy") {
      setActiveSectionId("privacy");
    }
  }, [location]);

  const copySectionLink = (sectionId: string) => {
    const url = `${window.location.origin}/legal#${sectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedSection(sectionId);
    toast({
      title: "Direct Link Copied!",
      description: `Copied direct link to #${sectionId}`,
    });
    setTimeout(() => {
      setCopiedSection(null);
    }, 2500);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#032313] to-[#04331c] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-green-300 text-xs font-semibold uppercase tracking-widest mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Agroheal Legal & Governance Portal</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Terms of Service & Agreements
            </h1>
            <p className="text-green-100/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Official legal policies, group farming covenants, 5x7 matrix
              affiliate rules, non-custodial wallet policies, and risk
              disclosures.
            </p>
            <div className="w-20 h-1 bg-green-500 mx-auto mt-6 rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Sticky Section Navigation Pills */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-green-800/10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {legalSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-green-800 text-white shadow-sm scale-[1.02]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>#{sec.id}</span>
                  <span className="hidden sm:inline">· {sec.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Legal Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="space-y-12">
          {legalSections.map((section, sIdx) => {
            const Icon = section.icon;
            return (
              <motion.section
                id={section.id}
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: sIdx * 0.05 }}
                className="scroll-mt-20 bg-white rounded-3xl border border-green-800/15 p-6 md:p-10 shadow-sm relative overflow-hidden"
              >
                {/* Decorative background accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/50 rounded-bl-full pointer-events-none -z-0" />

                {/* Section Header */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-800/10 text-green-850 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-green-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          {section.badge}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{section.id}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                        {section.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {section.summary}
                      </p>
                    </div>
                  </div>

                  {/* Copy Link Button */}
                  <button
                    onClick={() => copySectionLink(section.id)}
                    className="inline-flex items-center gap-1.5 self-start md:self-center px-3.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors"
                    title={`Copy direct link to #${section.id}`}
                  >
                    {copiedSection === section.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-700 font-semibold">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy #{section.id}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Section Clauses */}
                <div className="space-y-8 relative z-10">
                  {section.clauses.map((clause, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-[#fbfcfb] rounded-2xl p-5 md:p-6 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono font-bold text-green-800 bg-green-100/60 px-2 py-0.5 rounded">
                          Clause {clause.number}
                        </span>
                        <h3 className="text-base font-bold text-gray-900">
                          {clause.heading}
                        </h3>
                      </div>

                      <div className="space-y-2.5">
                        {clause.body.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-gray-600 text-sm leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {clause.highlights && (
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          {clause.highlights.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-800 bg-green-50 px-2.5 py-1 rounded-md border border-green-100"
                            >
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Legal Sign-off / Signature Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 bg-gradient-to-br from-[#032313] to-[#064224] text-white rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-7 h-7 text-green-300" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            Agroheal Solutions Ltd.
          </h3>
          <p className="text-green-100/80 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            By activating a Green Card, enrolling in educational modules, or
            subscribing to a LEAP Practical Farm Slot, participants confirm
            that they have read, understood, and agreed to be legally bound by
            these Terms, Agreements, and Risk Disclosures.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-green-300 bg-white/10 px-4 py-2 rounded-full">
            <FileCheck className="w-4 h-4" />
            <span>Effective: September 2026 · Registered in Nigeria</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Legal;
