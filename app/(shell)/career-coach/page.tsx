"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

export default function CareerCoachPage() {
  const searchParams = useSearchParams();
  const [context, setContext] = useState<{ score?: number; keywordGaps?: string[] } | null>(null);

  useEffect(() => {
    const contextParam = searchParams.get("context");
    const gapsParam = searchParams.get("gaps");
    if (contextParam === "resume-gaps" && gapsParam) {
      try {
        const decoded = decodeURIComponent(gapsParam);
        const data = JSON.parse(decoded);
        setContext({ score: data.score, keywordGaps: data.keywordGaps ?? [] });
      } catch {
        setContext(null);
      }
    } else {
      setContext(null);
    }
  }, [searchParams]);

  return (
    <main className="page-main">
      <h1 className="page-title">AI Assistant</h1>
      <p className="page-desc">
        Get tailored advice for your job search and interviews.
      </p>

      {context?.keywordGaps && context.keywordGaps.length > 0 && (
        <div className="context-banner">
          <strong>Context from Resume Match</strong>
          <p>You came here to fix resume gaps. Consider adding these keywords: {context.keywordGaps.slice(0, 5).join(", ")}{context.keywordGaps.length > 5 ? "…" : ""}</p>
          {context.score != null && (
            <p className="muted">Your last match score: {context.score}/100</p>
          )}
        </div>
      )}

      <div className="placeholder-block">
        <Bot size={48} className="placeholder-icon" />
        <p>AI Assistant chat and coaching will appear here.</p>
      </div>
    </main>
  );
}
