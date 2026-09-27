import { useEffect, useRef } from "react";

// Injected by Vite plugin at build time
declare const __APP_BUILD_TIME__: string;

const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Check every 2 minutes
const INITIAL_DELAY_MS = 2000; // 2s after mount

export function AutoUpdateWatcher() {
  const updateDetectedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    // Only run in production builds
    if (import.meta.env.DEV) return;
    if (typeof window === "undefined") return;

    const currentBuild = typeof __APP_BUILD_TIME__ !== "undefined" ? __APP_BUILD_TIME__ : "";
    if (!currentBuild) return;

    const performReload = (force = false) => {
      if (isRefreshingRef.current) return;

      const activeTag = document.activeElement?.tagName?.toUpperCase();
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

      // If user is actively typing in a form and reload is not forced, defer until navigation
      if (isTyping && !force) {
        return;
      }

      isRefreshingRef.current = true;
      window.location.reload();
    };

    const checkVersion = async (autoReloadIfOutdated = false) => {
      try {
        const response = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) return;
        const data = await response.json();

        if (data?.version && String(data.version) !== String(currentBuild)) {
          console.info("[AgroHeal Admin] New deployment detected. Current:", currentBuild, "Latest:", data.version);
          updateDetectedRef.current = true;

          if (autoReloadIfOutdated) {
            performReload(false);
          }
        }
      } catch {
        // Silently swallow fetch errors during background checks (e.g. offline)
      }
    };

    // 1. Initial check shortly after app loads
    const initialTimer = setTimeout(() => {
      checkVersion(false);
    }, INITIAL_DELAY_MS);

    // 2. Periodic background check every 2 minutes
    const intervalTimer = setInterval(() => {
      checkVersion(false);
    }, CHECK_INTERVAL_MS);

    // 3. Tab wake-up check: when user unlocks mobile or switches back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (updateDetectedRef.current) {
          performReload(false);
        } else {
          checkVersion(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // 4. Intercept user clicks on navigation links/buttons if an update was detected
    const handleDocumentClick = (e: MouseEvent) => {
      if (!updateDetectedRef.current) return;

      const target = (e.target as HTMLElement)?.closest("a, button");
      if (target) {
        if (target.tagName === "A") {
          const href = (target as HTMLAnchorElement).getAttribute("href");
          if (
            href &&
            !href.startsWith("http") &&
            !href.startsWith("#") &&
            !href.startsWith("tel:") &&
            !href.startsWith("mailto:")
          ) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = href;
            return;
          }
        }
        performReload(false);
      }
    };
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  return null;
}
