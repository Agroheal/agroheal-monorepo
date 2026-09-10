import { useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Target, Eye, Heart } from "lucide-react";
import { CTASection } from "../../components/webComponents/CTASection";

const About = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <span className="text-[#d17547] font-semibold text-sm uppercase tracking-wider">
              About Agroheal
            </span>
            <h1 className=" text-4xl md:text-5xl font-bold text-green-800 mt-4">
              Empowering the Future of Sustainable Agriculture
            </h1>
            <p className="text-muted-foreground text-lg mt-6 leading-relaxed">
              Agroheal is on a mission to transform lives through organic
              farming education. We believe everyone deserves access to the
              knowledge and resources needed to build a sustainable future.
            </p>
          </motion.div>

          {/* Mission, Vision, Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Target,
                title: "Our Mission",
                description:
                  "To democratize organic farming education and provide practical pathways to sustainable income through agriculture.",
              },
              {
                icon: Eye,
                title: "Our Vision",
                description:
                  "A world where organic farming is accessible to everyone, creating healthier communities and a thriving planet.",
              },
              {
                icon: Heart,
                title: "Our Values",
                description:
                  "Sustainability, community, education, and empowerment guide everything we do at Agroheal.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-xl p-8 shadow-soft border border-border/50 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-7 h-7 text-green-800" />
                </div>
                <h3 className=" text-xl font-semibold text-green-800 mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Story Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-20"
          >
            <div className="bg-gradient-card rounded-2xl p-8 md:p-12 shadow-soft border border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-800 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h2 className=" text-2xl font-bold text-foreground">
                  Our Story
                </h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Agroheal was born from a simple observation: while interest in
                  organic farming was growing, access to quality education and
                  practical experience remained limited to the privileged few.
                </p>
                <p>
                  We set out to change that. By combining expert-led digital
                  courses with hands-on farm experiences, we created a platform
                  that takes aspiring farmers from theory to practice—and
                  ultimately to earning.
                </p>
                <p>
                  Today, we're proud to have helped hundreds of individuals
                  discover the joy and profitability of sustainable agriculture.
                  This is just the beginning of our journey to transform lives
                  through organic farming.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <CTASection />
      </main>
    </div>
  );
};

export default About;
