"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Play, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function TestSuitesPage() {
  const { selectedProject } = useProject();
  const [suites, setSuites] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Execution state
  const [executingSuiteId, setExecutingSuiteId] = useState<string | null>(null);
  const [suiteRunResult, setSuiteRunResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pid = selectedProject?.id;
      const [stList, scList, bList] = await Promise.all([
        api.getTestSuites(pid),
        api.getScenarios(pid),
        api.getChatbots(pid),
      ]);
      setSuites(stList);
      setScenarios(scList);
      setChatbots(bList);
      if (bList.length > 0 && !selectedBotId) {
        setSelectedBotId(bList[0].id);
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

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createTestSuite({
        name,
        description,
        project_id: selectedProject?.id,
        scenario_ids: selectedScenarioIds,
      });
      setShowModal(false);
      setName("");
      setDescription("");
      setSelectedScenarioIds([]);
      await loadData();
    } catch (err: any) {
      alert("Failed to create test suite: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleExecuteSuite = async (suiteId: string) => {
    if (!selectedBotId) {
      alert("Please connect or select a chatbot first.");
      return;
    }
    setExecutingSuiteId(suiteId);
    setSuiteRunResult(null);
    try {
      const res = await api.executeTestSuite(suiteId, {
        chatbot_id: selectedBotId,
        evaluator_mode: "RULE_BASED",
      });
      setSuiteRunResult(res);
      await loadData();
    } catch (err: any) {
      alert("Suite execution failed: " + err.message);
    } finally {
      setExecutingSuiteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Test Suite Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch together scenario groups into CI-ready regression test suites.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
        >
          <Plus className="w-3.5 h-3.5" /> Create Test Suite
        </button>
      </div>

      {chatbots.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-2 text-xs text-slate-400">
          <span>Target Chatbot for Suite Runs:</span>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-400 font-medium"
          >
            {chatbots.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {suiteRunResult && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Suite Run Completed
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              Pass Rate: {(suiteRunResult.pass_rate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Executed</span>
              <span className="text-white font-bold">{suiteRunResult.total_scenarios_executed}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Passed</span>
              <span className="text-emerald-400 font-bold">{suiteRunResult.passed}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Failed</span>
              <span className="text-rose-400 font-bold">{suiteRunResult.failed}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suites.map((st) => (
          <div
            key={st.id}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">{st.name}</h3>
                  <span className="inline-block mt-1 text-[11px] text-cyan-400 font-mono">
                    {st.scenario_count} scenarios assigned
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                {st.description || "No description provided."}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleExecuteSuite(st.id)}
                disabled={executingSuiteId === st.id}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md shadow-cyan-900/20"
              >
                <Play className={`w-3.5 h-3.5 ${executingSuiteId === st.id ? "animate-spin" : ""}`} />
                {executingSuiteId === st.id ? "Executing Suite..." : "Run Test Suite"}
              </button>
              <span className="text-[10px] text-slate-500">{formatDate(st.created_at)}</span>
            </div>
          </div>
        ))}

        {suites.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No test suites created yet.</p>
          </div>
        )}
      </div>

      {/* Create Suite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Create Test Suite
            </h2>
            <form onSubmit={handleCreateSuite} className="space-y-3 flex-1 flex flex-col overflow-hidden">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Suite Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Policy Regression Suite"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="text-xs text-slate-300 block mb-1">
                  Assign Scenarios ({selectedScenarioIds.length} selected)
                </label>
                <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-md p-2 space-y-1.5 max-h-48">
                  {scenarios.map((s) => {
                    const checked = selectedScenarioIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 text-xs text-slate-300 hover:bg-slate-900 p-1.5 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedScenarioIds([...selectedScenarioIds, s.id]);
                            else setSelectedScenarioIds(selectedScenarioIds.filter((id) => id !== s.id));
                          }}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <span className="truncate">{s.title}</span>
                        <span className="text-[10px] font-mono text-cyan-400 ml-auto">{s.scenario_type}</span>
                      </label>
                    );
                  })}
                  {scenarios.length === 0 && (
                    <div className="text-slate-500 text-xs p-2">No scenarios found.</div>
                  )}
                </div>
              </div>

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
                  disabled={creating || !name.trim()}
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 font-medium disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Suite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
