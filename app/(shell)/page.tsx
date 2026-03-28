import Link from "next/link";
import { LayoutDashboard, FlaskConical, BrainCircuit, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-title">Interview IQ</h1>
        <p className="home-tagline">
          Your command center: smart calendar, resume match, interview prep, and career coaching.
        </p>
      </section>

      <section className="home-cards">
        <Link href="/dashboard" className="home-card">
          <LayoutDashboard size={28} className="home-card-icon" />
          <h2 className="home-card-title">Command Center</h2>
          <p className="home-card-desc">
            Smart Calendar and Prep Mode—today&apos;s interviews and quick stats.
          </p>
          <span className="home-card-cta">Open Dashboard →</span>
        </Link>

        <Link href="/match-lab/resume-match" className="home-card">
          <FlaskConical size={28} className="home-card-icon" />
          <h2 className="home-card-title">Match Lab</h2>
          <p className="home-card-desc">
            Resume Match and Job Tracker—ATS score, keyword gaps, and outreach.
          </p>
          <span className="home-card-cta">Resume Match →</span>
        </Link>

        <Link href="/interview-iq/post-mortem" className="home-card">
          <BrainCircuit size={28} className="home-card-icon" />
          <h2 className="home-card-title">Interview IQ</h2>
          <p className="home-card-desc">
            Post-Mortem—reflect and improve after interviews.
          </p>
          <span className="home-card-cta">Post-Mortem →</span>
        </Link>

        <Link href="/career-coach" className="home-card">
          <MessageCircle size={28} className="home-card-icon" />
          <h2 className="home-card-title">Career Coach</h2>
          <p className="home-card-desc">
            AI Assistant and VoiceLab—tailored advice and practice.
          </p>
          <span className="home-card-cta">AI Coach →</span>
        </Link>
      </section>
    </div>
  );
}
