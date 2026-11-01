"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Activity,
  Bot,
  KeyRound,
  Network,
  FileJson,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";

const steps = [
  { id: 1, title: "Basic Info", icon: Bot },
  { id: 2, title: "API Endpoint", icon: Network },
  { id: 3, title: "Authentication", icon: KeyRound },
  { id: 4, title: "Request Mapping", icon: FileJson },
  { id: 5, title: "Response Mapping", icon: FileJson },
  { id: 6, title: "Test Connection", icon: Activity },
  { id: 7, title: "Save & Deploy", icon: CheckCircle2 },
];

export default function ConnectChatbotWizard() {
  const router = useRouter();
  const { selectedProject, projects } = useProject();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "Customer Support Chatbot",
    description: "Evaluates standard refund policies, confidentiality, and adversarial prompt injection resistance.",
    environment: "development",
    project_id: selectedProject?.id || "",
    endpoint_url: "https://ai-testbench.onrender.com/api/v1/sample-chatbot/chat",
    http_method: "POST",
    timeout_seconds: 20,
    authentication_type: "NONE",
    credential: "",
    request_mapping: '{"message": "message"}',
    response_path: "reply",
  });

  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const runTestConnection = async () => {
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      // First create a temporary/save or test directly
      let reqMapping = { message: "message" };
      try {
        reqMapping = JSON.parse(formData.request_mapping);
      } catch (err) {
        throw new Error("Invalid JSON in request mapping");
      }

      // We register the chatbot or invoke test
      const bot = await api.createChatbot({
        ...formData,
        request_mapping: reqMapping,
        project_id: formData.project_id || undefined,
        credential: formData.credential || undefined,
      });

      const testRes = await api.testChatbotConnection(bot.id);
      setTestResult({ ...testRes, chatbot_id: bot.id });
    } catch (err: any) {
      setTestError(err.message || "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!testResult?.chatbot_id) {
        let reqMapping = { message: "message" };
        try {
          reqMapping = JSON.parse(formData.request_mapping);
        } catch {
          // fallback
        }
        await api.createChatbot({
          ...formData,
          request_mapping: reqMapping,
          project_id: formData.project_id || undefined,
          credential: formData.credential || undefined,
        });
      }
      router.push("/chatbots");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save chatbot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Wizard Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Connect External Chatbot</h1>
        <p className="text-xs text-slate-400 mt-1">
          7-step integration wizard with live connectivity verification and secret encryption.
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="grid grid-cols-7 gap-2">
        {steps.map((s) => {
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-slate-950"
                    : isCurrent
                    ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium ${isCurrent ? "text-cyan-400" : "text-slate-500"}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-xl min-h-[320px] flex flex-col justify-between">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" /> Step 1: Basic Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Chatbot Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Target Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">No Project (Global)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: API Endpoint */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> Step 2: API Endpoint Configuration
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 block">Endpoint URL (HTTP or HTTPS) *</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, endpoint_url: "https://ai-testbench.onrender.com/api/v1/sample-chatbot/chat", response_path: "reply" })}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    ⚡ Use Built-in Live Chatbot
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                  placeholder="https://api.yourcompany.com/chat"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />

                {(formData.endpoint_url.includes("127.0.0.1") || formData.endpoint_url.includes("localhost")) && (
                  <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">⚠️ Cloud SSRF Notice</p>
                    <p>
                      Because your backend is deployed on Render in the cloud, it cannot connect to <code>localhost</code> or <code>127.0.0.1</code> on your home computer.
                    </p>
                    <p>
                      Click <strong className="cursor-pointer underline text-cyan-300" onClick={() => setFormData({ ...formData, endpoint_url: "https://ai-testbench.onrender.com/api/v1/sample-chatbot/chat", response_path: "reply" })}>Use Built-in Live Chatbot</strong> above, or provide a public URL / ngrok tunnel.
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 mt-1">
                  Connect your company's REST chatbot, or use the built-in sample chatbot for instant testing.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">HTTP Method</label>
                  <select
                    value={formData.http_method}
                    onChange={(e) => setFormData({ ...formData, http_method: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Timeout (seconds)</label>
                  <input
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 20 })}
                    min={1}
                    max={120}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Authentication */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" /> Step 3: Authentication & Security
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Authentication Type</label>
                <select
                  value={formData.authentication_type}
                  onChange={(e) => setFormData({ ...formData, authentication_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="NONE">No Authentication</option>
                  <option value="BEARER">Bearer Token (Authorization: Bearer ...)</option>
                  <option value="API_KEY">API Key in Header (X-API-Key: ...)</option>
                </select>
              </div>
              {formData.authentication_type !== "NONE" && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Credential Secret *</label>
                  <input
                    type="password"
                    value={formData.credential}
                    onChange={(e) => setFormData({ ...formData, credential: e.target.value })}
                    placeholder="Enter API token or secret key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Encrypted at rest using AES-256 Fernet keys.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Request Mapping */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-cyan-400" /> Step 4: Request Body Template
            </h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 block">JSON Key Mapping</label>
              <textarea
                value={formData.request_mapping}
                onChange={(e) => setFormData({ ...formData, request_mapping: e.target.value })}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Maps incoming test prompt to payload keys. Example: <code className="text-cyan-400">{`{"message": "message"}`}</code> sends <code className="text-cyan-400">{`{"message": "user prompt"}`}</code>.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Response Mapping */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-cyan-400" /> Step 5: Response Extraction Path
            </h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 block">Dot-Separated JSON Path</label>
              <input
                type="text"
                value={formData.response_path}
                onChange={(e) => setFormData({ ...formData, response_path: e.target.value })}
                placeholder="e.g. reply, or data.answer, or choices.0.message.content"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Extracts the text response from the chatbot's JSON response payload. Use <code className="text-cyan-400">reply</code> for our sample bot.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Test Connection */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Step 6: Live Connection Smoke Test
            </h2>
            <p className="text-xs text-slate-400">
              TestBench will send a live probe request to the configured endpoint and verify response extraction.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={runTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing Connection..." : "Execute Connection Test"}
              </button>
            </div>

            {testError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Connection Failed</div>
                  <div className="text-[11px] mt-0.5">{testError}</div>
                </div>
              </div>
            )}

            {testResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Connection Succeeded ({testResult.latency_ms} ms)
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-emerald-500/20 text-slate-300 font-mono text-[11px]">
                  <span className="text-emerald-400 block text-[10px] uppercase font-bold mb-1">Extracted Response:</span>
                  &quot;{testResult.extracted_response}&quot;
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 7: Save & Deploy */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step 7: Ready to Save & Activate
            </h2>

            {submitError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> Registration Failed
                </p>
                <p>{submitError}</p>
                {(formData.endpoint_url.includes("127.0.0.1") || formData.endpoint_url.includes("localhost")) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, endpoint_url: "https://ai-testbench.onrender.com/api/v1/sample-chatbot/chat", response_path: "reply" });
                      setSubmitError(null);
                    }}
                    className="mt-2 inline-block px-3 py-1 bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-xs hover:bg-cyan-600/50"
                  >
                    ⚡ Switch to Built-in Live Chatbot & Retry
                  </button>
                )}
              </div>
            )}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Chatbot Name:</span>
                <span className="text-white font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Endpoint:</span>
                <span className="text-cyan-400 font-mono text-[11px]">{formData.endpoint_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="text-white font-mono">{formData.http_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth:</span>
                <span className="text-white">{formData.authentication_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold">
                  {testResult ? "CONNECTED (Verified)" : "PENDING VERIFICATION"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Click below to complete registration and begin generating test scenarios.
            </p>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-md shadow-cyan-900/20"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-bold shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {submitting ? "Saving..." : "Save Chatbot"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
