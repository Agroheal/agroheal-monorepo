import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { showToast } from "@/components/ui/ToastComponent";

import { captureReferral, getActiveReferral, getSignupUrl } from "@/lib/referralManager";

const GREEN_CARD_CONFIG = {
  whatsappUrl:
    "https://wa.me/2349168055000?text=Hello%20Agroheal,%20I%20am%20interested%20in%20the%20Green%20Card%20Organic%20Food%20Revolution",
  videos: {
    farm: "",
    launch: "",
    testimonials: "",
    explainer: "",
    advert: "",
  },
};

export const Funnel1: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    captureReferral(searchParams);
  }, [searchParams]);

  const signupUrl = getSignupUrl();

  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleVideoClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    key: keyof typeof GREEN_CARD_CONFIG.videos,
    title: string
  ) => {
    e.preventDefault();
    const url = GREEN_CARD_CONFIG.videos[key];
    if (url && url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      showToast({
        variant: "warning",
        title: `${title} Coming Soon`,
        description: "The official video is being uploaded and will be available shortly.",
      });
    }
  };

  return (
    <div className="funnel-container">
      {/* Top Banner */}
      <div className="top">
        <div className="wrap">
          <span>🌱 A practical pathway to Healthy food and Wealthy communities.</span>
          <span>LEARN • FARM • CONSUME • MARKET</span>
        </div>
      </div>

      {/* Main Header */}
      <header>
        <div className="wrap">
          <nav aria-label="Main navigation">
            <a className="brand" href="#top">
              <span className="mark">GC</span>
              <span>
                AGROHEAL <span style={{ color: "#ffb15e" }}>GREEN CARD</span>
              </span>
            </a>
            <div className="navlinks">
              <a href="#ecosystem">Ecosystem</a>
              <a href="#videos">Videos</a>
              <a href="#opportunity">Opportunity</a>
              <a href="#faq">FAQs</a>
            </div>
            <Link className="btn small register-link" to={signupUrl}>
              GET MY GREEN CARD
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="top">
        {/* Hero Section */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">🌍 The Green Card Organic Food Revolution</span>
              <h1>
                Join the Revolution.
                <br />
                <span>Build Your Network.</span>
                <br />
                Unlock the Potential.
              </h1>
              <p>
                <strong>
                  A 5×7 matrix. Seven levels. A modelled opportunity of up to ₦15 million at the
                  Level 7 stage.
                </strong>{" "}
                With ₦10,000 qualifying monthly PQV per participant, the fully populated model
                projects around ₦12.86 million in combined monthly network payouts—subject to
                performance.
              </p>
              <div className="actions">
                <Link className="btn register-link" to={signupUrl}>
                  EXPLORE THE GREEN CARD →
                </Link>
                <a
                  className="btn outline whatsapp-link"
                  href={GREEN_CARD_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GET GUIDANCE ON WHATSAPP
                </a>
              </div>
              <p className="muted">
                See how the model works, review the conditions and decide whether it is right for
                you.
              </p>
            </div>
            <a
              className="preview video-link"
              href="#videos"
              onClick={(e) => handleVideoClick(e, "explainer", "Explainer Video")}
              aria-label="Watch Green Card explainer"
            >
              <div>
                <div className="play">▶</div>
                <strong>Discover the Green Card Opportunity</strong>
                <small>Watch the short explainer</small>
              </div>
            </a>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section className="section light" id="ecosystem">
          <div className="wrap">
            <div className="head">
              <div className="kicker">More than a card</div>
              <h2>One connected ecosystem for food, learning and opportunity</h2>
              <p>
                Your Green Card is the entry point to Agroheal’s LEAP (Learn to Earn Agribusiness
                Platform) and its growing organic food community.
              </p>
            </div>
            <div className="grid3">
              <article className="card">
                <div className="ico">🎓</div>
                <h3>Learn</h3>
                <p>
                  Build practical organic farming skills through LEAP training and community
                  guidance.
                </p>
              </article>
              <article className="card">
                <div className="ico">🌱</div>
                <h3>Produce</h3>
                <p>
                  Explore container gardening, Mushroom Village and other group-farming projects,
                  subject to local availability.
                </p>
              </article>
              <article className="card">
                <div className="ico">🥗</div>
                <h3>Access food</h3>
                <p>
                  Discover Mushroom Power and the producer–consumer marketplace concept as products
                  and services become available.
                </p>
              </article>
              <article className="card">
                <div className="ico">🤝</div>
                <h3>Connect locally</h3>
                <p>
                  Join WhatsApp guidance and local groups to learn, share progress and discover
                  available activities.
                </p>
              </article>
              <article className="card">
                <div className="ico">📣</div>
                <h3>Share the movement</h3>
                <p>
                  Learn about qualifying referral and network rewards under the official programme
                  rules.
                </p>
              </article>
              <article className="card">
                <div className="ico">🌍</div>
                <h3>Build the bigger vision</h3>
                <p>
                  Connect local growing, processing and food access through Mushroom Village,
                  Gingertown and Organic FoodNation.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How it connects Section */}
        <section className="section dark">
          <div className="wrap">
            <div className="head">
              <div className="kicker">How it connects</div>
              <h2>Learn. Farm. Consume. Market.</h2>
              <p>A practical pathway to take part in a community-based food ecosystem.</p>
            </div>
            <div className="journey">
              <div className="step">
                <b>STEP 01</b>
                <h3>LEARN</h3>
                <p>Build skills through LEAP training.</p>
              </div>
              <div className="step">
                <b>STEP 02</b>
                <h3>FARM</h3>
                <p>Explore local growing and group-production opportunities.</p>
              </div>
              <div className="step">
                <b>STEP 03</b>
                <h3>CONSUME</h3>
                <p>Discover food products and marketplace options.</p>
              </div>
              <div className="step">
                <b>STEP 04</b>
                <h3>MARKET</h3>
                <p>Connect with the producer–consumer network.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Videos Section */}
        <section className="section videos" id="videos">
          <div className="wrap">
            <div className="head">
              <div className="kicker">See it. Understand it. Decide.</div>
              <h2>Explore the movement in five videos</h2>
              <p>
                Start with the explainer, then see the work and hear directly from the people
                involved.
              </p>
            </div>
            <div className="grid3">
              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "explainer", "Explainer Video")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="thumb">
                    <div>
                      <div className="play">▶</div>
                      <b>Ecosystem overview</b>
                    </div>
                  </div>
                </a>
                <div className="vbody">
                  <h3>1. Explainer Video</h3>
                  <p>How the Green Card, LEAP, production, food access and community connect.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "explainer", "Explainer Video")}
                  >
                    WATCH EXPLAINER →
                  </a>
                </div>
              </article>

              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "farm", "Farm Tour")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="thumb">
                    <div>
                      <div className="play">▶</div>
                      <b>See the work</b>
                    </div>
                  </div>
                </a>
                <div className="vbody">
                  <h3>2. Farm Tour</h3>
                  <p>See farming activities and the practical work behind the ecosystem.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "farm", "Farm Tour")}
                  >
                    WATCH FARM TOUR →
                  </a>
                </div>
              </article>

              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "launch", "Launch Video")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="thumb">
                    <div>
                      <div className="play">▶</div>
                      <b>Meet the movement</b>
                    </div>
                  </div>
                </a>
                <div className="vbody">
                  <h3>3. Launch Video</h3>
                  <p>Discover the mission and invitation to build a stronger food ecosystem.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "launch", "Launch Video")}
                  >
                    WATCH LAUNCH →
                  </a>
                </div>
              </article>

              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "testimonials", "Testimonials Video")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="thumb">
                    <div>
                      <div className="play">▶</div>
                      <b>Hear member stories</b>
                    </div>
                  </div>
                </a>
                <div className="vbody">
                  <h3>4. Testimonials</h3>
                  <p>Hear individual experiences; results and experiences may differ.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "testimonials", "Testimonials Video")}
                  >
                    WATCH STORIES →
                  </a>
                </div>
              </article>

              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "advert", "Campaign Advert")}
                  style={{ textDecoration: "none" }}
                >
                  <div className="thumb">
                    <div>
                      <div className="play">▶</div>
                      <b>Feel the vision</b>
                    </div>
                  </div>
                </a>
                <div className="vbody">
                  <h3>5. Campaign Advert</h3>
                  <p>Catch the energy of the Green Card Organic Food Revolution.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "advert", "Campaign Advert")}
                  >
                    WATCH ADVERT →
                  </a>
                </div>
              </article>

              <article className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="ico">💬</div>
                <h3>Need guidance?</h3>
                <p>Ask questions and find out how to connect with your local community group.</p>
                <a
                  className="btn small whatsapp-link"
                  href={GREEN_CARD_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: "16px", alignSelf: "flex-start" }}
                >
                  JOIN WHATSAPP →
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* Opportunity Section */}
        <section className="section light" id="opportunity">
          <div className="wrap">
            <div className="head">
              <div className="kicker">The numbers behind the opportunity</div>
              <h2>See the entry model and the monthly 5×7 potential</h2>
              <p>
                The figures below are model projections for a fully populated, qualifying matrix. They
                describe potential total network payouts, not guaranteed earnings for an individual.
              </p>
            </div>

            {/* 3 Stat Cards with enhanced contrast numbers */}
            <div className="grid3" style={{ marginBottom: "20px" }}>
              <article className="card stat-card">
                <div className="kicker">Level 7 stage</div>
                <div className="price stat-price">Up to ₦15m</div>
                <p>
                  Modelled opportunity for a completed qualifying 5×7 network, subject to the official
                  compensation plan.
                </p>
              </article>
              <article className="card stat-card">
                <div className="kicker">Monthly PQV</div>
                <div className="price stat-price">₦10,000</div>
                <p>
                  Qualifying monthly personal purchase volume assumed for each active participant in
                  the illustration.
                </p>
              </article>
              <article className="card stat-card">
                <div className="kicker">Full-matrix monthly payout</div>
                <div className="price stat-price">≈ ₦12.86m</div>
                <p>
                  Illustrative combined payout across the seven levels using the current descending
                  rate model—not an individual income promise.
                </p>
              </article>
            </div>

            {/* Offer Box */}
            <div className="offer">
              <div className="offer-grid">
                <div>
                  <div className="kicker">Green Card Starter Combo</div>
                  <h2>Get started for</h2>
                  <div className="price">₦15,000</div>
                  <p>
                    One pathway combining registration, a mushroom farm slot and the Mushroom Power
                    Starter Pack.
                  </p>
                  <Link className="btn register-link" to={signupUrl}>
                    REGISTER / GET STARTED →
                  </Link>
                  <div className="callout">
                    <strong>Direct referral illustration: up to ₦2,500 per complete Starter Combo</strong>
                    <br />
                    <span style={{ fontSize: ".91rem" }}>
                      ₦1,000 Green Card referral + ₦500 farm-slot referral + ₦1,000 Mushroom Power referral,
                      when all three components qualify under the current plan.
                    </span>
                  </div>
                </div>
                <div>
                  <h3>What the ₦15,000 covers</h3>
                  <ul className="breakdown">
                    <li>
                      <b>₦2,000 Green Card:</b> ₦1,000 referral / ₦1,000 Agroheal.
                    </li>
                    <li>
                      <b>₦5,000 farm slot:</b> ₦3,500 production / ₦1,000 Agroheal / ₦500 referral.
                    </li>
                    <li>
                      <b>₦8,000 Mushroom Power Starter Pack:</b> ₦4,500 product / ₦1,000 referral / ₦750
                      Agroheal / ₦1,750 rewards pool.
                    </li>
                  </ul>
                  <div className="callout">
                    <strong>₦1,750 rewards pool:</strong> ₦1,350 5×7 network commissions + ₦200 leadership pool
                    + ₦200 quarterly car awards.
                  </div>
                  <div className="callout">
                    <strong>Green Card Points:</strong> 30,000 programme points—15,000 for production
                    participation and 15,000 for consumption/marketplace use, subject to unlock conditions
                    and published rules. Points are not cash.
                  </div>
                </div>
              </div>
            </div>

            {/* 5x7 Matrix Explanation & Enhanced Table */}
            <div className="card matrix-table-card" style={{ marginTop: "20px" }}>
              <h3>How the 5×7 matrix reaches Level 7</h3>
              <p>
                Each participant invites five qualifying people, and each of those people does the same,
                creating a theoretical seven-level structure. With ₦10,000 qualifying monthly PQV per
                active participant, the 15% allocation is ₦1,500 per participant. Applying the current
                descending level rates to a fully populated matrix projects approximately ₦12.86 million in
                combined monthly payouts across all seven levels.
              </p>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Potential positions in a full 5×7 matrix</th>
                      <th>Illustrative payout per position / month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Level 1</td>
                      <td>5</td>
                      <td>₦202.01</td>
                    </tr>
                    <tr>
                      <td>Level 2</td>
                      <td>25</td>
                      <td>₦189.78</td>
                    </tr>
                    <tr>
                      <td>Level 3</td>
                      <td>125</td>
                      <td>₦177.54</td>
                    </tr>
                    <tr>
                      <td>Level 4</td>
                      <td>625</td>
                      <td>₦165.31</td>
                    </tr>
                    <tr>
                      <td>Level 5</td>
                      <td>3,125</td>
                      <td>₦153.07</td>
                    </tr>
                    <tr>
                      <td>Level 6</td>
                      <td>15,625</td>
                      <td>₦140.84</td>
                    </tr>
                    <tr>
                      <td>Level 7</td>
                      <td>78,125</td>
                      <td>₦128.60</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="smallnote">
                Theoretical matrix capacity is 97,655 positions (5 + 25 + 125 + 625 + 3,125 + 15,625 +
                78,125). The approximately ₦12.86 million figure is the sum of the illustrative per-position
                payouts across all seven levels when every position is filled and qualifies at ₦10,000 monthly
                PQV. Real participation, eligibility, purchase volume, timing, adjustments and the approved
                compensation plan can change outcomes. The ₦15 million Level 7 figure is a separate
                programme target/modelled opportunity and must not be interpreted as a guaranteed payment to
                every member.
              </p>
            </div>

            {/* Next Steps Buttons */}
            <div className="grid2" style={{ marginTop: "20px" }}>
              <article className="card">
                <div className="ico">🟠</div>
                <h3>Ready to register?</h3>
                <p>Use the official registration link and review the programme terms.</p>
                <Link className="btn register-link" to={signupUrl} style={{ marginTop: "15px" }}>
                  GET MY GREEN CARD
                </Link>
              </article>
              <article className="card">
                <div className="ico">🟢</div>
                <h3>Prefer guidance first?</h3>
                <p>Join WhatsApp for onboarding help and local community group information.</p>
                <a
                  className="btn whatsapp-link"
                  href={GREEN_CARD_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: "15px" }}
                >
                  JOIN WHATSAPP COMMUNITY
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="section dark" id="faq">
          <div className="wrap">
            <div className="head">
              <div className="kicker">Before you join</div>
              <h2>Frequently asked questions</h2>
            </div>
            <div style={{ maxWidth: "850px", margin: "auto" }}>
              <details>
                <summary>Is this only an investment scheme?</summary>
                <p>
                  No. It is presented as a food and agribusiness participation ecosystem involving
                  learning, production, products and community activity. Do not join on the assumption of
                  guaranteed financial returns.
                </p>
              </details>
              <details>
                <summary>Are referral or matrix rewards guaranteed?</summary>
                <p>
                  No. They depend on qualifying activity, eligibility, actual network participation and the
                  official compensation plan. Figures on this page are illustrations, not promises of
                  income.
                </p>
              </details>
              <details>
                <summary>What are Green Card Points?</summary>
                <p>
                  Programme points intended for designated production and consumption purposes. They are
                  not cash; usage and unlock conditions are governed by the published rules.
                </p>
              </details>
              <details>
                <summary>How do I join a local group?</summary>
                <p>
                  Use the WhatsApp link on this page for onboarding guidance and information about your
                  local community group.
                </p>
              </details>
              <details>
                <summary>Are farm slots and products available everywhere?</summary>
                <p>
                  Availability can vary by location, season and project capacity. Confirm availability,
                  delivery, terms and timelines before paying.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="cta">
          <div className="wrap">
            <h2>Help build a healthier, more food-secure future.</h2>
            <p>
              Get your Green Card, learn with the community and discover how you can participate in the
              Green Card Producer–Consumer Organic Food Ecosystem.
            </p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <Link className="btn register-link" to={signupUrl}>
                GET MY GREEN CARD NOW →
              </Link>
              <a
                className="btn whatsapp-link"
                href={GREEN_CARD_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "white", color: "#064e25" }}
              >
                WHATSAPP GUIDANCE
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="foot">
            <div className="brand">
              <span className="mark">GC</span>
              <span>
                AGROHEAL GREEN CARD
                <br />
                <span style={{ fontWeight: 600 }}>
                  Grow Healthy Food • Live Healthy • Build Wealth
                </span>
              </span>
            </div>
            <div className="footlinks">
              <a href="#ecosystem">Ecosystem</a>
              <a href="#videos">Videos</a>
              <a href="#opportunity">Opportunity</a>
              <a href="#faq">FAQs</a>
              <a
                className="whatsapp-link"
                href={GREEN_CARD_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
          <p className="fine">
            Programme features, fees, points, product availability and participation terms may change.
            Confirm details through official Agroheal channels. Green Card Points are not cash. Farming,
            product sales and referral/network rewards depend on actual activity, costs, qualifying
            conditions and published rules. No income, profit, health outcome or financial return is
            guaranteed. This page is informational and does not replace official terms and conditions.
          </p>
          <p style={{ opacity: 0.75, marginBottom: 0 }}>
            © {new Date().getFullYear()} Agroheal Solutions Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Bar */}
      <div className="sticky">
        <div className="wrap">
          <Link className="btn register-link" to={signupUrl}>
            GET GREEN CARD
          </Link>
          <a
            className="btn whatsapp-link"
            href={GREEN_CARD_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "white", color: "#064e25" }}
          >
            WHATSAPP
          </a>
        </div>
      </div>

      {/* Embedded Scoped Styles Preserving 100% of Visual Fidelity with Key Contrast Enhancements */}
      <style>{`
        .funnel-container {
          --g: #087b35;
          --gd: #045626;
          --deep: #033d1c;
          --o: #ff8a1d;
          --od: #e56d00;
          --w: #fff;
          --ink: #143321;
          --line: rgba(255, 255, 255, 0.22);
          --soft: #f5fff7;
          --shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
          --r: 20px;
          margin: 0;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          background: var(--g);
          color: var(--w);
          line-height: 1.6;
          min-height: 100vh;
        }
        .funnel-container a { color: inherit; }
        .funnel-container .wrap {
          width: min(1120px, calc(100% - 32px));
          margin: auto;
        }
        .funnel-container .top {
          background: var(--deep);
          font-size: 0.88rem;
          padding: 8px 0;
        }
        .funnel-container .top .wrap {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .funnel-container header {
          padding: 15px 0;
          border-bottom: 1px solid var(--line);
        }
        .funnel-container nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .funnel-container .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 950;
          text-decoration: none;
        }
        .funnel-container .mark {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 13px;
          background: var(--o);
          color: var(--deep);
          font-weight: 1000;
        }
        .funnel-container .navlinks {
          display: flex;
          gap: 20px;
          font-weight: 750;
          font-size: 0.92rem;
        }
        .funnel-container .navlinks a { text-decoration: none; }
        .funnel-container .navlinks a:hover { color: #ffb15e; }
        .funnel-container .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          border-radius: 999px;
          background: var(--o);
          color: #18321e;
          text-decoration: none;
          font-weight: 900;
          border: 0;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.13);
          transition: 0.18s;
        }
        .funnel-container .btn:hover {
          background: #ffa64e;
          transform: translateY(-2px);
        }
        .funnel-container .btn.outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.75);
          box-shadow: none;
        }
        .funnel-container .btn.outline:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: white;
        }
        .funnel-container .btn.small {
          padding: 9px 15px;
          font-size: 0.88rem;
        }
        .funnel-container .hero {
          padding: 65px 0;
          background: radial-gradient(circle at 83% 18%, rgba(255, 138, 29, 0.22), transparent 28%),
            linear-gradient(135deg, var(--g), var(--gd));
        }
        .funnel-container .hero-grid {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 42px;
          align-items: center;
        }
        .funnel-container .eyebrow,
        .funnel-container .kicker {
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 900;
        }
        .funnel-container .eyebrow {
          display: inline-block;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 7px 12px;
        }
        .funnel-container h1 {
          font-size: clamp(2.5rem, 5.2vw, 4.6rem);
          line-height: 1.02;
          letter-spacing: -0.045em;
          margin: 20px 0;
          font-weight: 950;
        }
        .funnel-container h1 span { color: #ffb15e; }
        .funnel-container .hero p {
          font-size: 1.1rem;
          color: #f0fff4;
          max-width: 650px;
        }
        .funnel-container .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 25px 0 15px;
        }
        .funnel-container .muted {
          opacity: 0.86;
          font-size: 0.9rem !important;
        }
        /* Enhanced smooth glass preview card */
        .funnel-container .preview {
          min-height: 320px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          border-radius: 25px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(140deg, rgba(3, 61, 28, 0.82), rgba(4, 86, 38, 0.65));
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow);
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .funnel-container .preview:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 177, 94, 0.5);
        }
        .funnel-container .play {
          width: 70px;
          height: 70px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          margin: 0 auto 14px;
          background: var(--o);
          color: var(--deep);
          font-size: 1.6rem;
          box-shadow: 0 0 25px rgba(255, 138, 29, 0.45);
          transition: transform 0.18s ease;
        }
        .funnel-container .preview:hover .play {
          transform: scale(1.08);
        }
        .funnel-container .preview strong {
          font-size: 1.2rem;
          display: block;
        }
        .funnel-container .preview small {
          display: block;
          margin-top: 7px;
          color: #d1fae5;
        }
        .funnel-container .section { padding: 70px 0; }
        .funnel-container .light {
          background: var(--soft);
          color: var(--ink);
        }
        .funnel-container .dark { background: var(--gd); }
        .funnel-container .head {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 34px;
        }
        .funnel-container .kicker { color: #ffb15e; }
        .funnel-container .light .kicker { color: var(--od); }
        .funnel-container h2 {
          font-size: clamp(2rem, 3.5vw, 3rem);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 10px 0 14px;
          font-weight: 900;
        }
        .funnel-container .head p {
          font-size: 1.03rem;
          margin: 0;
          opacity: 0.9;
        }
        .funnel-container .grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .funnel-container .grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .funnel-container .card {
          padding: 23px;
          border: 1px solid var(--line);
          border-radius: var(--r);
          background: rgba(255, 255, 255, 0.08);
        }
        .funnel-container .light .card {
          background: white;
          border-color: #d8eadc;
          box-shadow: 0 8px 24px rgba(10, 70, 30, 0.05);
        }
        .funnel-container .ico {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }
        .funnel-container .card h3 {
          margin: 0 0 8px;
          font-size: 1.18rem;
          font-weight: 850;
        }
        .funnel-container .card p {
          margin: 0;
          opacity: 0.9;
        }
        .funnel-container .journey {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .funnel-container .step {
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
        }
        .funnel-container .step b {
          color: #ffb15e;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
        }
        .funnel-container .step h3 {
          margin: 6px 0;
          font-weight: 850;
        }
        .funnel-container .step p {
          margin: 0;
          font-size: 0.93rem;
        }
        .funnel-container .videos .card {
          padding: 0;
          overflow: hidden;
        }
        .funnel-container .thumb {
          display: grid;
          place-items: center;
          min-height: 140px;
          background: linear-gradient(135deg, #05642b, #0d8e43);
          border-bottom: 1px solid var(--line);
          text-align: center;
        }
        .funnel-container .thumb .play {
          width: 52px;
          height: 52px;
          font-size: 1.25rem;
          margin-bottom: 6px;
        }
        .funnel-container .vbody { padding: 20px; }
        .funnel-container .vbody p { margin-bottom: 15px; }
        .funnel-container .offer {
          padding: 30px;
          border-radius: 25px;
          background: linear-gradient(135deg, #064e25, #087b35);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          color: white;
        }
        .funnel-container .offer-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 28px;
          align-items: start;
        }
        .funnel-container .price {
          font-size: clamp(2.6rem, 5vw, 3.8rem);
          font-weight: 950;
          color: #ffb15e;
          line-height: 1.05;
          margin: 10px 0;
        }
        /* CONTRAST FIX 1: High contrast numbers on white stat cards */
        .funnel-container .light .card.stat-card .stat-price {
          color: #045626 !important;
          font-size: clamp(2.2rem, 3.8vw, 3rem);
          letter-spacing: -0.03em;
        }
        .funnel-container .breakdown {
          padding-left: 20px;
          margin: 10px 0;
        }
        .funnel-container .breakdown li { margin: 7px 0; }
        .funnel-container .callout {
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid var(--line);
          border-radius: 15px;
          padding: 16px;
          margin-top: 14px;
        }
        .funnel-container .callout strong { color: #ffb15e; }
        .funnel-container .tablewrap {
          overflow-x: auto;
          margin-top: 15px;
        }
        .funnel-container table {
          border-collapse: collapse;
          width: 100%;
          min-width: 470px;
          font-size: 0.94rem;
        }
        /* CONTRAST FIX 2: Dark, crisp headers & subtle row borders on white card */
        .funnel-container .matrix-table-card table th {
          color: #045626 !important;
          font-weight: 850;
          border-bottom: 2px solid #087b35;
          padding: 12px 14px;
          text-align: left;
        }
        .funnel-container .matrix-table-card table td {
          border-bottom: 1px solid #e2ece4;
          padding: 11px 14px;
          color: #143321;
          font-weight: 550;
        }
        .funnel-container .matrix-table-card table tr:hover td {
          background: #f7fbf8;
        }
        .funnel-container th:last-child,
        .funnel-container td:last-child {
          text-align: right;
        }
        .funnel-container .smallnote {
          font-size: 0.84rem;
          opacity: 0.86;
          margin-top: 12px;
          line-height: 1.55;
        }
        .funnel-container details {
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
        }
        .funnel-container summary {
          cursor: pointer;
          font-weight: 850;
          transition: color 0.15s;
        }
        .funnel-container summary:hover {
          color: #ffb15e;
        }
        .funnel-container details p {
          opacity: 0.9;
          margin-top: 10px;
          margin-bottom: 0;
          color: #d1fae5;
        }
        .funnel-container .cta {
          padding: 52px 0;
          text-align: center;
          background: var(--o);
          color: #19351f;
        }
        .funnel-container .cta h2 {
          max-width: 800px;
          margin: 0 auto 14px;
          color: #143321;
        }
        .funnel-container .cta p {
          max-width: 680px;
          margin: 0 auto 22px;
          font-size: 1.05rem;
          font-weight: 550;
        }
        .funnel-container .cta .btn {
          background: var(--deep);
          color: white;
        }
        .funnel-container .cta .btn:hover {
          background: #022712;
        }
        .funnel-container footer {
          background: var(--deep);
          padding: 30px 0 90px;
          font-size: 0.9rem;
        }
        .funnel-container .foot {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .funnel-container .footlinks {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        .funnel-container .footlinks a {
          text-decoration: none;
          color: #a7f3d0;
        }
        .funnel-container .footlinks a:hover {
          color: white;
        }
        .funnel-container .fine {
          font-size: 0.8rem;
          color: #cce6d3;
          margin-top: 18px;
          line-height: 1.55;
        }
        .funnel-container .sticky {
          display: none;
          position: fixed;
          z-index: 50;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 9px 12px;
          background: rgba(3, 61, 28, 0.97);
          backdrop-filter: blur(8px);
          border-top: 1px solid var(--line);
        }
        .funnel-container .sticky .wrap {
          display: flex;
          gap: 8px;
        }
        .funnel-container .sticky .btn {
          flex: 1;
          padding: 11px 8px;
          font-size: 0.88rem;
        }

        @media (max-width: 850px) {
          .funnel-container .navlinks { display: none; }
          .funnel-container .hero-grid,
          .funnel-container .offer-grid { grid-template-columns: 1fr; }
          .funnel-container .hero { padding: 45px 0; }
          .funnel-container .grid3 { grid-template-columns: 1fr 1fr; }
          .funnel-container .journey { grid-template-columns: 1fr 1fr; }
          .funnel-container .sticky { display: block; }
        }

        @media (max-width: 560px) {
          .funnel-container .wrap { width: calc(100% - 26px); }
          .funnel-container .top .wrap { justify-content: center; text-align: center; }
          .funnel-container .hero .actions { flex-direction: column; }
          .funnel-container .hero .actions .btn { width: 100%; }
          .funnel-container .preview { min-height: 230px; }
          .funnel-container .section { padding: 52px 0; }
          .funnel-container .grid3,
          .funnel-container .grid2,
          .funnel-container .journey { grid-template-columns: 1fr; }
          .funnel-container .card { padding: 20px; }
          .funnel-container .offer { padding: 20px; }
          .funnel-container footer { padding-bottom: 110px; }
        }
      `}</style>
    </div>
  );
};

export default Funnel1;
