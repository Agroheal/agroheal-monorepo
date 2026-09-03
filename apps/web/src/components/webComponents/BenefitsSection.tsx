import { motion } from "framer-motion";
import { useState } from "react";
import { Leaf, TrendingUp, Users } from "lucide-react";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";
import { AgrohealImages } from "@/constant/Image";

const benefits = [
  {
    icon: Leaf,
    title: "Secure Your Green Card (₦1,000)",
    description:
      "Start with a one-time ₦1,000 Green Card fee. This gives you access to all our training courses, from composting to crop.",
  },
  {
    icon: TrendingUp,
    title: "Secure Your Farm Slot (₦5,000 per slot)",
    description:
      "Each group farm is one unit of Mushroom Fruiting House, divided into 1000 slots. Secure one slot with a one-time ₦5,000 (inclusive of admin & marketing fee, housing and operations cost and the cost of two Mushroom Substrate Bags). Your slot is permanent once secured. Once you secure your slot, you're officially part of a group farm. Multiple slots, Multiple Returns. The Farm is managed transparently by the Group farm owners in a WhatsApp Group Chat so every naira is accounted for.",
  },
  {
    icon: Users,
    title:
      "Mushroom Village: Low-Cost Entry to Ownership in Gingertown & Organic FoodNation",
    description:
      "Double production capacity in the second quarter, earn up to 40% Quarterly Returns from the 6th to 12th Month and put 25% each into Gingertown and Organic FoodNation.\n\nHow it Works:\n\nParticipants join Mushroom Group Farms to learn and earn from the production of Oyster Mushrooms.\n\n1. Secure Your Green Card (₦1,000)\nStart with a one-time ₦1,000 Green Card fee. This gives you access to all our training courses, from composting to crop.\n\n2. Secure Your Farm Slot (₦5,000 per slot)\nEach group farm is one unit of Mushroom Fruiting House, divided into 1000 slots. Secure one slot with a one-time ₦5,000 (inclusive of admin & marketing fee, housing and operations cost and the cost of two Mushroom Substrate Bags).\n\n3. Once you secure your slot, you're officially part of a group farm. Multiple slots, Multiple Returns.\n\n4. The Farm is managed transparently by the Group farm owners in a WhatsApp Group Chat so every naira is accounted for.\n\n5. Harvest & Share the Profits from the 6th Month. Mushrooms are harvested, processed and sold directly to guaranteed Farm to Table iMarts as well as to fulfill export supply contracts.",
  },
];

export function BenefitsSection() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <section className="relative py-24 bg-muted/30 overflow-hidden">
      <SectionDivider position="top" className="text-background" />
      <SectionDivider position="bottom" className="text-background" />
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow=""
          title="How it works"
          description=""
          className="mb-16"
        />

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div className="grid grid-cols-1 gap-10">
            {benefits.map((benefit, index) => {
              const words = benefit.description.split(/\s+/).filter(Boolean);
              const needsReadMore = words.length > 150;
              const isExpanded = expandedCard === benefit.title;

              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="group"
                >
                  <div className="relative rounded-3xl p-7 shadow-soft transition-all duration-300 h-full border border-border/60 motion-reduce:transition-none motion-reduce:hover:transform-none">
                    <div
                      aria-hidden="true"
                      className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                    />
                    <h3 className="text-[18px] font-normal text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    {needsReadMore && !isExpanded ? (
                      <button
                        type="button"
                        onClick={() => setExpandedCard(benefit.title)}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2e7d32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#236028] transition-colors"
                      >
                        Read More
                      </button>
                    ) : (
                      <p className="text-green-800 text-[14px] sm:text-[14px] md:text-[16px] leading-relaxed whitespace-pre-line">
                        {benefit.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-10">
            <img
              src={AgrohealImages?.HowItWorksOne}
              alt="about-1"
              className="rounded-xl"
            />
            <img
              src={AgrohealImages?.HowItWorksTwo}
              alt="about-2"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
