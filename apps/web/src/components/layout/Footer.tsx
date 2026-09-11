import { Link } from "react-router-dom";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  platform: [
    { name: "How It Works", href: "/how-it-works" },
    { name: "Farm Slots", href: "/farm-slots" },
    { name: "Courses", href: "/courses" },
    { name: "Affiliate Program", href: "/affiliate" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    // { name: "Blog", href: "/blog" },
  ],
  legal: [
    { name: "Terms of Service", href: "/legal#terms" },
    { name: "Group Farming Agreement", href: "/legal#agreement" },
    { name: "Affiliate & 5x7 Matrix", href: "/legal#affiliate" },
    { name: "Wallet & Reinvestment", href: "/legal#wallet" },
    { name: "Risk Disclosure", href: "/legal#risk" },
    { name: "Privacy Policy & NDPR", href: "/legal#privacy" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#031d0f] border-t border-green-950 text-white relative z-10">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 rounded-full bg-[#041a0d] border border-green-800/40 flex items-center justify-center transition-all duration-300 group-hover:border-[#d1ef75]/40">
                <Leaf className="w-5 h-5 text-[#d1ef75]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Agroheal
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light font-sans">
              Empowering a generation of organic farmers through education,
              practice, and community.
            </p>
            <div className="space-y-3 text-sm text-gray-400 font-light font-sans">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-700 shrink-0" />
                <a
                  href="mailto:admin@agroheal.solutions"
                  className="hover:text-[#d1ef75] transition-colors"
                >
                  <span>admin@agroheal.solutions</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-700 shrink-0" />
                <a href="tel:+2349168055000" className="hover:text-[#d1ef75] transition-colors">
                  <span>+234 916 8055 000</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-700 shrink-0" />
                <a 
                  href="https://www.google.com/maps/place/Olowe+Farm/@6.8138766,3.9178944,17z/data=!3m1!4b1!4m6!3m5!1s0x103969e8661c18e5:0x7906309f84337a84!8m2!3d6.8138713!4d3.9204693!16s%2Fg%2F11jjm31nr8!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoASAFQAw%3D%3D"
                  className="hover:text-[#d1ef75] transition-colors"
                >
                  <span>
                    1 Olowu Street, Owu, Ijebu-Ode, Ogun State, Nigeria
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase text-white mb-6">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#d1ef75] transition-colors text-sm font-light font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase text-white mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#d1ef75] transition-colors text-sm font-light font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase text-white mb-6">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#d1ef75] transition-colors text-sm font-light font-sans"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Statutory Regulatory & Non-Investment Notice */}
        <div className="border-t border-green-950 mt-12 pt-8 text-xs text-gray-400 font-light font-sans space-y-2">
          <p className="font-bold text-gray-300 text-xs uppercase tracking-wider">
            Regulatory Notice — We Are Not An Investment Platform
          </p>
          <p className="leading-relaxed text-gray-400 max-w-5xl">
            AgroHeal Solutions Ltd (RC 8231879) is a cooperative agribusiness education and participatory farming platform. <strong>AgroHeal is not an investment company, financial institution, broker, or collective investment scheme (CIS).</strong> Slot contributions directly fund biological agricultural assets (commercial fruiting substrate bags, grow-houses, automated humidification racks, and farm labor). Any reference to earnings, harvest shares, or percentages (e.g. <em>&quot;earn up to 40%&quot;</em>) represents estimated, projected surplus proceeds derived strictly from realized agricultural harvests and commercial commodity off-taker sales, not guaranteed fixed financial interest or deposit yields. Agriculture carries inherent biological, weather, and commodity market risks.
          </p>
        </div>

        <div className="border-t border-green-950 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs md:text-sm font-light font-sans">
            © {new Date().getFullYear()} AgroHeal Solutions Ltd., duly
            incorporated with Nigeria’s Corporate Affairs Commission (RC
            8231879).
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="#"
              className="text-gray-400 hover:text-[#d1ef75] transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-[#d1ef75] transition-colors"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-[#d1ef75] transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
