"use client";

import { useEffect, useState } from "react";
import { GitCompare, Plus, AlertTriangle, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function RegressionPage() {
  const { selectedProject } = useProject();
  const [baselines, setBaselines] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState("");
  const [candidateBotId, setCandidateBotId] = useState("");
  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  // New baseline modal state
  const [showModal, setShowModal] = useState(false);
  const [baselineName, setBaselineName] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const pid = selectedProject?.id;
      const [bList, botList] = await Promise.all([
        api.getBaselines(pid),
        api.getChatbots(pid),
      ]);
      setBaselines(bList);
      setChatbots(botList);
      if (bList.length > 0 && !selectedBaselineId) {
        setSelectedBaselineId(bList[0].id);
      }
      if (botList.length > 0 && !candidateBotId) {
        setCandidateBotId(botList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const handleCreateBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baselineName.trim()) return;
    try {
      await api.createBaseline({
        name: baselineName,
        project_id: selectedProject?.id,
      });
      setShowModal(false);
      setBaselineName("");
      await loadData();
    } catch (err: any) {
      alert("Failed to snapshot baseline: " + err.message);
    }
  };

  const handleRunComparison = async () => {
    if (!selectedBaselineId) return;
    setComparing(true);
    try {
      const res = await api.compareBaseline(selectedBaselineId, candidateBotId || undefined);
      setComparison(res);
    } catch (err: any) {
      alert("Comparison failed: " + err.message);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Regression & Version Comparison Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare candidate chatbot responses against immutable baseline snapshots.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
        >
          <Plus className="w-3.5 h-3.5" /> Snapshot Current Baseline
        </button>
      </div>

      {/* Comparison Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Baseline Snapshot</label>
            <select
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
            >
              <option value="">Select a baseline</option>
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.scenario_count} scenarios)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Candidate Chatbot</label>
            <select
              value={candidateBotId}
              onChange={(e) => setCandidateBotId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-cyan-400"
            >
              <option value="">Latest Executions (All)</option>
              {chatbots.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={comparing || !selectedBaselineId}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-bold disabled:opacity-50"
        >
          <GitCompare className={`w-3.5 h-3.5 ${comparing ? "animate-spin" : ""}`} />
          {comparing ? "Comparing..." : "Run Regression Analysis"}
        </button>
      </div>

      {/* Comparison Summary Banner */}
      {comparison && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Regressions (PASS → FAIL)
              </span>
              <div className="text-2xl font-extrabold text-rose-400 mt-2">
                {comparison.regression_count}
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Improvements (FAIL → PASS)
              </span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-2">
                {comparison.improvement_count}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Unchanged Tests</span>
              <div className="text-2xl font-extrabold text-slate-200 mt-2">
                {comparison.unchanged_count}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Total Scenarios Compared</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-2">
                {comparison.total_compared}
              </div>
            </div>
          </div>

          {/* Regressions Table */}
          {comparison.regressions?.length > 0 && (
            <div className="bg-slate-900/60 border border-rose-500/30 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-rose-500/10 border-b border-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Detected Regressions in Candidate
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                {comparison.regressions.map((reg: any, i: number) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400">Scenario ID: {reg.scenario_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="badge-pass text-[10px]">Baseline: PASS</span>
                        <span className="text-slate-500">→</span>
                        <span className="badge-fail text-[10px]">Candidate: FAIL</span>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded text-rose-300 font-mono text-[11px]">
                      Candidate Response: &quot;{reg.response}&quot;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements Table */}
          {comparison.improvements?.length > 0 && (
            <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Detected Improvements in Candidate
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                {comparison.improvements.map((imp: any, i: number) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400">Scenario ID: {imp.scenario_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="badge-fail text-[10px]">Baseline: FAIL</span>
                        <span className="text-slate-500">→</span>
                        <span className="badge-pass text-[10px]">Candidate: PASS</span>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded text-emerald-300 font-mono text-[11px]">
                      Candidate Response: &quot;{imp.response}&quot;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Snapshot Baseline Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-cyan-400" /> Create Regression Baseline Snapshot
            </h2>
            <p className="text-xs text-slate-400">
              Captures current test execution outcomes as an immutable golden baseline for future version comparisons.
            </p>
            <form onSubmit={handleCreateBaseline} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Baseline Name *</label>
                <input
                  type="text"
                  required
                  value={baselineName}
                  onChange={(e) => setBaselineName(e.target.value)}
                  placeholder="e.g. v1.0.0 Production Release Baseline"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!baselineName.trim()}
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 font-medium disabled:opacity-50"
                >
                  Save Baseline Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
