"use client";

import { useEffect, useState } from "react";
import { FileCode2, Plus, GitCompare, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function PromptsPage() {
  const { selectedProject } = useProject();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create prompt modal
  const [showModal, setShowModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState("v1.0.0-system");
  const [promptContent, setPromptContent] = useState("");
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [provider, setProvider] = useState("openai");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [changeDescription, setChangeDescription] = useState("");
  const [isBaseline, setIsBaseline] = useState(false);
  const [chatbotId, setChatbotId] = useState("");

  // Comparison state
  const [v1Id, setV1Id] = useState("");
  const [v2Id, setV2Id] = useState("");
  const [comparison, setComparison] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pid = selectedProject?.id;
      const [pList, bList] = await Promise.all([
        api.getPrompts(pid),
        api.getChatbots(pid),
      ]);
      setPrompts(pList);
      setChatbots(bList);
      if (bList.length > 0 && !chatbotId) setChatbotId(bList[0].id);
      if (pList.length >= 2) {
        setV1Id(pList[1].id);
        setV2Id(pList[0].id);
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

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptContent.trim()) return;
    try {
      await api.createPromptVersion({
        project_id: selectedProject?.id,
        chatbot_id: chatbotId || undefined,
        version_label: versionLabel,
        prompt_content: promptContent,
        model_name: modelName,
        provider,
        temperature,
        max_tokens: maxTokens,
        change_description: changeDescription,
        is_baseline: isBaseline,
      });
      setShowModal(false);
      setPromptContent("");
      await loadData();
    } catch (err: any) {
      alert("Failed to save prompt: " + err.message);
    }
  };

  const handleCompare = async () => {
    if (!v1Id || !v2Id) return;
    try {
      const res = await api.comparePrompts(v1Id, v2Id);
      setComparison(res);
    } catch (err: any) {
      alert("Comparison failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Prompt & Version Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track immutable system prompt versions, model configurations, and side-by-side prompt diffs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
        >
          <Plus className="w-3.5 h-3.5" /> New Prompt Version
        </button>
      </div>

      {/* Comparison Drawer */}
      {prompts.length >= 2 && (
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <GitCompare className="w-4 h-4 text-cyan-400" /> Compare Prompt Versions
            </h2>
            <button
              onClick={handleCompare}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-xs font-medium"
            >
              Compare Side-by-Side
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Baseline Version (V1)</label>
              <select
                value={v1Id}
                onChange={(e) => setV1Id(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
              >
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.version_label} ({p.model_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Candidate Version (V2)</label>
              <select
                value={v2Id}
                onChange={(e) => setV2Id(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-cyan-400 font-medium"
              >
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.version_label} ({p.model_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {comparison && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-slate-300 block">
                  {comparison.version_1.version_label} (Temp: {comparison.version_1.temperature})
                </span>
                <div className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap">
                  {comparison.version_1.prompt_content}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-cyan-800/60 space-y-1">
                <span className="font-bold text-cyan-400 block">
                  {comparison.version_2.version_label} (Temp: {comparison.version_2.temperature})
                </span>
                <div className="text-cyan-200 font-mono text-[11px] whitespace-pre-wrap">
                  {comparison.version_2.prompt_content}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">{p.version_label}</h3>
                  {p.is_baseline && (
                    <span className="badge-pass text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> BASELINE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                  <span>Model: {p.model_name}</span>
                  <span>•</span>
                  <span>Temp: {p.temperature}</span>
                  <span>•</span>
                  <span>Tokens: {p.max_tokens}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{formatDate(p.created_at)}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 line-clamp-4">
              {p.prompt_content}
            </div>

            {p.change_description && (
              <p className="text-[11px] text-slate-400 italic">
                Change: {p.change_description}
              </p>
            )}
          </div>
        ))}

        {prompts.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
            <FileCode2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No prompt versions tracked yet. Click above to create one.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" /> New System Prompt Version
            </h2>
            <form onSubmit={handleCreatePrompt} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Version Label *</label>
                <input
                  type="text"
                  required
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">System Prompt Content *</label>
                <textarea
                  required
                  rows={5}
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Enter system prompt instructions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Change Description</label>
                <input
                  type="text"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="e.g. Added stricter return policy refusal rules"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isBaseline}
                  onChange={(e) => setIsBaseline(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
                <span>Set as golden baseline version</span>
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
                  disabled={!promptContent.trim()}
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 font-medium disabled:opacity-50"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
