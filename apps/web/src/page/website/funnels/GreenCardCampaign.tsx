import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@/components/ui/ToastComponent";
import { captureReferral, getActiveReferral } from "@/lib/referralManager";

const GREEN_CARD_CONFIG = {
  whatsappUrl:
    "https://wa.me/2349168055000?text=Hello%20Agroheal,%20I%20am%20interested%20in%20the%20Green%20Card%20Organic%20Food%20Revolution",
  defaultOnPageSponsor: "AYEG68",
  defaultStickySponsor: "V7GK3",
  videos: {
    farm: "https://youtu.be/MqQ3sYcPDTE?si=rZRpBGpuWrUZ6r-A",
    launch: "https://youtu.be/vH6_BLQGj0E?si=H6tEBkYHraMnTn7Q",
    testimonials: "https://youtu.be/A6Q89j6eSpo?si=QAA9QKco2ukn_oir",
    explainer: "https://youtube.com/shorts/kz5_TZcp4z0?si=eK3xK9XuUhp_P72U",
    advert: "https://youtube.com/shorts/kz5_TZcp4z0?si=eK3xK9XuUhp_P72U",
  },
};

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

interface ActiveVideo {
  key: string;
  title: string;
  url: string;
  videoId: string;
}

export const GreenCardCampaign: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeVideoModal, setActiveVideoModal] = useState<ActiveVideo | null>(null);

  // Capture incoming referral parameters across localStorage, sessionStorage, and 30-day Cookie
  useEffect(() => {
    captureReferral(searchParams);
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveVideoModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute registration URLs: If a prospect arrived with a member's link (or has one stored), retain it strictly.
  // Otherwise, default company traffic routes to the designated leader marketing codes.
  const { onPageSignupUrl, stickySignupUrl } = useMemo(() => {
    const activeCode = getActiveReferral(searchParams);
    if (activeCode) {
      const url = `/signup?ref=${encodeURIComponent(activeCode)}`;
      return { onPageSignupUrl: url, stickySignupUrl: url };
    }
    return {
      onPageSignupUrl: `/signup?ref=${GREEN_CARD_CONFIG.defaultOnPageSponsor}`,
      stickySignupUrl: `/signup?ref=${GREEN_CARD_CONFIG.defaultStickySponsor}`,
    };
  }, [searchParams]);

  const handleVideoClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    key: keyof typeof GREEN_CARD_CONFIG.videos,
    title: string
  ) => {
    e.preventDefault();
    const url = GREEN_CARD_CONFIG.videos[key];
    const videoId = getYouTubeId(url);
    if (url && videoId) {
      setActiveVideoModal({ key, title, url, videoId });
    } else {
      showToast({
        variant: "warning",
        title: `${title} Coming Soon`,
        description: "The official video is being uploaded and will be available shortly.",
      });
    }
  };

  return (
    <div className="v8-funnel-root">
      <main id="top">
        {/* ── HERO SECTION (COMPACT & FULLY VISIBLE ON FIRST SCREEN) ── */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-text-block">
                <span className="eyebrow">🌍 THE GREENCARD ORGANIC FOOD REVOLUTION</span>
                <h1>
                  Join The Health And Wealth Revolution.<br />
                  <span>Let's Grow Organic Food And Wealth Together.</span>
                </h1>
                <p>
                  <strong>
                    We have a vision to raise millions of healthy and wealthy Africans before 2030 using the
                    instrumentality of organic agribusiness, with Nigeria as the springboard.
                  </strong>
                </p>
              </div>

              {/* Explainer Video Preview */}
              <a
                className="preview video-link"
                href="#videos"
                onClick={(e) => handleVideoClick(e, "explainer", "GreenCard Explainer Video")}
                aria-label="Watch Green Card explainer"
              >
                <div>
                  <strong>GreenCard Explainer Video</strong>
                  <div className="play">▶</div>
                  <small>WATCH</small>
                </div>
              </a>
            </div>

            {/* CTAs Placed Immediately Below Hero & Explainer - Above the Fold */}
            <div className="actions hero-actions">
              <a className="btn register-link" href={onPageSignupUrl}>
                GET THE GREENCARD →
              </a>
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
              See how the model works, review the conditions and decide whether it is right for you.
            </p>
          </div>
        </section>

        {/* ── ECOSYSTEM SECTION ── */}
        <section className="section light" id="ecosystem">
          <div className="wrap">
            <div className="head">
              <div className="kicker">More than a card</div>
              <h2>One connected ecosystem for food, learning and opportunity</h2>
              <p>
                Your Green Card is the entry point to Agroheal’s LEAP (Learn to Earn Agribusiness Platform) and its
                growing organic food community.
              </p>
            </div>
            <div className="grid3">
              <article className="card">
                <div className="ico">🎓</div>
                <h3>Learn</h3>
                <p>Build practical organic farming skills through LEAP training and community guidance.</p>
              </article>
              <article className="card">
                <div className="ico">🌱</div>
                <h3>Produce</h3>
                <p>Explore container gardening, Mushroom Village and other group-farming projects, subject to local availability.</p>
              </article>
              <article className="card">
                <div className="ico">🥗</div>
                <h3>Access food</h3>
                <p>Discover Mushroom Power and the producer–consumer marketplace concept as products and services become available.</p>
              </article>
              <article className="card">
                <div className="ico">🤝</div>
                <h3>Connect locally</h3>
                <p>Join WhatsApp guidance and local groups to learn, share progress and discover available activities.</p>
              </article>
              <article className="card">
                <div className="ico">📣</div>
                <h3>Share the movement</h3>
                <p>Learn about qualifying referral and network rewards under the official programme rules.</p>
              </article>
              <article className="card">
                <div className="ico">🌍</div>
                <h3>Build the bigger vision</h3>
                <p>Connect local growing, processing and food access through Mushroom Village, Gingertown and Organic FoodNation.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── VIDEOS SECTION ── */}
        <section className="section videos" id="videos">
          <div className="wrap">
            <div className="head">
              <div className="kicker">See it. Understand it. Decide.</div>
              <h2>Explore the movement in four videos</h2>
            </div>
            <div className="grid3">
              <article className="card">
                <a
                  className="video-link"
                  href="#videos"
                  onClick={(e) => handleVideoClick(e, "farm", "Farm Tour Video")}
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
                  <h3>1. Farm Tour</h3>
                  <p>See farming activities and the practical work behind the ecosystem.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "farm", "Farm Tour Video")}
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
                  <h3>2. Launch Video</h3>
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
                  <h3>3. Testimonials</h3>
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
                  onClick={(e) => handleVideoClick(e, "advert", "Short Explainer Video")}
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
                  <h3>4. Short Explainer Video</h3>
                  <p>A concise introduction to the Green Card Organic Food Ecosystem and how to take the next step.</p>
                  <a
                    className="btn small video-link"
                    href="#videos"
                    onClick={(e) => handleVideoClick(e, "advert", "Short Explainer Video")}
                  >
                    WATCH SHORT EXPLAINER →
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

        {/* ── OPPORTUNITY SECTION ── */}
        <section className="section light" id="opportunity">
          <div className="wrap">
            <div className="head">
              <div className="kicker">The numbers behind the opportunity</div>
              <h2>See the entry model and the monthly 5×7 potential</h2>
              <p>
                The figures below are model projections for a fully populated, qualifying matrix. They describe potential
                total network payouts, not guaranteed earnings for an individual.
              </p>
            </div>

            <div className="grid3" style={{ marginBottom: "20px" }}>
              <article className="card">
                <div className="kicker">Level 7 stage</div>
                <div className="price" style={{ fontSize: "2.25rem" }}>
                  Up to ₦15m
                </div>
                <p>Modelled opportunity for a completed qualifying 5×7 network, subject to the official compensation plan.</p>
              </article>
              <article className="card">
                <div className="kicker">Monthly PQV</div>
                <div className="price" style={{ fontSize: "2.25rem" }}>
                  ₦10,000
                </div>
                <p>Qualifying monthly personal purchase volume assumed for each active participant in the illustration.</p>
              </article>
              <article className="card">
                <div className="kicker">Full-matrix monthly payout</div>
                <div className="price" style={{ fontSize: "2.25rem" }}>
                  ≈ ₦12.86m
                </div>
                <p>Illustrative combined payout across the seven levels using the current descending rate model—not an individual income promise.</p>
              </article>
            </div>

            {/* Offer Combo Box */}
            <div className="offer">
              <div className="offer-grid">
                <div>
                  <div className="kicker">Green Card Starter Combo</div>
                  <h2>Get started for</h2>
                  <div className="price">₦15,000</div>
                  <p>One pathway combining registration, a mushroom farm slot and the Mushroom Power Starter Pack.</p>
                  <a className="btn register-link" href={onPageSignupUrl}>
                    REGISTER / GET STARTED →
                  </a>
                  <div className="callout">
                    <strong>Direct referral illustration: up to ₦2,500 per complete Starter Combo</strong>
                    <br />
                    <span style={{ fontSize: "0.91rem" }}>
                      ₦1,000 Green Card referral + ₦500 farm-slot referral + ₦1,000 Mushroom Power referral, when all three components qualify under the current plan.
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
                      <b>₦8,000 Mushroom Power Starter Pack:</b> ₦4,500 product / ₦1,000 referral / ₦750 Agroheal / ₦1,750 rewards pool.
                    </li>
                  </ul>
                  <div className="callout">
                    <strong>₦1,750 rewards pool:</strong> ₦1,350 5×7 network commissions + ₦200 leadership pool + ₦200 quarterly car awards.
                  </div>
                  <div className="callout">
                    <strong>Green Card Points:</strong> 30,000 programme points—15,000 for production participation and 15,000 for consumption/marketplace use, subject to unlock conditions and published rules. Points are not cash.
                  </div>
                </div>
              </div>
            </div>

            {/* 5x7 Matrix Tier Table */}
            <div className="card" style={{ marginTop: "20px" }}>
              <h3>How the 5×7 matrix reaches Level 7</h3>
              <p>
                Each participant invites five qualifying people, and each of those people does the same, creating a
                theoretical seven-level structure. With ₦10,000 qualifying monthly PQV per active participant, the 15%
                allocation is ₦1,500 per participant. Applying the current descending level rates to a fully populated
                matrix projects approximately ₦12.86 million in combined monthly payouts across all seven levels.
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
                Theoretical matrix capacity is 97,655 positions (5 + 25 + 125 + 625 + 3,125 + 15,625 + 78,125). The
                approximately ₦12.86 million figure is the sum of the illustrative per-position payouts across all seven
                levels when every position is filled and qualifies at ₦10,000 monthly PQV. Real participation, eligibility,
                purchase volume, timing, adjustments and the approved compensation plan can change outcomes. The ₦15 million
                Level 7 figure is a separate programme target/modelled opportunity and must not be interpreted as a
                guaranteed payment to every member.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid2" style={{ marginTop: "20px" }}>
              <article className="card">
                <div className="ico">🟠</div>
                <h3>Ready to register?</h3>
                <p>Use the official registration link and review the programme terms.</p>
                <a className="btn register-link" href={onPageSignupUrl} style={{ marginTop: "15px" }}>
                  GET MY GREEN CARD
                </a>
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

        {/* ── FAQ SECTION ── */}
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
                  No. It is presented as a food and agribusiness participation ecosystem involving learning, production,
                  products and community activity. Do not join on the assumption of guaranteed financial returns.
                </p>
              </details>
              <details>
                <summary>Are referral or matrix rewards guaranteed?</summary>
                <p>
                  No. They depend on qualifying activity, eligibility, actual network participation and the official
                  compensation plan. Figures on this page are illustrations, not promises of income.
                </p>
              </details>
              <details>
                <summary>What are Green Card Points?</summary>
                <p>
                  Programme points intended for designated production and consumption purposes. They are not cash; usage and
                  unlock conditions are governed by the published rules.
                </p>
              </details>
              <details>
                <summary>How do I join a local group?</summary>
                <p>
                  Use the WhatsApp link on this page for onboarding guidance and information about your local community group.
                </p>
              </details>
              <details>
                <summary>Are farm slots and products available everywhere?</summary>
                <p>
                  Availability can vary by location, season and project capacity. Confirm availability, delivery, terms and
                  timelines before paying.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="cta">
          <div className="wrap">
            <h2>Help build a healthier, more food-secure future.</h2>
            <p>
              Get your Green Card, learn with the community and discover how you can participate in the Green Card
              Producer–Consumer Organic Food Ecosystem.
            </p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <a className="btn register-link" href={onPageSignupUrl}>
                GET MY GREEN CARD NOW →
              </a>
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

      {/* ── FOOTER ── */}
      <footer>
        <div className="wrap">
          <div className="foot">
            <div className="brand">
              <span className="mark">GC</span>
              <span>
                AGROHEAL GREEN CARD<br />
                <span style={{ fontWeight: 600 }}>Grow Healthy Food • Live Healthy • Build Wealth</span>
              </span>
            </div>
            <div className="footlinks">
              <a href="#ecosystem">Ecosystem</a>
              <a href="#videos">Videos</a>
              <a href="#opportunity">Opportunity</a>
              <a href="#faq">FAQs</a>
              <a href={GREEN_CARD_CONFIG.whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
          <p className="fine">
            Programme features, fees, points, product availability and participation terms may change. Confirm details
            through official Agroheal channels. Green Card Points are not cash. Farming, product sales and referral/network
            rewards depend on actual activity, costs, qualifying conditions and published rules. No income, profit, health
            outcome or financial return is guaranteed. This page is informational and does not replace official terms and
            conditions.
          </p>
          <p style={{ opacity: 0.75, marginBottom: 0 }}>
            © {new Date().getFullYear()} Agroheal Solutions Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── STICKY BOTTOM BAR (NON-SCROLLING CTA ON MOBILE & TABLET) ── */}
      <div className="sticky">
        <div className="wrap">
          <a className="btn register-link" href={stickySignupUrl}>
            GET GREEN CARD
          </a>
          <a
            className="btn whatsapp-link"
            href={GREEN_CARD_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "white" }}
          >
            WHATSAPP
          </a>
        </div>
      </div>

      {/* ── RESPONSIVE VIDEO MODAL ── */}
      {activeVideoModal && (
        <div className="funnel-video-modal-backdrop" onClick={() => setActiveVideoModal(null)}>
          <div
            className="funnel-video-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeVideoModal.title}
          >
            <div className="funnel-video-modal-header">
              <span className="funnel-video-modal-title">{activeVideoModal.title}</span>
              <button
                type="button"
                className="funnel-video-modal-close"
                onClick={() => setActiveVideoModal(null)}
                aria-label="Close video"
              >
                ✕
              </button>
            </div>
            <div className="funnel-video-frame-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="funnel-video-modal-footer">
              <span>Agroheal Green Card Experience</span>
              <a href={onPageSignupUrl}>Get Green Card Now →</a>
            </div>
          </div>
        </div>
      )}

      {/* ── V8 STYLES & ABOVE-THE-FOLD VIEWPORT OPTIMIZATIONS ── */}
      <style>{`
        :root {
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
        }
        .v8-funnel-root {
          box-sizing: border-box;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          background: var(--g);
          color: var(--w);
          line-height: 1.6;
          min-height: 100vh;
        }
        .v8-funnel-root * {
          box-sizing: border-box;
        }
        .v8-funnel-root a {
          color: inherit;
        }
        .v8-funnel-root .wrap {
          width: min(1120px, calc(100% - 32px));
          margin: auto;
        }
        .v8-funnel-root .top {
          background: var(--deep);
          font-size: 0.88rem;
          padding: 8px 0;
        }
        .v8-funnel-root .top .wrap {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .v8-funnel-root header {
          padding: 15px 0;
          border-bottom: 1px solid var(--line);
        }
        .v8-funnel-root nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .v8-funnel-root .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 950;
          text-decoration: none;
        }
        .v8-funnel-root .mark {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 13px;
          background: var(--o);
          color: var(--deep);
          font-weight: 1000;
        }
        .v8-funnel-root .navlinks {
          display: flex;
          gap: 20px;
          font-weight: 750;
          font-size: 0.92rem;
        }
        .v8-funnel-root .navlinks a {
          text-decoration: none;
        }
        .v8-funnel-root .btn {
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
        .v8-funnel-root .btn:hover {
          background: #ffa64e;
          transform: translateY(-2px);
        }
        .v8-funnel-root .btn.outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.75);
          box-shadow: none;
        }
        .v8-funnel-root .btn.small {
          padding: 9px 15px;
          font-size: 0.88rem;
        }

        /* ── HERO OPTIMIZED FOR FIRST SCREEN (ABOVE-THE-FOLD) VISIBILITY ── */
        .v8-funnel-root .hero {
          padding: 42px 0 32px;
          background: radial-gradient(circle at 83% 18%, rgba(255, 138, 29, 0.22), transparent 28%),
            linear-gradient(135deg, var(--g), var(--gd));
        }
        .v8-funnel-root .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 24px;
          align-items: center;
        }
        .v8-funnel-root .eyebrow,
        .v8-funnel-root .kicker {
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 900;
        }
        .v8-funnel-root .eyebrow {
          display: inline-block;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 12px;
        }
        .v8-funnel-root h1 {
          font-size: clamp(1.9rem, 3.8vw, 3.2rem);
          line-height: 1.12;
          letter-spacing: -0.04em;
          margin: 16px 0 12px;
          font-weight: 950;
        }
        .v8-funnel-root h1 span {
          color: #ffb15e;
        }
        .v8-funnel-root .hero p {
          font-size: 1rem;
          color: #f0fff4;
          max-width: 650px;
          margin: 10px 0 14px;
          line-height: 1.5;
        }
        .v8-funnel-root .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 18px 0 10px;
        }
        .v8-funnel-root .hero-actions {
          justify-content: center;
          margin-top: 20px;
        }
        .v8-funnel-root .muted {
          opacity: 0.86;
          font-size: 0.88rem !important;
          text-align: center;
          margin-top: 8px;
        }

        /* ── PREVIEW (VIDEO CARD) ── */
        .v8-funnel-root .preview {
          min-height: 240px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: linear-gradient(140deg, rgba(3, 61, 28, 0.38), rgba(255, 138, 29, 0.22)),
            repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0 10px, transparent 10px 20px);
          box-shadow: var(--shadow);
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .v8-funnel-root .preview:hover {
          transform: scale(1.02);
        }
        .v8-funnel-root .play {
          width: 68px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          margin: 10px auto 10px;
          background: #ff0000;
          color: #fff;
          font-size: 1.5rem;
          line-height: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
        }
        .v8-funnel-root .preview strong {
          font-size: 1.15rem;
          display: block;
          margin-bottom: 8px;
        }
        .v8-funnel-root .preview small {
          display: block;
          margin-top: 6px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #ffb15e;
        }

        /* ── SECTIONS & CONTENT ── */
        .v8-funnel-root .section {
          padding: 64px 0;
        }
        .v8-funnel-root .light {
          background: var(--soft);
          color: var(--ink);
        }
        .v8-funnel-root .dark {
          background: var(--gd);
        }
        .v8-funnel-root .head {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 32px;
        }
        .v8-funnel-root .kicker {
          color: #ffb15e;
        }
        .v8-funnel-root .light .kicker {
          color: var(--od);
        }
        .v8-funnel-root h2 {
          font-size: clamp(1.85rem, 3.4vw, 2.8rem);
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin: 10px 0 14px;
        }
        .v8-funnel-root .head p {
          font-size: 1.02rem;
          margin: 0;
          opacity: 0.9;
        }
        .v8-funnel-root .grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .v8-funnel-root .grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .v8-funnel-root .card {
          padding: 22px;
          border: 1px solid var(--line);
          border-radius: var(--r);
          background: rgba(255, 255, 255, 0.08);
        }
        .v8-funnel-root .light .card {
          background: white;
          border-color: #d8eadc;
          box-shadow: 0 8px 24px rgba(10, 70, 30, 0.05);
        }
        .v8-funnel-root .ico {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }
        .v8-funnel-root .card h3 {
          margin: 0 0 8px;
          font-size: 1.16rem;
        }
        .v8-funnel-root .card p {
          margin: 0;
          opacity: 0.9;
        }
        .v8-funnel-root .videos .card {
          padding: 0;
          overflow: hidden;
        }
        .v8-funnel-root .thumb {
          display: grid;
          place-items: center;
          min-height: 140px;
          background: linear-gradient(135deg, #05642b, #0d8e43);
          border-bottom: 1px solid var(--line);
          text-align: center;
        }
        .v8-funnel-root .thumb .play {
          width: 52px;
          height: 36px;
          border-radius: 9px;
          font-size: 1.15rem;
          margin-bottom: 6px;
        }
        .v8-funnel-root .vbody {
          padding: 20px;
        }
        .v8-funnel-root .vbody h3 {
          font-size: 1.22rem;
          font-weight: 950;
        }
        .v8-funnel-root .vbody p {
          margin-bottom: 15px;
        }
        .v8-funnel-root .vbody .btn {
          font-size: 1rem;
          font-weight: 950;
        }

        /* ── OFFER COMBO ── */
        .v8-funnel-root .offer {
          padding: 30px;
          border-radius: 25px;
          background: linear-gradient(135deg, #064e25, #087b35);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
        }
        .v8-funnel-root .offer-grid {
          display: grid;
          grid-template-columns: 0.88fr 1.12fr;
          gap: 28px;
          align-items: start;
        }
        .v8-funnel-root .price {
          font-size: clamp(2.4rem, 4.8vw, 3.6rem);
          font-weight: 950;
          color: #ffb15e;
          line-height: 1.05;
          margin: 10px 0;
        }
        .v8-funnel-root .breakdown {
          padding-left: 20px;
          margin: 10px 0;
        }
        .v8-funnel-root .breakdown li {
          margin: 7px 0;
        }
        .v8-funnel-root .callout {
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid var(--line);
          border-radius: 15px;
          padding: 16px;
          margin-top: 14px;
        }
        .v8-funnel-root .callout strong {
          color: #ffb15e;
        }
        .v8-funnel-root .tablewrap {
          overflow-x: auto;
          margin-top: 15px;
        }
        .v8-funnel-root table {
          border-collapse: collapse;
          width: 100%;
          min-width: 470px;
          font-size: 0.94rem;
        }
        .v8-funnel-root th,
        .v8-funnel-root td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid var(--line);
        }
        .v8-funnel-root th {
          color: #ffb15e;
        }
        .v8-funnel-root td:last-child,
        .v8-funnel-root th:last-child {
          text-align: right;
        }
        .v8-funnel-root .smallnote {
          font-size: 0.84rem;
          opacity: 0.86;
          margin-top: 12px;
          line-height: 1.5;
        }
        .v8-funnel-root details {
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
        }
        .v8-funnel-root summary {
          cursor: pointer;
          font-weight: 850;
        }
        .v8-funnel-root details p {
          opacity: 0.9;
          margin-bottom: 0;
          margin-top: 8px;
        }
        .v8-funnel-root .cta {
          padding: 50px 0;
          text-align: center;
          background: var(--o);
          color: #19351f;
        }
        .v8-funnel-root .cta h2 {
          max-width: 800px;
          margin: 0 auto 14px;
        }
        .v8-funnel-root .cta p {
          max-width: 680px;
          margin: 0 auto 22px;
        }
        .v8-funnel-root .cta .btn {
          background: var(--deep);
          color: white;
        }
        .v8-funnel-root footer {
          background: var(--deep);
          padding: 30px 0 90px;
          font-size: 0.9rem;
        }
        .v8-funnel-root .foot {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .v8-funnel-root .footlinks {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        .v8-funnel-root .footlinks a {
          text-decoration: none;
        }
        .v8-funnel-root .fine {
          font-size: 0.8rem;
          color: #cce6d3;
          margin-top: 18px;
          line-height: 1.5;
        }

        /* ── STICKY BOTTOM BAR (NON-SCROLLING CTA) ── */
        .v8-funnel-root .sticky {
          display: none;
          position: fixed !important;
          z-index: 2147483000;
          bottom: 0 !important;
          left: 0;
          right: 0;
          width: 100%;
          visibility: visible;
          opacity: 1;
          pointer-events: auto;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
          background: #033d1c;
          border-top: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.28);
          transform: translateZ(0);
          isolation: isolate;
        }
        .v8-funnel-root .sticky .wrap {
          display: flex;
          gap: 8px;
          width: 100%;
          max-width: 1120px;
        }
        .v8-funnel-root .sticky .btn {
          display: inline-flex;
          visibility: visible;
          opacity: 1;
          flex: 1;
          min-width: 0;
          padding: 12px 8px;
          font-size: 0.88rem;
          line-height: 1.25;
          white-space: normal;
          text-align: center;
        }

        /* ── RESPONSIVE & MOBILE FIRST SCREEN / ABOVE-THE-FOLD GUARANTEE ── */
        @media (max-width: 850px) {
          .v8-funnel-root .sticky {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .v8-funnel-root .navlinks {
            display: none;
          }
          .v8-funnel-root .hero-grid,
          .v8-funnel-root .offer-grid {
            grid-template-columns: 1fr;
          }
          .v8-funnel-root .hero {
            padding: 24px 0 20px;
          }
          .v8-funnel-root .preview {
            min-height: 140px;
            padding: 14px;
          }
          .v8-funnel-root .preview .play {
            width: 54px;
            height: 38px;
            border-radius: 10px;
            font-size: 1.25rem;
            margin: 8px auto 6px;
          }
          .v8-funnel-root .preview strong {
            font-size: 1.05rem;
            margin-bottom: 6px;
          }
          .v8-funnel-root .hero-grid {
            gap: 16px;
          }
          .v8-funnel-root h1 {
            margin: 12px 0 8px;
          }
          .v8-funnel-root .hero p {
            margin: 8px 0 10px;
          }
          .v8-funnel-root .grid3 {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 560px) {
          .v8-funnel-root body,
          .v8-funnel-root {
            padding-bottom: 76px;
          }
          .v8-funnel-root .wrap {
            width: calc(100% - 24px);
          }
          .v8-funnel-root .top .wrap {
            justify-content: center;
            text-align: center;
          }
          .v8-funnel-root .hero {
            padding: 18px 0 16px;
          }
          .v8-funnel-root h1 {
            font-size: clamp(1.6rem, 7.2vw, 2.1rem);
            line-height: 1.1;
            margin: 10px 0 6px;
          }
          .v8-funnel-root .hero p {
            font-size: 0.92rem;
            line-height: 1.45;
            margin: 6px 0 10px;
          }
          .v8-funnel-root .preview {
            min-height: 110px;
            padding: 10px 14px;
          }
          .v8-funnel-root .preview .play {
            width: 48px;
            height: 32px;
            border-radius: 8px;
            font-size: 1.1rem;
            margin: 6px auto 4px;
          }
          .v8-funnel-root .actions {
            flex-direction: column;
            gap: 8px;
            margin: 12px 0 8px;
          }
          .v8-funnel-root .hero-actions {
            margin-top: 12px;
          }
          .v8-funnel-root .hero-actions .btn {
            width: 100%;
            padding: 11px 16px;
            font-size: 0.92rem;
          }
          .v8-funnel-root .section {
            padding: 44px 0;
          }
          .v8-funnel-root .grid3,
          .v8-funnel-root .grid2 {
            grid-template-columns: 1fr;
          }
          .v8-funnel-root .card {
            padding: 18px;
          }
          .v8-funnel-root .offer {
            padding: 18px;
          }
          .v8-funnel-root footer {
            padding-bottom: 110px;
          }
        }

        /* ── VIDEO MODAL ── */
        .funnel-video-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          z-index: 2147483600;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .funnel-video-modal-dialog {
          width: 100%;
          max-width: 820px;
          background: #03210f;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: funnelVideoModalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes funnelVideoModalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .funnel-video-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #03210f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .funnel-video-modal-title {
          font-weight: 850;
          font-size: 1.05rem;
          color: #fff;
        }
        .funnel-video-modal-close {
          background: rgba(255, 255, 255, 0.12);
          border: 0;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 1rem;
          transition: 0.15s;
        }
        .funnel-video-modal-close:hover {
          background: #ff8a1d;
          color: #033d1c;
        }
        .funnel-video-frame-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: #000;
        }
        .funnel-video-frame-wrap iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .funnel-video-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #03210f;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .funnel-video-modal-footer a {
          color: #ffb15e;
          font-weight: 750;
          text-decoration: none;
        }
        .funnel-video-modal-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default GreenCardCampaign;
