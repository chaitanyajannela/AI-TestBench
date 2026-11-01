"use client";

import { useEffect, useState } from "react";
import { PlaySquare, CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function ExecutionsPage() {
  const { selectedProject } = useProject();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedExec, setSelectedExec] = useState<any | null>(null);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      const list = await api.getExecutions(selectedProject?.id);
      setExecutions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [selectedProject]);

  const filtered = executions.filter((e) => {
    const matchesSearch =
      (e.input_text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.assistant_response || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Execution Logs & Evidence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of test runs, chatbot responses, scores, and judge evidence.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompts or responses..."
            className="bg-transparent text-xs text-white focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PASS">Passed (PASS)</option>
            <option value="FAIL">Failed (FAIL)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Prompt Sent</th>
                <th className="px-5 py-3">Response Received</th>
                <th className="px-5 py-3">Evaluator</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Latency</th>
                <th className="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedExec(e)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
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
                    {e.input_text}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] max-w-xs truncate text-slate-300">
                    {e.assistant_response}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                    {e.evaluator_type}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono font-medium">
                    <span className={e.score >= 0.7 ? "text-emerald-400" : "text-rose-400"}>
                      {e.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-mono">
                    {e.latency_ms ? `${e.latency_ms} ms` : "—"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(e.created_at)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No execution records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Inspection Drawer */}
      {selectedExec && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedExec.status === "PASS" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {selectedExec.status}
                </span>
                <h2 className="text-sm font-bold text-white">Execution Record: {selectedExec.id}</h2>
              </div>
              <button
                onClick={() => setSelectedExec(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-1">User Prompt:</span>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 font-mono">
                  {selectedExec.input_text}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">Chatbot Response:</span>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-cyan-200 font-mono whitespace-pre-wrap">
                  {selectedExec.assistant_response}
                </div>
              </div>

              {selectedExec.findings?.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Evaluation Findings:</span>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-rose-400">
                    {selectedExec.findings.map((f: any, i: number) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="font-bold">[{f.type}]</span> {f.detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Evaluator Type</span>
                  <span className="text-slate-300 font-medium">{selectedExec.evaluator_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Score</span>
                  <span className="text-white font-mono font-bold">{selectedExec.score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Latency</span>
                  <span className="text-slate-300 font-mono">{selectedExec.latency_ms} ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
