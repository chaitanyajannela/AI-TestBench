"use client";

import { useEffect, useState } from "react";
import { DoorOpen, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Plus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function ReleasesPage() {
  const { selectedProject } = useProject();
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assessment Form State
  const [showModal, setShowModal] = useState(false);
  const [releaseName, setReleaseName] = useState("v1.0.0-Release-Candidate");
  const [minCoverage, setMinCoverage] = useState(80);
  const [minMutation, setMinMutation] = useState(50);
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [assessing, setAssessing] = useState(false);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const list = await api.getReleases(selectedProject?.id);
      setReleases(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, [selectedProject]);

  const handleAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseName.trim()) return;
    setAssessing(true);
    try {
      const res = await api.assessRelease({
        project_id: selectedProject?.id,
        release_name: releaseName,
        minimum_coverage: minCoverage / 100,
        minimum_mutation_score: minMutation / 100,
        block_on_critical_failure: blockOnCritical,
      });
      setShowModal(false);
      await loadReleases();
      alert(`Release Assessment Complete!\nDecision: ${res.recommendation}\nRisk Score: ${res.risk_score}`);
    } catch (err: any) {
      alert("Assessment failed: " + err.message);
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Release Gate & Risk Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-based release governance: enforce coverage minimums, mutation kill rates, and zero critical regressions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
        >
          <Plus className="w-3.5 h-3.5" /> Assess Release Gate
        </button>
      </div>

      <div className="space-y-4">
        {releases.map((r) => {
          const isApproved = r.recommendation === "APPROVED";
          const isBlocked = r.recommendation === "BLOCKED";
          return (
            <div
              key={r.id}
              className={`p-6 rounded-xl border bg-slate-900/60 transition-all ${
                isApproved
                  ? "border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                  : isBlocked
                  ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                  : "border-amber-500/40 shadow-lg shadow-amber-950/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-white">{r.release_name}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-extrabold tracking-wider ${
                        isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isBlocked
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {r.recommendation}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Assessed on {formatDate(r.created_at)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Calculated Risk Score
                  </span>
                  <span className={`text-2xl font-black font-mono ${r.risk_score > 0.4 ? "text-rose-400" : "text-emerald-400"}`}>
                    {r.risk_score.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Blockers & Failed Criteria */}
              {r.blockers?.length > 0 && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1 text-rose-300">
                  <span className="font-bold text-rose-400 block text-[11px] uppercase tracking-wider">
                    Release Blockers ({r.blockers.length})
                  </span>
                  {r.blockers.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Passing Criteria */}
              {r.passing_criteria?.length > 0 && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1 text-emerald-300">
                  <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
                    Satisfied Quality Gates
                  </span>
                  {r.passing_criteria.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {r.recommendations?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <div className="space-x-1">
                    <span className="text-slate-300 font-medium">Recommendation:</span>
                    <span>{r.recommendations[0]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {releases.length === 0 && !loading && (
          <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
            <DoorOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No release assessments evaluated yet.</p>
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-cyan-400" /> Assess Release Gate
            </h2>
            <form onSubmit={handleAssess} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Release Name *</label>
                <input
                  type="text"
                  required
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Min Coverage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minCoverage}
                    onChange={(e) => setMinCoverage(parseInt(e.target.value) || 80)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Min Mutation Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minMutation}
                    onChange={(e) => setMinMutation(parseInt(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={blockOnCritical}
                  onChange={(e) => setBlockOnCritical(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
                <span>Block immediately if any critical contract test fails</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assessing || !releaseName.trim()}
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 font-medium disabled:opacity-50"
                >
                  {assessing ? "Evaluating..." : "Run Release Gate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
