"use client";

import { useEffect, useState } from "react";
import { Dna, Play, CheckCircle2, XCircle, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function MutationsPage() {
  const { selectedProject } = useProject();
  const [mutations, setMutations] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const pid = selectedProject?.id;
      const [mList, sData, scList, bList] = await Promise.all([
        api.getMutations(pid),
        api.getMutationScore(pid),
        api.getScenarios(pid),
        api.getChatbots(pid),
      ]);
      setMutations(mList);
      setScoreData(sData);
      setScenarios(scList.filter((s: any) => s.status === "APPROVED"));
      setChatbots(bList);
      if (bList.length > 0 && !selectedBotId) setSelectedBotId(bList[0].id);
      if (scList.length > 0 && !selectedScenarioId) setSelectedScenarioId(scList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const handleRunMutationTest = async () => {
    if (!selectedScenarioId || !selectedBotId) {
      alert("Please select both a scenario and a connected chatbot.");
      return;
    }
    setRunning(true);
    try {
      const res = await api.runScenarioMutation(selectedScenarioId, selectedBotId);
      alert(`Mutation Test Complete!\nScore: ${(res.mutation_score * 100).toFixed(0)}%\nKilled Mutations: ${res.killed_mutations}/${res.mutations_tested}`);
      await loadData();
    } catch (err: any) {
      alert("Mutation run failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const toggleDetection = async (id: string, currentVal: boolean) => {
    try {
      await api.updateMutationDetection(id, !currentVal);
      await loadData();
    } catch (err: any) {
      alert("Failed to update detection: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Behavioral Mutation Testing</h1>
          <p className="text-xs text-slate-400 mt-1">
            Perturb behavioral rules (negations, removals, weakenings) to test if the test suite catches synthetic bugs.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Mutation Kill Score</span>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2">
            {scoreData ? `${(scoreData.mutation_score * 100).toFixed(0)}%` : "0%"}
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (scoreData?.mutation_score || 0) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Killed / Detected</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {scoreData?.detected_mutations || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Mutations caught by test suite</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Total Valid Mutations</span>
          <div className="text-2xl font-bold text-white mt-2">
            {scoreData?.assessed_mutations || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tested against live chatbot</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Pending Mutations</span>
          <div className="text-2xl font-bold text-slate-400 mt-2">
            {scoreData?.pending_mutations || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting execution run</p>
        </div>
      </div>

      {/* Action Runner Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" /> Automated Mutation Test Runner
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Target Scenario</label>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Target Chatbot</label>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-cyan-400 focus:outline-none"
            >
              {chatbots.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunMutationTest}
            disabled={running || !selectedScenarioId || !selectedBotId}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-md text-xs font-bold shadow-md shadow-pink-900/20 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Testing Mutations..." : "Run Behavioral Mutation Scan"}
          </button>
        </div>
      </div>

      {/* Mutations Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 text-xs font-semibold text-white">
          Mutation Records & Detection Verifications
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Killed / Detected</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Original Behavior</th>
                <th className="px-5 py-3">Mutated Behavior</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {mutations.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <button
                      onClick={() => toggleDetection(m.id, m.detected)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                        m.detected
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {m.detected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {m.detected ? "KILLED (Detected)" : "SURVIVED (Undetected)"}
                    </button>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-cyan-400">
                    {m.mutation_type}
                  </td>
                  <td className="px-5 py-3 text-slate-300 max-w-xs truncate">
                    {m.original_behavior}
                  </td>
                  <td className="px-5 py-3 text-rose-300 font-serif italic max-w-xs truncate">
                    &quot;{m.mutated_behavior || "None (Expectation Removed)"}&quot;
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(m.created_at)}
                  </td>
                </tr>
              ))}

              {mutations.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No mutation tests recorded. Run a mutation scan above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
