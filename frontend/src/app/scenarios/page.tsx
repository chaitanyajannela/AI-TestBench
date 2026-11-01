"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  Layers,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";

export default function ScenariosPage() {
  const { selectedProject } = useProject();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string>("");

  // Generator modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [targetContractId, setTargetContractId] = useState("");
  const [genCount, setGenCount] = useState(4);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const pid = selectedProject?.id;
      const [scList, cList, bList] = await Promise.all([
        api.getScenarios(pid),
        api.getContracts(pid),
        api.getChatbots(pid),
      ]);
      setScenarios(scList);
      setContracts(cList.filter((c: any) => c.status === "APPROVED"));
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

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await api.setScenarioApproval(id, !current);
      await loadData();
    } catch (err: any) {
      alert("Failed to update approval: " + err.message);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetContractId) return;
    setGenerating(true);
    try {
      await api.generateScenarios(targetContractId, { count: genCount });
      setShowGenModal(false);
      await loadData();
    } catch (err: any) {
      alert("Generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExecuteSingle = async (scenarioId: string) => {
    if (!selectedBotId) {
      alert("Please register or select a chatbot first.");
      return;
    }
    setExecutingId(scenarioId);
    try {
      const res = await api.executeScenario(scenarioId, {
        chatbot_id: selectedBotId,
        evaluator_mode: "RULE_BASED",
      });
      alert(`Test ${res.status}! Score: ${res.score}. Latency: ${res.latency_ms}ms\nResponse: "${res.assistant_response}"`);
      await loadData();
    } catch (err: any) {
      alert("Execution failed: " + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Test Scenario Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic and adversarial scenarios derived from approved behavior contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate Test Scenarios
          </button>
        </div>
      </div>

      {/* Target Chatbot Selector */}
      {chatbots.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Execute Scenarios Against:</span>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-400 font-medium"
            >
              {chatbots.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
              ))}
            </select>
          </div>
          <Link
            href="/test-suites"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" /> Organize into Test Suites
          </Link>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Approval</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {scenarios.map((s) => {
                const isApproved = s.status === "APPROVED";
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleApproval(s.id, isApproved)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isApproved ? "APPROVED" : "DRAFT"}
                      </button>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-200">
                      <div>{s.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 max-w-md truncate">
                        Input: &quot;{s.input_data?.turns?.[0]?.content || "—"}&quot;
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {s.scenario_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                      {s.category}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold ${s.severity === "CRITICAL" ? "text-rose-400" : "text-slate-300"}`}>
                        {s.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleExecuteSingle(s.id)}
                        disabled={!isApproved || executingId === s.id}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 rounded text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <Play className={`w-3 h-3 ${executingId === s.id ? "animate-spin" : ""}`} />
                        {executingId === s.id ? "Running..." : "Execute"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {scenarios.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No test scenarios available. Generate from an approved contract above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Generate Test Scenarios
            </h2>
            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Approved Contract *</label>
                <select
                  required
                  value={targetContractId}
                  onChange={(e) => setTargetContractId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select an Approved Contract</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
                {contracts.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No approved contracts found. Go to Contracts and approve one first.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Number of Scenarios</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 4)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !targetContractId}
                  className="px-3 py-1.5 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 font-medium disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
