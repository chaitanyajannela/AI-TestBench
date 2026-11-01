"use client";

import Link from "next/link";
import { PlusCircle, ExternalLink, Activity } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

export function Header() {
  const { selectedProject } = useProject();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B101D]/80 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Context:</span>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-md text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          {selectedProject ? `${selectedProject.name} [${selectedProject.environment}]` : "All Projects"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/chatbots/connect"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-medium shadow-md shadow-cyan-900/30 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Connect Chatbot
        </Link>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-md text-xs font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          API Swagger
        </a>
      </div>
    </header>
  );
}
