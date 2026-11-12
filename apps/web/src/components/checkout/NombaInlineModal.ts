import { API_BASE_URL } from "@/config/Index";

export interface NombaInlineModalOptions {
  checkoutUrl: string;
  txRef: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  title?: string;
  onSuccess: (data: { reference: string; gateway: "nomba"; raw?: any }) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Opens an in-app inline modal iframe for Nomba checkout instead of hard-redirecting away.
 * Includes real-time background polling, postMessage listener, and manual 'Verify' fallback.
 */
export function openNombaInlineModal(options: NombaInlineModalOptions): () => void {
  const {
    checkoutUrl,
    txRef,
    amount,
    title = "AgroHeal Secure Checkout",
    onSuccess,
    onClose,
    onError,
  } = options;

  // Prevent multiple concurrent modal instances
  const existing = document.getElementById("nomba-inline-checkout-overlay");
  if (existing) {
    existing.remove();
  }

  // Save current body overflow to restore upon exit
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let isCleanedUp = false;
  let pollInterval: any = null;
  let isChecking = false;

  // Overlay container
  const overlay = document.createElement("div");
  overlay.id = "nomba-inline-checkout-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background-color: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Modal dialog wrapper
  const dialog = document.createElement("div");
  dialog.style.cssText = `
    position: relative;
    width: 100%;
    max-width: 480px;
    height: 92vh;
    max-height: 720px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(16, 185, 129, 0.2);
    animation: nombaModalPop 0.22s ease-out;
  `;

  // Keyframe animation style
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    @keyframes nombaModalPop {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes nombaPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    @keyframes nombaSpin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleTag);

  // 1. Header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  `;

  const headerLeft = document.createElement("div");
  headerLeft.style.cssText = `display: flex; align-items: center; gap: 10px;`;
  headerLeft.innerHTML = `
    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 16px;">
      🛡️
    </div>
    <div>
      <div style="font-weight: 700; font-size: 13.5px; letter-spacing: -0.01em; color: #ffffff;">
        ${title}
      </div>
      <div style="font-size: 11px; color: #a7f3d0; font-weight: 500;">
        Bank Transfer • USSD • Card • QR
      </div>
    </div>
  `;

  const headerRight = document.createElement("div");
  headerRight.style.cssText = `display: flex; align-items: center; gap: 8px;`;

  const amountBadge = document.createElement("div");
  amountBadge.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-weight: 800;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 9999px;
  `;
  amountBadge.textContent = `₦${amount.toLocaleString()}`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close checkout");
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #ffffff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    transition: background 0.15s ease;
  `;
  closeBtn.innerHTML = "&#x2715;";
  closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(255, 255, 255, 0.3)"; };
  closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255, 255, 255, 0.15)"; };

  headerRight.appendChild(amountBadge);
  headerRight.appendChild(closeBtn);
  header.appendChild(headerLeft);
  header.appendChild(headerRight);

  // 2. Body Container (Loader + Iframe)
  const body = document.createElement("div");
  body.style.cssText = `
    position: relative;
    flex: 1;
    width: 100%;
    background: #f8fafc;
    overflow: hidden;
  `;

  // Spinner placeholder
  const spinnerContainer = document.createElement("div");
  spinnerContainer.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    gap: 12px;
    color: #065f46;
    z-index: 1;
  `;
  spinnerContainer.innerHTML = `
    <div style="width: 36px; height: 36px; border: 3px solid #cbd5e1; border-top-color: #059669; border-radius: 50%; animation: nombaSpin 0.8s linear infinite;"></div>
    <div style="font-size: 13px; font-weight: 600; color: #334155;">Connecting to Nomba Secure Checkout...</div>
    <div style="font-size: 11px; color: #64748b;">Instant Bank Transfer details are loading</div>
  `;
  body.appendChild(spinnerContainer);

  // Iframe
  const iframe = document.createElement("iframe");
  iframe.src = checkoutUrl;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    background: transparent;
  `;
  iframe.setAttribute("allow", "payment; camera; microphone; clipboard-write; clipboard-read");
  iframe.setAttribute("sandbox", "allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-top-navigation-by-user-activation");

  iframe.onload = () => {
    // Hide spinner once iframe finishes loading
    spinnerContainer.style.display = "none";
  };
  body.appendChild(iframe);

