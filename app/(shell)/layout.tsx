import { Sidebar } from "@/components/Sidebar";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrap">{children}</div>
    </div>
  );
}
