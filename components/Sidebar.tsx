"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  BrainCircuit,
  MessageCircle,
  User,
  Home,
  Calendar,
  FileSearch,
  Briefcase,
  ClipboardList,
  Bot,
  Mic,
} from "lucide-react";

const navItems = [
  {
    id: "command-center",
    label: "Command Center",
    icon: LayoutDashboard,
    href: "/",
    children: [
      { href: "/", label: "Home", icon: Home },
      { href: "/dashboard", label: "Smart Calendar", icon: Calendar },
    ],
  },
  {
    id: "match-lab",
    label: "Match Lab",
    icon: FlaskConical,
    href: "/match-lab",
    children: [
      { href: "/match-lab/resume-match", label: "Resume Match", icon: FileSearch },
      { href: "/match-lab/job-tracker", label: "Job Tracker", icon: Briefcase },
    ],
  },
  {
    id: "interview-iq",
    label: "Interview IQ",
    icon: BrainCircuit,
    href: "/interview-iq",
    children: [
      { href: "/interview-iq/post-mortem", label: "Post-Mortem", icon: ClipboardList },
    ],
  },
  {
    id: "career-coach",
    label: "Career Coach",
    icon: MessageCircle,
    href: "/career-coach",
    children: [
      { href: "/career-coach", label: "AI Assistant", icon: Bot },
      { href: "/career-coach/voicelab", label: "VoiceLab", icon: Mic },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isHubActive(href: string, childPaths?: string[]) {
    if (href === "/") return pathname === "/" || pathname === "/dashboard";
    if (childPaths?.length) return childPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isChildActive(href: string) {
    return pathname === href || (href === "/career-coach" && pathname === "/career-coach");
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand">
        Interview IQ
      </Link>
      <nav className="sidebar-nav">
        {navItems.map((hub) => {
          const HubIcon = hub.icon;
          const childPaths = hub.children?.map((c) => c.href);
          const hubActive = isHubActive(hub.href, childPaths);
          return (
            <div key={hub.id} className="sidebar-group">
              <Link
                href={hub.href}
                className={`sidebar-link sidebar-link-hub ${hubActive ? "active" : ""}`}
              >
                <HubIcon className="sidebar-icon" size={18} />
                <span>{hub.label}</span>
              </Link>
              <div className="sidebar-sub">
                {hub.children.map((child) => {
                  const ChildIcon = child.icon;
                  const active = isChildActive(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`sidebar-sublink ${active ? "active" : ""}`}
                    >
                      <ChildIcon className="sidebar-icon sub" size={16} />
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Link
          href="/profile"
          className={`sidebar-link ${pathname === "/profile" ? "active" : ""}`}
        >
          <User className="sidebar-icon" size={18} />
          <span>Profile &amp; Assets</span>
        </Link>
      </div>
    </aside>
  );
}
