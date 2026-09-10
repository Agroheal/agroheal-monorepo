import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 md:py-24 bg-[#031d0f] text-white border-t border-green-950 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-7 h-7 text-[#d1ef75]" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white mb-5">
            Together we can cut food costs by over 50%
          </h2>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Invite your friends to join the challenge. For every person that
            signs up using your referral code, you earn ₦1,000 instantly. Grow
            your income while farming to cut food costs!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full shadow-md"
              >
                Get Started Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
