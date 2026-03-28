import type { Metadata } from "next";
import { WaitlistClient } from "./WaitlistClient";

export const metadata: Metadata = {
  title: "Entity Mapping Repository — Early Access",
  description:
    "Stop fighting messy CRM data. AI-verified golden records for over 20M companies. Join the waitlist.",
  openGraph: {
    title: "The Definitive Entity Mapping Repository",
    description: "AI-verified golden records for over 20M companies.",
  },
};

export default function WaitlistPage() {
  return <WaitlistClient />;
}
