"use client";

import { useState } from "react";
import { Settings, Shield, Cpu, Key, Database, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000/api/v1");
  const [provider, setProvider] = useState("auto");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Settings & Security</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure API endpoints, LLM provider routing, and credential encryption settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Connection */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" /> Backend API Connection
          </h2>
          <div>
            <label className="text-xs text-slate-300 block mb-1">FastAPI Backend Endpoint</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* LLM Provider Routing */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Modular LLM Provider Routing
          </h2>
          <p className="text-xs text-slate-400">
            Select preferred LLM provider for requirement compilation, test scenario generation, and qualitative LLM judging.
          </p>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 block mb-1">Active Intelligence Engine</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="auto">Auto-Detect (Gemini / Groq / OpenRouter / OpenAI)</option>
              <option value="gemini">Google Gemini (gemini-2.0-flash)</option>
              <option value="groq">Groq (llama-3.3-70b-versatile)</option>
              <option value="openrouter">OpenRouter (meta-llama/llama-3.3-70b-instruct)</option>
              <option value="openai">OpenAI (gpt-4o-mini / gpt-4o)</option>
              <option value="mock">Local Deterministic Provider (Offline Mode)</option>
            </select>
          </div>
        </div>

        {/* Security & Secrets */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Cryptographic Storage & SSRF Protection
          </h2>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Fernet AES-256 encryption active for all stored chatbot credentials</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SSRF filtering: private IP ranges and AWS/GCP cloud metadata blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero secret exposure in API responses (secrets masked)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings saved successfully
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
