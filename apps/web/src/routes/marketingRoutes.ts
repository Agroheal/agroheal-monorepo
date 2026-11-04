import {
  Video,
  Users,
  Globe,
  Sprout,
  Award,
  GitBranch,
  FileText,
  HelpCircle,
  Building2,
  Zap,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type MarketingCategory =
  | "Campaigns"
  | "Registration"
  | "Ecosystem"
  | "Production"
  | "Education"
  | "Company";

export interface MarketingDestinationRoute {
  id: string;
  title: string;
  path: string;
  category: MarketingCategory;
  badge?: "Recommended" | "Fast Enrolment" | "High Yield" | "New";
  icon: LucideIcon;
  description: string;
  shareMessage: string;
}

/**
 * Authoritative registry of shareable public routes.
 * Directly synchronized with appRouter to ensure zero routing drift.
 */
export const MARKETING_DESTINATIONS: readonly MarketingDestinationRoute[] = [
  {
    id: "pay",
    title: "Instant Pay-First Checkout (/pay)",
    path: "/pay",
    category: "Campaigns",
    badge: "Fast Enrolment",
    icon: Zap,
    description: "1-click checkout drawer that lets prospects pay before signing up, automatically capturing their referral and provisioned account.",
    shareMessage: "Activate your AgroHeal Green Card or Combo package instantly with 1-click checkout:",
  },
  {
    id: "pay-starter",
    title: "₦15,000 Starter Combo Instant Pay (/pay?plan=starter)",
    path: "/pay?plan=starter",
    category: "Campaigns",
    badge: "Recommended",
    icon: Sparkles,
    description: "Pre-selects the complete ₦15,000 Starter Combo (Green Card + Farm Slot + Mushroom Starter Pack) in the 1-click drawer.",
    shareMessage: "Join our AgroHeal Mushroom Farm with the full ₦15,000 Starter Combo package:",
  },
  {
    id: "pay-installment",
    title: "₦2,000 Instalment Pay Link (/pay?plan=installment)",
    path: "/pay?plan=installment",
    category: "Campaigns",
    badge: "New",
    icon: CreditCard,
    description: "Pre-selects the flexible ₦2,000 weekly instalment payment plan in the 1-click drawer.",
    shareMessage: "Start your AgroHeal Green Card with just ₦2,000 weekly instalment:",
  },
  {
    id: "gc",
    title: "Green Card Video Funnel (/gc)",
    path: "/gc",
    category: "Campaigns",
    badge: "Recommended",
    icon: Video,
    description: "Explainer video page for Green Card activation, Mushroom Village operations, and 5×7 community qualifications.",
    shareMessage: "Watch this short explainer video on AgroHeal Mushroom Village and learn how to earn compound agricultural wealth:",
  },
  {
    id: "signup",
    title: "Member Registration (/signup)",
    path: "/signup",
    category: "Registration",
    badge: "Fast Enrolment",
    icon: Users,
    description: "Standard member registration page with your sponsor code pre-filled and locked in.",
    shareMessage: "Join my AgroHeal 5×7 community network today and start your journey towards sustainable agro-wealth:",
  },
  {
    id: "farm-slots",
    title: "Farm Slots Overview (/farm-slots)",
    path: "/farm-slots",
    category: "Production",
    badge: "High Yield",
    icon: Sprout,
    description: "Mushroom Village production slots, farm pricing, yields, and monthly harvest returns.",
    shareMessage: "Explore AgroHeal Mushroom Village farm slots and earn returns on agricultural production:",
  },
  {
    id: "courses",
    title: "AgroHeal Academy (/courses)",
    path: "/courses",
    category: "Education",
    icon: Award,
    description: "Educational courses and masterclasses on mushroom cultivation and agribusiness.",
    shareMessage: "Learn practical agribusiness and agro-wealth strategies on AgroHeal Academy:",
  },
  {
    id: "presentation",
    title: "Official Presentation (/how-it-works/presentation)",
    path: "/how-it-works/presentation",
    category: "Ecosystem",
    icon: FileText,
    description: "Official slide breakdown and full walkthrough of the AgroHeal ecosystem.",
    shareMessage: "Review the full AgroHeal Official Presentation and discover how our community model works:",
  },
  {
    id: "affiliate",
    title: "Affiliate & Partner Network (/affiliate)",
    path: "/affiliate",
    category: "Ecosystem",
    icon: GitBranch,
    description: "Detailed overview of the 5×7 compound matrix commissions, PQV rules, and growth pools.",
    shareMessage: "Learn how the AgroHeal 5×7 Partner & Referral Network creates sustainable residual income:",
  },
  {
    id: "how-it-works",
    title: "How It Works Guide (/how-it-works)",
    path: "/how-it-works",
    category: "Ecosystem",
    icon: HelpCircle,
    description: "Comprehensive guide to platform onboarding, green card activation, and cycles.",
    shareMessage: "Discover how AgroHeal works, from community membership to production cycles:",
  },
  {
    id: "home",
    title: "AgroHeal Home (/)",
    path: "/",
    category: "Ecosystem",
    icon: Globe,
    description: "Main homepage featuring platform overview, ecosystem pillars, and agricultural missions.",
    shareMessage: "Discover AgroHeal, Africa's technology-driven agro-wealth and mushroom production ecosystem:",
  },
  {
    id: "about",
    title: "About AgroHeal (/about)",
    path: "/about",
    category: "Company",
    icon: Building2,
    description: "Our mission, leadership team, sustainable farming vision, and story.",
    shareMessage: "Learn more about the vision, story, and leadership driving AgroHeal:",
  },
] as const;

export const DEFAULT_MARKETING_DESTINATION = MARKETING_DESTINATIONS[0];

export function getDestinationById(id: string): MarketingDestinationRoute {
  return MARKETING_DESTINATIONS.find((d) => d.id === id) || DEFAULT_MARKETING_DESTINATION;
}

export function getDestinationByPath(path: string): MarketingDestinationRoute {
  return MARKETING_DESTINATIONS.find((d) => d.path === path) || DEFAULT_MARKETING_DESTINATION;
}
