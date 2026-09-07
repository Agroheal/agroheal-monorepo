/**
 * Client-side fallback pricing used only when the admin-actions Edge
 * Function is unreachable (see adminActions.ts). The Edge Function and
 * supabase/sql/sync_member_emails.sql carry their own copies of these
 * same figures server-side — this file only dedupes the browser-side one,
 * which used to be inlined three times across App.tsx.
 */
export const SLOT_FEE = 1000;
export const SETUP_FEE = 3500;
export const SUPPORT_FEE = 500;
export const GREEN_CARD_FEE = 2000;

export function computeSlotCreditBreakdown(slots: number) {
  return {
    slotFee: slots * SLOT_FEE,
    setupFee: slots * SETUP_FEE,
    supportFee: slots * SUPPORT_FEE,
    total: slots * (SLOT_FEE + SETUP_FEE + SUPPORT_FEE),
  };
}
