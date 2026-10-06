import { useState } from "react";
import {
  FileText,
  Megaphone,
  Sprout,
  GraduationCap,
} from "lucide-react";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";
import { LegalDocEditor } from "@/components/admin/LegalDocEditor";
import { ProgrammeArchitectureViewer } from "@/components/admin/ProgrammeArchitectureViewer";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"announcements" | "legal" | "architecture">("announcements");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Content Management System (CMS)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative hub for community broadcast announcements, legal LEAP contracts, and programme architectures.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0 border-border text-xs"
          onClick={() => navigate("/courses")}
        >
          <GraduationCap className="w-4 h-4 text-primary" />
          Manage Academy Courses
        </Button>
      </div>

      <div className="w-full">
        {/* Navigation Tabs */}
        <div className="bg-card border border-border p-1 rounded-xl grid grid-cols-3 max-w-xl">
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`text-xs py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "announcements"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("legal")}
            className={`text-xs py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "legal"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Legal Agreement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`text-xs py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "architecture"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sprout className="w-3.5 h-3.5" /> How It Works
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-5 space-y-4">
          {activeTab === "announcements" && (
            <AnnouncementEditor
              onSuccess={(msg) => flash(setSuccessMessage, msg)}
              onError={(msg) => flash(setErrorMessage, msg)}
            />
          )}

          {activeTab === "legal" && (
            <LegalDocEditor
              onSuccess={(msg) => flash(setSuccessMessage, msg)}
              onError={(msg) => flash(setErrorMessage, msg)}
            />
          )}

          {activeTab === "architecture" && (
            <ProgrammeArchitectureViewer />
          )}
        </div>
      </div>
    </div>
  );
}
