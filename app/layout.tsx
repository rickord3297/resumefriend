import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview IQ",
  description: "Command center for your job search and interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
