import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <main className="page-main">
      <h1 className="page-title">History</h1>
      <p className="page-desc">
        Your interview and application history.
      </p>
      <div className="placeholder-block">
        <History size={48} className="placeholder-icon" />
        <p>History will appear here.</p>
      </div>
    </main>
  );
}
