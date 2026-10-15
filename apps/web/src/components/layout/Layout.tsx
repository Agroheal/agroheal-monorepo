import { Outlet, useLocation, useNavigate, ScrollRestoration, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect } from "react";
import { captureReferral } from "@/lib/referralManager";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

const Layout = () => {
  // hiden header and footer logic on some paths
  const location = useLocation();
  const { pathname } = location;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const normalizedPath = normalizePath(pathname);

  // Capture and persist affiliate referral code across marketing navigation
  useEffect(() => {
    captureReferral(searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate({ pathname: normalizedPath, search: location.search }, { replace: true });
    }
  }, [pathname, normalizedPath, navigate, location.search]);

  // Ensure window scrolls to top on navigation to any page (e.g. from footer links)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const HIDDENROURES = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const hiddenPath = HIDDENROURES.includes(normalizedPath);

  return (
    <>
      <ScrollRestoration />
      {!hiddenPath && <Header />}
      <Outlet />
      {!hiddenPath && <Footer />}
    </>
  );
};

export default Layout;
