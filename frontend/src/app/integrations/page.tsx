"use client";

import { useEffect, useState } from "react";
import { Plug, CheckCircle2, XCircle, AlertCircle, ExternalLink, Download, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export default function IntegrationsPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, bList] = await Promise.all([
        api.getIntegrationStatus(),
        api.getChatbots(),
      ]);
      setStatusData(st.integrations);
      setChatbots(bList);
      if (bList.length > 0 && !selectedBotId) setSelectedBotId(bList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportPromptfoo = async () => {
    if (!selectedBotId) {
      alert("Please select a chatbot to export Promptfoo configuration for.");
      return;
    }
    setExporting(true);
    try {
      const res = await api.exportPromptfoo(selectedBotId);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Export failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testbench-promptfoo-${selectedBotId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert("Promptfoo export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Open-Source Ecosystem Integrations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Status, readiness, and capability matrix for Promptfoo, DeepEval, Giskard, and Langfuse.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-300 rounded-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Status
        </button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statusData &&
          Object.entries(statusData).map(([key, item]: [string, any]) => {
            const isReady = item.connection_status === "READY" || item.connection_status === "CONNECTED";
            return (
              <div
                key={key}
                className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        {item.name}
                        {item.version && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.version}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 ${
                        isReady
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {isReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {item.connection_status}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Supported Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.supported_capabilities?.map((cap: string) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Setup Requirement:</span>
                    <span className="text-slate-300 font-mono text-[11px]">{item.setup_requirement}</span>
                  </div>

                  {item.last_error && (
                    <div className="text-[11px] text-amber-400/90 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{item.last_error}</span>
                    </div>
                  )}
                </div>

                {key === "promptfoo" && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <select
                      value={selectedBotId}
                      onChange={(e) => setSelectedBotId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                    >
                      {chatbots.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleExportPromptfoo}
                      disabled={exporting || !selectedBotId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-md shadow-cyan-900/20 disabled:opacity-50 transition-all"
                    >
                      <Download className={`w-3.5 h-3.5 ${exporting ? "animate-spin" : ""}`} />
                      {exporting ? "Exporting..." : "Export Promptfoo Bundle (.zip)"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
