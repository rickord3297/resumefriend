import type { Metadata } from "next";
import { WaitlistClient } from "./WaitlistClient";

export const metadata: Metadata = {
  title: "Interview IQ — Early access",
  description:
    "AI-powered resume tailoring, application tracking, and interview prep—one workspace for serious job seekers. Join the waitlist.",
  openGraph: {
    title: "Interview IQ — Your AI resume & interview copilot",
    description:
      "Automate resume tailoring and application busywork. Built for candidates who want to move faster.",
  },
};

export default function WaitlistPage() {
  return <WaitlistClient />;
}
