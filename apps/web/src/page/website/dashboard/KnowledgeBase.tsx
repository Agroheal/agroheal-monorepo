import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Award,
  Sprout,
  Users,
  Wallet,
  ShieldCheck,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  category: "all" | "greencard" | "slots" | "matrix" | "wallet" | "bylaws";
  question: string;
  answer: string | React.ReactNode;
  tags: string[];
}

const FAQS: FaqItem[] = [
  // ── Green Card FAQs ──
  {
    id: "gc-1",
    category: "greencard",
    question: "What is the AgroHeal Green Card (AGC) and what does the ₦2,000 fee cover?",
    answer:
      "The AgroHeal Green Card (AGC) is your official, verifiable digital cooperative credential. The one-time ₦2,000 activation fee grants permanent lifetime access to the LEAP organic farming training library, unlocks your unique affiliate referral link, accredits you for cooperative general assemblies and depot distributions, and gives you permanent placement in the 5×7 community matrix.",
    tags: ["green card", "agc", "2000", "activation", "cost", "fee", "membership"],
  },
  {
    id: "gc-2",
    category: "greencard",
    question: "Do I need to renew my Green Card annually?",
    answer:
      "No. Your digital Green Card membership is permanent and lifetime. There are no recurring annual renewal fees for maintaining your Green Card identity and membership standing.",
    tags: ["renewal", "annual", "lifetime", "expire"],
  },
  {
    id: "gc-3",
    category: "greencard",
    question: "How do third parties or farm depots verify my Green Card?",
    answer:
      "Every AgroHeal Green Card includes a dynamic QR code linked directly to our public verification portal (/verify-card/:memberId). Farm managers, cooperative banks, and off-take depots can scan the code with any standard smartphone to instantly confirm your active status and identity without exposing sensitive private details.",
    tags: ["qr code", "verify", "scan", "authentication"],
  },

  // ── Group Farm Slots ──
  {
    id: "slots-1",
    category: "slots",
    question: "How much does a Group Farm Slot cost and what is included?",
    answer:
      "Each Group Farm Slot requires a one-time capital commitment of ₦5,000. 70% (₦3,500) covers fruiting house setup, racking structures, biological inputs, farm labor, and 2 initial mature oyster mushroom fruiting bags; 10% (₦500) is paid as an instant sponsor bounty; and 20% (₦1,000) is retained in the cooperative administrative reserve. There are zero monthly maintenance fees.",
    tags: ["slots", "5000", "cost", "mushrooms", "pricing", "breakdown"],
  },
  {
    id: "slots-2",
    category: "slots",
    question: "How do Cycle 1 (Doubling) and Cycle 2+ (Surplus Dividends) work?",
    answer:
      "In Cycle 1 (Months 1–3), your 2 starter bags yield ~2kg of fresh organic oyster mushrooms. 90% of harvest sales are ploughed back into production to double your fruiting capacity from 2 to 4 bags per slot at zero extra personal expense. From Cycle 2 onward (every 3 months thereafter), your 4 bags produce ~4kg of fresh mushrooms. After deducting substrate bag replacement costs, up to 40% (up to ₦2,400) of net harvest surplus proceeds are credited directly to your bank-withdrawable wallet based on actual realized market sales.",
    tags: ["cycle 1", "cycle 2", "dividends", "harvest", "quarterly", "doubling"],
  },
  {
    id: "slots-3",
    category: "slots",
    question: "Is AgroHeal an investment company or ponzi scheme?",
    answer:
      "AgroHeal is strictly an agricultural cooperative operating under Nigerian cooperative laws, not an investment platform, collective investment scheme, or bank. Distributions are based strictly on biological harvest yields and verified off-take market sales to supermarkets, food processors, and hotels. There are no fixed, guaranteed, or compound interest returns.",
    tags: ["investment", "ponzi", "risk", "legality", "cooperative"],
  },

  // ── 5x7 Matrix ──
  {
    id: "matrix-1",
    category: "matrix",
    question: "How does the 5×7 Community Matrix Pipeline function?",
    answer:
      "The AgroHeal Community Matrix is a forced 5-wide, 7-level deep network pipeline designed to reward active community development. As members in your upline and downline introduce new producers, spillover placements automatically populate available slots across the 7 tiers below you.",
    tags: ["matrix", "5x7", "spillover", "levels", "tiers"],
  },
  {
    id: "matrix-2",
    category: "matrix",
    question: "What are the requirements to unlock Matrix Spillover withdrawals?",
    answer:
      "To prevent passive free-riding and maintain cooperative economic vitality, matrix spillover withdrawals require two conditions: (1) You must have at least 5 personally sponsored direct active referrals, and (2) You must maintain an active rolling 30-day Personal Qualifying Volume (PQV) of at least ₦5,000 (achieved through slot purchases or cooperative product subscriptions).",
    tags: ["matrix unlock", "pqv", "5 referrals", "qualifications", "gate"],
  },
  {
    id: "matrix-3",
    category: "matrix",
    question: "What are the commission rates and ceilings per level in the 5×7 Matrix?",
    answer:
      "Level 1: 5 members, 5.0% (₦250/slot), ceiling ₦1,250 (requires 1 direct). Level 2: 25 members, 3.5% (₦175/slot), ceiling ₦4,375 (requires 2 directs). Level 3: 125 members, 3.0% (₦150/slot), ceiling ₦18,750 (requires 3 directs). Level 4: 625 members, 2.5% (₦125/slot), ceiling ₦78,125 (requires 4 directs). Level 5: 3,125 members, 2.5% (₦125/slot), ceiling ₦390,625 (requires 5 directs). Level 6: 15,625 members, 2.5% (₦125/slot), ceiling ₦1,953,125 (requires 5 directs). Level 7: 78,125 members, 2.5% (₦125/slot), ceiling ₦9,765,625 (requires 5 directs).",
    tags: ["matrix ceilings", "percentages", "level 1", "level 7", "commissions"],
  },

  // ── Wallet & Disbursals ──
  {
    id: "wallet-1",
    category: "wallet",
    question: "What is the difference between Available Balance and Ledger Balance?",
    answer:
      "Available Balance represents cleared, fully qualified funds that can be immediately disbursed to your commercial bank account. Ledger Balance reflects total cumulative posted capital, including earnings currently locked pending project activation or 5×7 matrix qualification gates.",
    tags: ["available balance", "ledger balance", "difference", "withdrawable"],
  },
  {
    id: "wallet-2",
    category: "wallet",
    question: "What does 'Unsubscribed (Accumulating)' mean?",
    answer:
      "If you have not yet activated an agricultural project subscription, all direct referral bounties and bonuses continue to accrue safely in your wallet without forfeiture. Once your accumulated balance reaches ₦10,000, you can activate your project subscription directly using your wallet balance with a single click!",
    tags: ["unsubscribed", "accumulating", "10000", "activate from wallet"],
  },
  {
    id: "wallet-3",
    category: "wallet",
    question: "What is the minimum withdrawal threshold and how are payouts processed?",
    answer:
      "The minimum withdrawal amount is ₦2,000 for active project members. Payouts are transferred electronically to your registered Nigerian NUBAN commercial bank account within 24 to 48 business hours following verification.",
    tags: ["withdrawal", "minimum", "2000", "payout", "bank", "nuban"],
  },

  // ── Bylaws & Heritage ──
  {
    id: "bylaws-1",
    category: "bylaws",
    question: "What happens to my farm slots and earnings if I am incapacitated or deceased?",
    answer:
      "Under Article 7 of the official AgroHeal Cooperative Bylaws, your membership identity, active production slots, accumulated ledger balances, and quarterly dividend rights do not expire. They legally transfer in full to the designated Next-of-Kin recorded in your profile settings upon presentation of verified legal proof.",
    tags: ["next of kin", "heritage", "bylaws", "inheritance", "death"],
  },
  {
    id: "bylaws-2",
    category: "bylaws",
    question: "Can I have multiple AgroHeal accounts?",
    answer:
      "No. To safeguard matrix integrity and comply with cooperative governance, each participant must maintain a single authentic member identity linked to their phone number and BVN/NUBAN. Duplicate or bot-generated accounts are strictly prohibited and subject to immediate forfeiture.",
    tags: ["multiple accounts", "rules", "bylaws", "compliance"],
  },
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqItem["category"]>("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "gc-1": true });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        faq.question.toLowerCase().includes(query) ||
        (typeof faq.answer === "string" && faq.answer.toLowerCase().includes(query)) ||
        faq.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── HEADER BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041d0f] via-[#09351d] to-[#03170c] text-white p-7 sm:p-10 shadow-2xl border border-emerald-600/30">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cooperative Resource Center</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              AgroHeal Knowledge Base
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Authoritative documentation on the Green Card, mushroom farm slot operations, 5×7 community matrix rules, and financial ledger policies.
            </p>

            {/* Live Search Input */}
            <div className="pt-2">
              <div className="relative max-w-xl">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, topics, or keywords (e.g. 5x7 matrix, ₦2,000, slots, withdrawal)..."
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all text-sm backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY FILTER TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "All Topics", icon: HelpCircle },
            { id: "greencard", label: "Green Card (AGC)", icon: Award },
            { id: "slots", label: "Farm Slots", icon: Sprout },
            { id: "matrix", label: "5×7 Matrix", icon: Users },
            { id: "wallet", label: "Wallet & Ledger", icon: Wallet },
            { id: "bylaws", label: "Bylaws & Heritage", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-emerald-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── FAQ ACCORDION LIST ── */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 space-y-3">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No articles matched your query</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Try searching for related keywords such as "matrix", "slots", "payout", or browse via category tabs above.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="rounded-xl text-xs font-semibold"
              >
                Reset Search
              </Button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = Boolean(openItems[faq.id]);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <span className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-emerald-100 text-emerald-800" : "text-gray-500"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 border-t border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 bg-gray-50/40">
                      <div>{faq.answer}</div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {faq.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-mono text-[10px]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── BOTTOM BANNER: CANNOT FIND ANSWER? ── */}
        <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Personalized Member Care
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              Can't find what you're looking for?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
              Our dedicated member support desk is ready to assist you with onboarding, slot subscriptions, and wallet verifications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <Button
              asChild
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-sm"
            >
              <Link to="/dashboard/help/customer-service">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Customer Service
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-emerald-700 text-emerald-800 hover:bg-emerald-100/60 font-semibold text-xs h-10 px-4 rounded-xl"
            >
              <Link to="/dashboard/legal">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Cooperative Bylaws
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
