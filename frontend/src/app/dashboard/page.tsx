"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Bot,
  FlaskConical,
  PlaySquare,
  PieChart,
  GitCompare,
  Dna,
  DoorOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { selectedProject } = useProject();
  const [metrics, setMetrics] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pid = selectedProject?.id;
      const [m, execs] = await Promise.all([
        api.getDashboardMetrics(pid),
        api.getExecutions(pid),
      ]);
      setMetrics(m);
      setExecutions(execs.slice(0, 8));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Assurance Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time behavioral telemetry, contract verification, and release gate readiness.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-300 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chatbots */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Connected Chatbots</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {metrics ? metrics.chatbots_count : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              Across <span className="text-slate-200">{metrics?.projects_count || 0}</span> projects
            </div>
          </div>
          <Link
            href="/chatbots"
            className="mt-3 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            Manage connections <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Approved Contracts */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Approved Contracts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {metrics ? metrics.approved_contracts_count : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Out of {metrics?.total_contracts_count || 0} total compiled
            </div>
          </div>
          <Link
            href="/contracts"
            className="mt-3 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Inspect contracts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Behavioral Coverage */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Behavioral Coverage</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {metrics ? `${(metrics.coverage * 100).toFixed(0)}%` : "—"}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (metrics?.coverage || 0) * 100)}%` }}
              />
            </div>
          </div>
          <Link
            href="/coverage"
            className="mt-3 text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            View gap analysis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Release Status */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Release Gate Status</span>
            <DoorOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              {metrics?.latest_release_recommendation === "APPROVED" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  READY
                </span>
              )}
              {metrics?.latest_release_recommendation === "BLOCKED" && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  BLOCKED
                </span>
              )}
              {(!metrics || metrics.latest_release_recommendation === "NO_RELEASES") && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
                  PENDING ASSESSMENT
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Pass Rate: <span className="text-slate-200">{metrics ? `${(metrics.pass_rate * 100).toFixed(0)}%` : "—"}</span>
            </div>
          </div>
          <Link
            href="/releases"
            className="mt-3 text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            Release decision <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics?.approved_scenarios_count || 0} / {metrics?.total_scenarios_count || 0}</div>
            <div className="text-xs text-slate-400">Approved Test Scenarios</div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <PlaySquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics?.total_executions_count || 0}</div>
            <div className="text-xs text-slate-400">Total Executions Run</div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{metrics ? `${(metrics.mutation_score * 100).toFixed(0)}%` : "0%"}</div>
            <div className="text-xs text-slate-400">Mutation Resilience Score</div>
          </div>
        </div>
      </div>

      {/* Recent Executions Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Latest Test Executions</h2>
            <p className="text-xs text-slate-400">Live evaluation findings against registered chatbots</p>
          </div>
          <Link
            href="/executions"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            All executions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {executions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No test executions recorded yet. Execute test scenarios to populate telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">User Input</th>
                  <th className="px-5 py-3">Evaluator</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {executions.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      {e.status === "PASS" ? (
                        <span className="badge-pass flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="badge-fail flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] max-w-xs truncate text-slate-200">
                      {e.input_text || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {e.evaluator_type}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-mono">
                      {e.latency_ms ? `${e.latency_ms} ms` : "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono font-medium">
                      <span className={e.score >= 0.7 ? "text-emerald-400" : "text-rose-400"}>
                        {e.score.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(e.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
