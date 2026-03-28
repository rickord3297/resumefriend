"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Link from "next/link";

export interface ResumeMatchResult {
  score: number;
  atsStatus: "pass" | "fail" | "needs_work";
  atsSummary: string;
  keywordGaps: string[];
}

const defaultResult: ResumeMatchResult = {
  score: 62,
  atsStatus: "needs_work",
  atsSummary: "Your resume may pass some ATS filters but is missing keywords for this role. Add the terms below to improve parsing and ranking.",
  keywordGaps: [
    "project management",
    "cross-functional",
    "stakeholder",
    "agile",
    "KPI",
    "metrics-driven",
  ],
};

export function ResumeMatchDrawer({
  open,
  onOpenChange,
  result = defaultResult,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result?: ResumeMatchResult;
}) {
  const isLowScore = result.score < 70;
  const showAutoApply = result.score >= 85;
  const gapsContext = encodeURIComponent(JSON.stringify({ score: result.score, keywordGaps: result.keywordGaps }));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content" aria-describedby={undefined}>
          <div className="drawer-glass" />
          <div className="drawer-inner">
            <Dialog.Title className="sr-only">Resume Match Results</Dialog.Title>
            <div className="drawer-header">
              <div className={`drawer-score-wrap ${isLowScore ? "drawer-score-low" : ""}`}>
                <span className="drawer-score-value">{result.score}</span>
                <span className="drawer-score-max">/100</span>
              </div>
              <Dialog.Close className="drawer-close" aria-label="Close">
                <X size={20} />
              </Dialog.Close>
            </div>

            <section className="drawer-section">
              <h3 className="drawer-section-title">ATS Status</h3>
              <p className="drawer-section-body">{result.atsSummary}</p>
              <span className={`drawer-badge drawer-badge-${result.atsStatus}`}>
                {result.atsStatus === "pass" ? "Pass" : result.atsStatus === "fail" ? "Fail" : "Needs work"}
              </span>
            </section>

            <section className="drawer-section drawer-section-border">
              <h3 className="drawer-section-title">Keyword Gaps</h3>
              <ul className="drawer-gaps">
                {result.keywordGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </section>

            <div className="drawer-actions">
              {showAutoApply && (
                <button
                  type="button"
                  className="drawer-cta drawer-cta-primary"
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = "/match-lab/job-tracker?autoApply=1";
                  }}
                >
                  Auto-Apply with this Profile
                </button>
              )}
              <Link
                href={`/career-coach?context=resume-gaps&gaps=${gapsContext}`}
                className="drawer-cta"
                onClick={() => onOpenChange(false)}
              >
                Fix with AI Coach
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
