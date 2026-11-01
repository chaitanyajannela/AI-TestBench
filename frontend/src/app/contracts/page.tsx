"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";
import { formatDate } from "@/lib/utils";

export default function ContractsPage() {
  const { selectedProject } = useProject();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Requirement compiler state
  const [requirementText, setRequirementText] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<any>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const list = await api.getContracts(selectedProject?.id, statusFilter || undefined);
      setContracts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [selectedProject, statusFilter]);

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementText.trim()) return;
    setCompiling(true);
    setCompileError(null);
    setCompileResult(null);
    try {
      const res = await api.compileRequirement({
        requirement: requirementText,
        project_id: selectedProject?.id,
      });
      setCompileResult(res);
      setRequirementText("");
      await loadContracts();
    } catch (err: any) {
      setCompileError(err.message || "Failed to compile requirement");
    } finally {
      setCompiling(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveContract(id);
      await loadContracts();
    } catch (err: any) {
      alert("Approval error: " + err.message);
    }
  };

  const handleSubmitReview = async (id: string) => {
    try {
      await api.submitContract(id);
      await loadContracts();
    } catch (err: any) {
      alert("Submission error: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Behavior Contract Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">
          Compile natural-language policies into testable, enforceable behavior specifications.
        </p>
      </div>

      {/* Requirement Compiler Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl shadow-lg">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Natural-Language Requirement Compiler
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Describe the expected or prohibited behavior in plain English. The compiler extracts atomic constraints, categories, and measurable criteria.
        </p>

        <form onSubmit={handleCompile} className="mt-4 space-y-3">
          <textarea
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            rows={3}
            placeholder='e.g. "Our customer support chatbot must explain that customers can return products within 30 days. It must never guarantee refunds without verification. It must not disclose internal database credentials."'
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Uses modular LLM intelligence with deterministic verification.
            </span>
            <button
              type="submit"
              disabled={compiling || !requirementText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-md text-xs font-semibold shadow-md shadow-cyan-900/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${compiling ? "animate-spin" : ""}`} />
              {compiling ? "Compiling..." : "Compile to Behavior Contract"}
            </button>
          </div>
        </form>

        {compileError && (
          <div className="mt-3 p-3 bg-rose-500/10 text-rose-400 text-xs rounded-md border border-rose-500/20">
            {compileError}
          </div>
        )}

        {compileResult && (
          <div className="mt-4 p-4 bg-cyan-950/30 border border-cyan-800/60 rounded-lg space-y-2">
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Contract Draft Compiled Successfully
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Contract: &quot;{compileResult.contracts[0]?.name}&quot; (ID: {compileResult.contracts[0]?.id})
            </p>
            {compileResult.unresolved_questions?.length > 0 && (
              <div className="text-[11px] text-amber-400">
                Notice: {compileResult.unresolved_questions[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contracts Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Approved & Draft Contracts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {contracts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {c.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {c.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Type: {c.contract_type}
                      </span>
                    </div>
                  </div>

                  <div>
                    {c.status === "APPROVED" && (
                      <span className="badge-pass flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> APPROVED
                      </span>
                    )}
                    {c.status === "UNDER_REVIEW" && (
                      <span className="badge-warn flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" /> IN REVIEW
                      </span>
                    )}
                    {c.status === "DRAFT" && (
                      <span className="badge-neutral text-[10px]">DRAFT</span>
                    )}
                    {c.status === "REJECTED" && (
                      <span className="badge-fail text-[10px]">REJECTED</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-300 line-clamp-3 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 font-serif italic">
                  &quot;{c.original_requirement}&quot;
                </div>

                {c.prohibited_behavior?.length > 0 && (
                  <div className="mt-3 text-[11px] text-rose-400 flex items-center gap-1">
                    <span className="font-bold">Prohibited:</span> {c.prohibited_behavior[0]}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.status === "DRAFT" && (
                    <button
                      onClick={() => handleSubmitReview(c.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs transition-colors"
                    >
                      Submit for Review
                    </button>
                  )}
                  {c.status === "UNDER_REVIEW" && (
                    <button
                      onClick={() => handleApprove(c.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                    >
                      Approve Contract
                    </button>
                  )}
                </div>

                <Link
                  href={`/contracts/${c.id}`}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}

          {contracts.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No behavior contracts yet. Compile a requirement above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
