import { motion } from "framer-motion";

import { AgrohealImages } from "@/constant/Image";
import { Leaf } from "lucide-react";

const AuthSidebar = () => {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  return (
    <div className="hidden lg:flex lg:w-[52%] relative bg-[#1a3c28] overflow-hidden flex-col justify-between p-12">
      {/* Texture layer */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Organic blob shapes */}
      <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-green-600/20 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-green-500/10 blur-2xl" />

      {/* Logo */}
      <motion.div
        {...fadeUp(0.1)}
        className="relative z-10 flex items-center gap-2.5"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Leaf className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          Agroheal
        </span>
      </motion.div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-16">
        <motion.div
          {...fadeUp(0.2)}
          className="w-full flex justify-center items-center mb-4"
        >
          <img src={AgrohealImages?.authImage} alt="" />
        </motion.div>

        <motion.h2
          {...fadeUp(0.3)}
          className="w-full text-center text-2xl xl:text-4xl font-bold text-white leading-[1.15] mb-6"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Grow smarter,
          <span className="text-emerald-400">earn more.</span>
        </motion.h2>

        <motion.p
          {...fadeUp(0.4)}
          className="w-full text-green-200/80 text-center text-base leading-relaxed"
        >
          Join thousands of Nigerian farmers managing their slots, tracking
          payments, and growing their agricultural income with Agroheal.
        </motion.p>
      </div>

      {/* Bottom quote */}
      <motion.div
        {...fadeUp(0.6)}
        className="relative z-10 border-t border-white/10 pt-6"
      >
        <p className="text-green-200/60 text-sm italic leading-relaxed">
          Join agroheal learn to earn agribusiness platform, Learn, Practice and
          Earn.
        </p>
      </motion.div>
    </div>
  );
};

export { AuthSidebar };
export default AuthSidebar;


