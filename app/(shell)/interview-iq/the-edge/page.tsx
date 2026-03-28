import { Sparkles } from "lucide-react";

export default function TheEdgePage() {
  return (
    <main className="page-main">
      <h1 className="page-title">The Edge</h1>
      <p className="page-desc">
        Daily recruiter insights and tips to stay ahead.
      </p>
      <div className="placeholder-block">
        <Sparkles size={48} className="placeholder-icon" />
        <p>Your daily insight will appear here.</p>
      </div>
    </main>
  );
}