  // 3. Footer (Real-time Status Pulse + Manual Verify Action)
  const footer = document.createElement("div");
  footer.style.cssText = `
    padding: 10px 16px;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
  `;

  const statusIndicator = document.createElement("div");
  statusIndicator.style.cssText = `display: flex; align-items: center; gap: 8px;`;
  statusIndicator.innerHTML = `
    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: nombaPulse 1.5s infinite ease-in-out;"></span>
    <span id="nomba-status-text" style="font-size: 11.5px; font-weight: 600; color: #047857;">
      Listening for payment in real-time...
    </span>
  `;

  const verifyBtn = document.createElement("button");
  verifyBtn.type = "button";
  verifyBtn.style.cssText = `
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    font-size: 11.5px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  `;
  verifyBtn.textContent = "I've Paid / Verify";
  verifyBtn.onmouseenter = () => { verifyBtn.style.background = "#dcfce7"; };
  verifyBtn.onmouseleave = () => { verifyBtn.style.background = "#f0fdf4"; };

  footer.appendChild(statusIndicator);
  footer.appendChild(verifyBtn);

  // Assemble dialog
  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Cleanup helper
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (pollInterval) clearInterval(pollInterval);
    window.removeEventListener("message", handleMessage);
    document.body.style.overflow = originalOverflow;
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (styleTag.parentNode) {
      styleTag.parentNode.removeChild(styleTag);
    }
  };

  // Close button click handler
  closeBtn.onclick = () => {
    const confirmClose = window.confirm(
      "Have you completed the bank transfer? If you have already transferred, your transaction will still confirm automatically."
    );
    if (confirmClose) {
      cleanup();
      onClose?.();
    }
  };

  // Trigger success banner and callback
  const handlePaymentSuccess = (rawData: any) => {
    if (isCleanedUp) return;
    const statusText = document.getElementById("nomba-status-text");
    if (statusText) {
      statusText.textContent = "Payment Confirmed! Redirecting...";
      statusText.style.color = "#059669";
    }

    // Show celebratory banner inside modal
    const successOverlay = document.createElement("div");
    successOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      gap: 12px;
      animation: nombaModalPop 0.2s ease-out;
    `;
    successOverlay.innerHTML = `
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold;">
        ✓
      </div>
      <div style="font-size: 17px; font-weight: 800; color: #065f46;">Payment Confirmed!</div>
      <div style="font-size: 13px; color: #475569; font-weight: 500;">Finalizing your account setup...</div>
    `;
    body.appendChild(successOverlay);

    setTimeout(() => {
      cleanup();
      onSuccess({
        reference: txRef,
        gateway: "nomba",
        raw: rawData,
      });
    }, 900);
  };

  // Verify status check against backend
  const checkStatus = async (isManual = false) => {
    if (isChecking || isCleanedUp) return;
    isChecking = true;

    if (isManual) {
      verifyBtn.textContent = "Checking...";
      verifyBtn.style.opacity = "0.7";
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/checkout/claim-status/${encodeURIComponent(txRef)}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const json = await response.json();
        const data = json.data || json;
        if (data.isPaid === true) {
          handlePaymentSuccess(data);
          return;
        }
      }

      if (isManual) {
        const statusText = document.getElementById("nomba-status-text");
        if (statusText) {
          statusText.textContent = "Payment not detected yet. Please retry in a few seconds.";
          setTimeout(() => {
            if (statusText && !isCleanedUp) {
              statusText.textContent = "Listening for payment in real-time...";
            }
          }, 3500);
        }
      }
    } catch (err: any) {
      console.warn("[NombaInlineModal] Status poll error:", err);
    } finally {
      isChecking = false;
      if (isManual) {
        verifyBtn.textContent = "I've Paid / Verify";
        verifyBtn.style.opacity = "1";
      }
    }
  };

  verifyBtn.onclick = () => {
    checkStatus(true);
  };

  // Window message listener for Nomba postMessage events
  const handleMessage = (event: MessageEvent) => {
    try {
      const msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (
        msg?.status === "success" ||
        msg?.event === "payment.successful" ||
        msg?.type === "nomba:payment_success"
      ) {
        checkStatus(false);
      }
    } catch {}
  };
  window.addEventListener("message", handleMessage);

  // Background poller every 3.5 seconds
  pollInterval = setInterval(() => {
    checkStatus(false);
  }, 3500);

  return cleanup;
}
