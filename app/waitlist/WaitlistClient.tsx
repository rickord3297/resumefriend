"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Share2 } from "lucide-react";

function getShareUrl() {
  if (typeof window === "undefined") return "";
  const url = encodeURIComponent(window.location.href);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

export function WaitlistClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const envOk =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!envOk) {
      setErrorMessage("Waitlist is not configured. Add Supabase env vars.");
      setStatus("error");
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.from("waitlist").insert({ email: trimmed });
      if (error) {
        if (error.code === "23505") {
          setStatus("success");
          setEmail("");
          return;
        }
        throw error;
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(212,175,55,0.06),transparent)]" />

      <main className="relative z-10 flex min-h-screen flex-col px-4 pb-12 pt-10 sm:px-6 sm:pt-14 md:px-8 lg:pt-20">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-gold-glow backdrop-blur-sm sm:p-10 md:p-12">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
              Interview IQ
            </p>

            {status === "success" ? (
              <div className="animate-fade-in space-y-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-gold-glow-sm">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    You&apos;re on the list!
                  </h1>
                  <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                    We&apos;ll email you when early access opens. Know someone job hunting who
                    could use a smarter resume workflow? Send them this page.
                  </p>
                </div>
                <a
                  href={getShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/80 px-6 py-3.5 text-sm font-medium text-white transition hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                  Share on LinkedIn
                </a>
              </div>
            ) : (
              <>
                <header className="text-center">
                  <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.5rem] md:leading-tight">
                    Your AI copilot for resumes, applications &amp; interviews
                  </h1>
                  <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                    Tailor your resume to each role, keep applications organized, and practice
                    answers—without living inside a dozen tabs. We&apos;re opening early access to
                    candidates who want automation that actually saves time.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      className="min-h-[48px] flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-4 text-base text-white placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 text-sm font-semibold text-zinc-950 shadow-gold-glow-sm transition hover:from-amber-500 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Joining…
                        </>
                      ) : (
                        <>
                          Join the waitlist
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </>
                      )}
                    </button>
                  </div>
                  {status === "error" && errorMessage && (
                    <p className="text-center text-sm text-red-400" role="alert">
                      {errorMessage}
                    </p>
                  )}
                  {!envOk && (
                    <p className="text-center text-xs text-zinc-500">
                      Add <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                      and{" "}
                      <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
                      to enable submissions.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>

        <footer className="relative z-10 mx-auto mt-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 pb-6 pt-8 text-sm text-zinc-500">
          <a
            href="/privacy"
            className="transition hover:text-amber-400/90 focus:outline-none focus:text-amber-400"
          >
            Privacy
          </a>
          <span className="hidden text-zinc-700 sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-zinc-600">Resume Friend · Interview IQ</span>
        </footer>
      </main>
    </div>
  );
}
