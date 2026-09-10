import { Outlet, useLocation, useNavigate, ScrollRestoration } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect } from "react";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

const Layout = () => {
  // hiden header and footer logic on some paths
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, normalizedPath, navigate]);

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
