"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Plus, Activity, Trash2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function ChatbotsPage() {
  const { selectedProject } = useProject();
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadChatbots = async () => {
    setLoading(true);
    try {
      const list = await api.getChatbots(selectedProject?.id);
      setChatbots(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatbots();
  }, [selectedProject]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testChatbotConnection(id);
      alert(`Success! Connection status: ${res.status}. Latency: ${res.latency_ms}ms\nSample response: "${res.extracted_response}"`);
      await loadChatbots();
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
      await loadChatbots();
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete chatbot connection "${name}"?`)) return;
    try {
      await api.deleteChatbot(id);
      await loadChatbots();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Registered Chatbots</h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect external LLMs or customer service chatbots via REST API adapters.
          </p>
        </div>
        <Link
          href="/chatbots/connect"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-medium shadow-md shadow-cyan-900/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Connect Chatbot
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbots.map((b) => (
          <div
            key={b.id}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">{b.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {b.status === "CONNECTED" ? (
                      <span className="badge-pass flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> CONNECTED
                      </span>
                    ) : (
                      <span className="badge-warn flex items-center gap-1 text-[10px]">
                        <AlertCircle className="w-3 h-3" /> {b.status}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {b.http_method}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="text-[11px] text-slate-400 truncate">
                  <span className="text-slate-500">Endpoint:</span> {b.endpoint_url}
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Auth:</span> {b.authentication_type}
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Response Path:</span>{" "}
                  <code className="text-cyan-400 text-[10px] bg-slate-950 px-1 py-0.5 rounded">
                    {b.response_path}
                  </code>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleTestConnection(b.id)}
                disabled={testingId === b.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors disabled:opacity-50"
              >
                <Activity className={`w-3 h-3 text-cyan-400 ${testingId === b.id ? "animate-spin" : ""}`} />
                {testingId === b.id ? "Testing..." : "Test Connection"}
              </button>
              <span className="text-[10px] text-slate-500">{formatDate(b.created_at)}</span>
            </div>
          </div>
        ))}

        {chatbots.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
            <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No chatbots registered yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              You can connect our built-in sample customer support chatbot running at{" "}
              <code className="text-cyan-400">http://127.0.0.1:8001/chat</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
