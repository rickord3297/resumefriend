import Link from "next/link";

const tools = [
  { href: "/tools/persona", title: "PersonaEngine", desc: "Pivot your resume for SaaS/Startup, Enterprise, and Generalist markets." },
  { href: "/tools/job-hunter", title: "JobHunter", desc: "Research hiring managers, draft 3-step outreach, tailor with your persona." },
  { href: "/tools/voicelab", title: "VoiceLab", desc: "Practice interview answers with speech-to-text and instant feedback." },
];

export default function ToolsPage() {
  return (
    <main className="page-main">
      <h1 className="page-title">Tools</h1>
      <p className="page-desc">PersonaEngine, JobHunter, and VoiceLab.</p>
      <nav className="tools-grid">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="tools-card">
            <strong>{t.title}</strong>
            <p>{t.desc}</p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
