"use client";

import { useEffect, useState } from "react";
import type { Profile, ProfileResume, CareerDNA } from "@/lib/profile-store";
import { FileText, Check, Link2 } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dna, setDna] = useState<CareerDNA>({ targetJobTitles: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setDna(data.careerDNA ?? { targetJobTitles: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function setPrimary(id: string) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryResumeId: id }),
    });
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data);
  }

  async function saveCareerDNA() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careerDNA: dna }),
    });
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data);
  }

  if (loading) return <main className="page-main"><p className="bento-muted">Loading…</p></main>;
  if (!profile) return <main className="page-main"><p className="bento-muted">Failed to load profile.</p></main>;

  return (
    <main className="page-main">
      <h1 className="page-title">Profile &amp; Assets</h1>
      <p className="page-desc">
        Manage your resumes and career goals. Match Lab uses your Primary Resume by default.
      </p>

      <section className="profile-card">
        <h2 className="profile-card-title">
          <FileText size={18} />
          Resume Management
        </h2>
        {profile.resumes.length === 0 ? (
          <div className="profile-empty">
            <p>No resumes yet. Upload a resume to use in Match Lab and Auto-Apply.</p>
            <p className="profile-hint">File upload can be wired to your storage (e.g. S3 or local).</p>
          </div>
        ) : (
          <ul className="resume-list">
            {profile.resumes.map((r) => (
              <li key={r.id} className={`resume-item ${r.isPrimary ? "primary" : ""}`}>
                <span className="resume-name">{r.name}</span>
                {r.isPrimary ? (
                  <span className="resume-badge">Primary</span>
                ) : (
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => setPrimary(r.id)}
                  >
                    Set as primary
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-card">
        <h2 className="profile-card-title">Career DNA</h2>
        <div className="profile-form">
          <label className="form-label">Target job titles (comma-separated)</label>
          <input
            type="text"
            className="input full"
            placeholder="e.g. Senior Engineer, Product Manager"
            value={(dna.targetJobTitles ?? []).join(", ")}
            onChange={(e) =>
              setDna((prev) => ({
                ...prev,
                targetJobTitles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />
          <div className="form-row two">
            <div>
              <label className="form-label">Salary min (e.g. 120000)</label>
              <input
                type="number"
                className="input full"
                placeholder="Min"
                value={dna.salaryMin ?? ""}
                onChange={(e) =>
                  setDna((prev) => ({ ...prev, salaryMin: e.target.value ? Number(e.target.value) : undefined }))
                }
              />
            </div>
            <div>
              <label className="form-label">Salary max</label>
              <input
                type="number"
                className="input full"
                placeholder="Max"
                value={dna.salaryMax ?? ""}
                onChange={(e) =>
                  setDna((prev) => ({ ...prev, salaryMax: e.target.value ? Number(e.target.value) : undefined }))
                }
              />
            </div>
          </div>
          <label className="form-label">Years of experience</label>
          <input
            type="number"
            className="input full"
            placeholder="e.g. 5"
            value={dna.yearsExperience ?? ""}
            onChange={(e) =>
              setDna((prev) => ({
                ...prev,
                yearsExperience: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <button type="button" className="btn-primary" onClick={saveCareerDNA}>
            Save Career DNA
          </button>
        </div>
      </section>

      <section className="profile-card">
        <h2 className="profile-card-title">
          <Link2 size={18} />
          Sync Status
        </h2>
        <div className="sync-status">
          {profile.linkedInConnected ? (
            <>
              <span className="sync-check"><Check size={20} /></span>
              <span>LinkedIn connected — The Edge can use your profile for intelligence.</span>
            </>
          ) : (
            <>
              <span className="sync-dot" />
              <span>LinkedIn not connected. Connect for richer recruiter insights.</span>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
