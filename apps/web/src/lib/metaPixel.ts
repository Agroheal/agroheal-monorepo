/**
 * Meta Pixel (Facebook Pixel) client integration helper.
 * Pixel ID: 1813293027468855
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export type MetaPixelStandardEvent =
  | "PageView"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Purchase"
  | "Contact"
  | "ViewContent";

/**
 * Safely trigger a Meta Pixel standard event.
 */
export function trackMetaPixel(
  event: MetaPixelStandardEvent | string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.fbq === "function") {
      if (params) {
        window.fbq("track", event, params);
      } else {
        window.fbq("track", event);
      }
    }
  } catch (err) {
    // Ad-blocker or network boundary may prevent tracking; swallow gracefully
    console.debug("[MetaPixel] Event track ignored:", event, err);
  }
}

/**
 * Convenience helper to track PageView during SPA client-side route transitions.
 */
export function trackMetaPageView(): void {
  trackMetaPixel("PageView");
}

