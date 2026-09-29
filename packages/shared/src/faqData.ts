export interface FaqItem {
  id: string;
  category: "all" | "greencard" | "slots" | "matrix" | "wallet" | "bylaws" | "general";
  question: string;
  answer: string;
  tags: string[];
}

export const OFFICIAL_FAQS: FaqItem[] = [
  // ── General Agribusiness FAQs ──
  {
    id: "gen-1",
    category: "general",
    question: "Do I need prior farming experience to join AgroHeal?",
    answer:
      "No previous experience is required. AgroHeal's Learn to Earn Agribusiness Platform (LEAP) provides step-by-step video modules, practical guides, and hands-on coordinator support to help any member understand organic cultivation and commercial off-taker practices from scratch.",
    tags: ["experience", "beginner", "farming", "learn", "leap"],
  },
  {
    id: "gen-2",
    category: "general",
    question: "Can members in the diaspora or outside Nigeria participate?",
    answer:
      "Yes. Diaspora and remote members can fully register, hold digital Green Cards, subscribe to farm slots, and monitor production cycles online. Our farm managers and verified coordinators manage physical operations on the ground, with real-time reporting delivered directly to your dashboard.",
    tags: ["diaspora", "international", "abroad", "remote", "participation"],
  },
  {
    id: "gen-3",
    category: "general",
    question: "Is AgroHeal an investment company or collective investment scheme?",
    answer:
      "No. AgroHeal is strictly an agricultural community and practical agro-education enterprise, not an investment platform, bank, or collective investment scheme. Slot subscriptions directly fund physical biological inputs (such as oyster mushroom fruiting bags) and farm infrastructure. Projected surplus distributions (up to 40%) represent estimated commodity dividends from verified supermarket and institutional off-take sales, never guaranteed passive financial yields.",
    tags: ["investment", "ponzi", "scheme", "regulation", "legal", "notice"],
  },

  // ── Green Card FAQs ──
  {
    id: "gc-1",
    category: "greencard",
    question: "What is the AgroHeal Green Card (AGC) and what does the ₦2,000 fee cover?",
    answer:
      "The AgroHeal Green Card (AGC) is your lifetime digital community credential. The one-time ₦2,000 activation fee grants permanent access to the LEAP organic farming training library, unlocks your unique affiliate referral rights (₦1,000 direct bonus per invite), accredits you for community meetings and depot distributions, and secures permanent placement in the 5×7 community matrix.",
    tags: ["green card", "agc", "2000", "activation", "fee", "membership"],
  },
  {
    id: "gc-2",
    category: "greencard",
    question: "Do I need to renew my Green Card annually?",
    answer:
      "No. Your digital Green Card membership is permanent and lifetime. There are no recurring annual maintenance dues or expiration dates for your Green Card identity.",
    tags: ["renewal", "annual", "lifetime", "expire"],
  },
  {
    id: "gc-3",
    category: "greencard",
    question: "How do farm depots and off-takers verify my Green Card?",
    answer:
      "Every AgroHeal Green Card features a verified dynamic QR code linked directly to our public authentication portal (/verify-card/:memberId). Partner depots, agricultural off-takers, and farm managers can scan this code with any smartphone to instantly confirm active membership.",
    tags: ["qr code", "verify", "scan", "authentication", "depot"],
  },

  // ── Farm Slots & Wealth Creation ──
  {
    id: "slots-1",
    category: "slots",
    question: "What is the ₦10,000 Producer-Consumer Starter Package?",
    answer:
      "The ₦10,000 Wealth Creation dual activation package is the mandatory starter package to enter production: ₦5,000 covers a welcome health pack of Mushroom Power (100g pure oyster mushroom extract), and ₦5,000 activates your compulsory first commercial farm slot (2 mature fruiting bags). Additional farm slots can then be purchased at ₦5,000 each with zero recurring maintenance fees.",
    tags: ["starter package", "10000", "mushroom power", "wealth creation", "slots"],
  },
  {
    id: "slots-2",
    category: "slots",
    question: "How do Cycle 1 (Doubling) and Cycle 2+ (Surplus Dividends) work?",
    answer:
      "In Cycle 1 (Months 1–3), your 2 starter bags yield ~2kg of fresh organic oyster mushrooms. 90% of harvest proceeds are reinvested into biological capacity to double your slot from 2 to 4 fruiting bags with zero additional personal capital. From Cycle 2 onward (every 3 months thereafter), your 4 bags produce ~4kg of fresh mushrooms. After deducting substrate renewal costs, up to 40% (estimated up to ₦2,400) of net harvest surplus is credited directly to your withdrawable wallet based on realized sales.",
    tags: ["cycle 1", "cycle 2", "doubling", "dividends", "harvest", "quarterly"],
  },
  {
    id: "slots-3",
    category: "slots",
    question: "Which agricultural clusters are currently active?",
    answer:
      "Our flagship active cluster is Mushroom Village (commercial oyster mushrooms). Additional strategic clusters—including Ginger Town and Organic FoodNation—are established and funded through Cycle 2 proceeds from the mushroom flagship.",
    tags: ["clusters", "mushroom village", "ginger town", "foodnation"],
  },

  // ── 5x7 Community Matrix ──
  {
    id: "matrix-1",
    category: "matrix",
    question: "How does the 5×7 Community Matrix Pipeline function?",
    answer:
      "The AgroHeal Community Matrix is a forced 5-wide, 7-level deep community pipeline. As active members introduce new producers, spillover placements automatically fill available positions across 7 tiers below you. Total potential community commissions across all 7 tiers reach ₦12,212,500.",
    tags: ["matrix", "5x7", "forced matrix", "tiers", "spillover"],
  },
  {
    id: "matrix-2",
    category: "matrix",
    question: "What is required to unlock Matrix Spillover withdrawals?",
    answer:
      "To ensure community productivity and prevent passive free-riding, withdrawing 5×7 matrix commissions requires two conditions: (1) Sponsoring at least 5 personally referred active members, and (2) Maintaining an active rolling 30-day Personal Qualifying Volume (PQV) of ₦10,000 (achieved through slot subscriptions or commodity product orders).",
    tags: ["matrix unlock", "5 referrals", "pqv", "qualification", "locked funds"],
  },
  {
    id: "matrix-3",
    category: "matrix",
    question: "What are the statutory commission rates per tier in the 5×7 Matrix?",
    answer:
      "Level 1: 5 members, 5.0% (₦250/slot), ceiling ₦1,250. Level 2: 25 members, 3.5% (₦175/slot), ceiling ₦4,375. Level 3: 125 members, 3.0% (₦150/slot), ceiling ₦18,750. Level 4: 625 members, 2.5% (₦125/slot), ceiling ₦78,125. Level 5: 3,125 members, 2.5% (₦125/slot), ceiling ₦390,625. Level 6: 15,625 members, 2.5% (₦125/slot), ceiling ₦1,953,125. Level 7: 78,125 members, 2.5% (₦125/slot), ceiling ₦9,765,625.",
    tags: ["tiers", "percentages", "level 1", "level 7", "commission schedule"],
  },

  // ── Wallets & Locked Reserves ──
  {
    id: "wallet-1",
    category: "wallet",
    question: "What is the difference between Available Balance and Ledger Balance?",
    answer:
      "Available Balance represents cleared, fully qualified funds ready for immediate disbursement to your Nigerian bank account. Ledger Balance reflects total cumulative posted earnings, including reserves held pending 5×7 matrix qualification (5 directs + ₦10k PQV) or project subscription gates.",
    tags: ["available balance", "ledger balance", "difference", "withdrawable", "wallet"],
  },
  {
    id: "wallet-2",
    category: "wallet",
    question: "Why are some of my funds listed as 'Locked Reserves'?",
    answer:
      "Funds are held in locked reserve under three specific circumstances: (1) Matrix Spillover Reserves: You have not yet sponsored 5 direct partners; (2) Project Subscription: You have accumulated referral rewards but have not yet activated your ₦10,000 starter package; (3) Minimum Threshold: Your cleared balance is below the statutory ₦2,000 payout floor.",
    tags: ["locked reserves", "matrix locked", "reasons", "gatekeepers", "unlock"],
  },
  {
    id: "wallet-3",
    category: "wallet",
    question: "Can I use accumulated wallet funds to activate my Starter Package?",
    answer:
      "Yes! When your direct referral wallet accumulates ₦10,000, a one-click 'Activate with Wallet Credit' button appears on your dashboard, allowing you to secure your starter package without spending external money.",
    tags: ["wallet activation", "10000", "accumulate", "internal credit"],
  },
  {
    id: "wallet-4",
    category: "wallet",
    question: "What is the minimum withdrawal threshold and payout turnaround?",
    answer:
      "The minimum withdrawal amount is ₦2,000. Verified withdrawals are transferred electronically to your registered Nigerian NUBAN commercial bank account within 24 to 48 business hours.",
    tags: ["withdrawal", "minimum", "2000", "payout", "nuban", "turnaround"],
  },

  // ── Bylaws & Heritage ──
  {
    id: "bylaws-1",
    category: "bylaws",
    question: "What happens to my farm slots and earnings if I am incapacitated or deceased?",
    answer:
      "Under AgroHeal Community Guidelines, your Green Card identity, active farm slots, accumulated wallet balances, and quarterly dividend rights never expire. They legally transfer in full to the Next-of-Kin recorded in your profile settings upon verification.",
    tags: ["next of kin", "heritage", "inheritance", "bylaws", "safety"],
  },
];
