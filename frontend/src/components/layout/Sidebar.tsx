"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Bot,
  FileCode2,
  ShieldCheck,
  FlaskConical,
  Layers,
  PlaySquare,
  PieChart,
  GitCompare,
  Dna,
  DoorOpen,
  Plug,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/context/ProjectContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/chatbots", label: "Chatbots", icon: Bot },
  { href: "/prompts", label: "Prompts & Versions", icon: FileCode2 },
  { href: "/contracts", label: "Behavior Contracts", icon: ShieldCheck },
  { href: "/scenarios", label: "Test Scenarios", icon: FlaskConical },
  { href: "/test-suites", label: "Test Suites", icon: Layers },
  { href: "/executions", label: "Executions", icon: PlaySquare },
  { href: "/coverage", label: "Behavioral Coverage", icon: PieChart },
  { href: "/regression", label: "Regression Engine", icon: GitCompare },
  { href: "/mutations", label: "Mutation Testing", icon: Dna },
  { href: "/releases", label: "Release Gates", icon: DoorOpen },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { selectedProject, projects, setSelectedProject } = useProject();

  return (
    <aside className="w-64 bg-[#0B101D] border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
            AI TestBench
            <span className="text-[10px] px-1.5 py-0.2 font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Behavior-First Assurance</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5">
          Active Project
        </label>
        <select
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const found = projects.find((p) => p.id === e.target.value);
            setSelectedProject(found || null);
          }}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">Global / All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.environment})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4", isActive ? "text-cyan-400" : "text-slate-500")} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400/80" />}
            </Link>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Backend Online
          </span>
          <span className="font-mono text-[10px] text-slate-500">FastAPI</span>
        </div>
      </div>
    </aside>
  );
}
