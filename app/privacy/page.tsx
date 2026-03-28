import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Entity Mapping Repository",
  description: "Privacy policy for the Entity Mapping Repository waitlist.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-300">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-white">Privacy</h1>
        <p className="mt-6 text-sm leading-relaxed">
          We collect your email only to contact you about early access to the Entity Mapping
          Repository. We do not sell your email. You can request removal at any time by replying to
          our messages.
        </p>
        <p className="mt-8">
          <Link href="/waitlist" className="text-amber-400 hover:text-amber-300">
            ← Back to waitlist
          </Link>
        </p>
      </div>
    </div>
  );
}
