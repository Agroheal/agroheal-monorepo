import { useRef, useState, type ChangeEvent } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon } from "lucide-react";
import { validateReceiptFile } from "@/lib/receiptUpload";
import { Button } from "@/components/ui/button";

interface ReceiptUploadFieldProps {
  label?: string;
  helperText?: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
}

export function ReceiptUploadField({
  label = "Bank Transfer Receipt",
  helperText = "Strictly JPEG or PNG only (Max 5MB). Proof of offline / bank transfer payment.",
  selectedFile,
  onFileSelect,
  required = false,
}: ReceiptUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const validation = validateReceiptFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file format or size.");
      onFileSelect(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileSelect(file);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        <span className="text-[11px] font-mono text-muted-foreground">JPEG / PNG &bull; &le; 5MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        id="receipt-file-input"
      />

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-4 text-center cursor-pointer bg-background/50 hover:bg-muted/40 group flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Click to upload transfer receipt</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{helperText}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="w-12 h-12 object-cover rounded border border-border shrink-0 bg-muted"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{formatFileSize(selectedFile.size)} &bull; Valid receipt</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive h-8 px-2"
            title="Remove receipt"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
