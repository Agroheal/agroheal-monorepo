import { supabase } from "@/lib/supabaseClient";

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5 MB Limit
export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/pjpeg", "image/x-png"];
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png"];

export interface ReceiptValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type (strictly JPEG or PNG only) and size (strictly <= 5MB).
 */
export function validateReceiptFile(file: File): ReceiptValidationResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type.toLowerCase();

  const isMimeAllowed = ALLOWED_RECEIPT_TYPES.includes(mime);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed || !isExtAllowed) {
    return {
      valid: false,
      error: "Only JPEG (.jpg, .jpeg) and PNG (.png) files are allowed. Other formats (PDF, WebP, GIF, HEIC) are not permitted.",
    };
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds the 5MB limit (${sizeInMb}MB). Please upload a JPEG or PNG under 5MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty (0 bytes). Please select a valid receipt image.",
    };
  }

  return { valid: true };
}

/**
 * Uploads a verified payment receipt to the payment_receipts Supabase bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadPaymentReceipt(file: File, memberId: string): Promise<string> {
  const check = validateReceiptFile(file);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() || (file.type.includes("png") ? "png" : "jpg");
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const fileName = `${memberId}/${Date.now()}_receipt.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment_receipts")
    .upload(fileName, file, {
      contentType: file.type.toLowerCase().includes("png") ? "image/png" : "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(`Receipt upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("payment_receipts")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

