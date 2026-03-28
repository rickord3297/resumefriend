"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";
import { ResumeMatchDrawer } from "@/components/ResumeMatchDrawer";

export default function ResumeMatchPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="page-main">
      <h1 className="page-title">Resume Match</h1>
      <p className="page-desc">
        Check how your resume scores against ATS and find keyword gaps for your target role.
      </p>
      <div className="resume-match-cta">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setDrawerOpen(true)}
        >
          <FileSearch size={20} />
          Run match
        </button>
        <p className="resume-match-hint">Upload or paste your resume to see ATS status and keyword gaps.</p>
      </div>
      <ResumeMatchDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </main>
  );
}
