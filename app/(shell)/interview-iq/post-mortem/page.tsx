import { ClipboardList } from "lucide-react";

export default function PostMortemPage() {
  return (
    <main className="page-main">
      <h1 className="page-title">Post-Mortem</h1>
      <p className="page-desc">
        Reflect on past interviews and capture what went well and what to improve.
      </p>
      <div className="placeholder-block">
        <ClipboardList size={48} className="placeholder-icon" />
        <p>Post-mortem reflections and notes will appear here.</p>
      </div>
    </main>
  );
}
