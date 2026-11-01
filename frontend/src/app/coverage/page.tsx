"use client";

import { useEffect, useState } from "react";
import { PieChart, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useProject } from "@/context/ProjectContext";

export default function CoveragePage() {
  const { selectedProject } = useProject();
  const [coverageData, setCoverageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCoverage = async () => {
    setLoading(true);
    try {
      const data = await api.getCoverage(selectedProject?.id);
      setCoverageData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoverage();
  }, [selectedProject]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Behavioral Coverage Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-dimensional behavioral testing depth across categories, severities, and adversarial vectors.
        </p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Overall Behavioral Coverage</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {coverageData ? `${(coverageData.coverage * 100).toFixed(0)}%` : "0%"}
            </span>
            <span className="text-xs text-slate-400">
              ({coverageData?.covered_contracts || 0} / {coverageData?.total_approved_contracts || 0} approved contracts tested)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (coverageData?.coverage || 0) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Untested Contracts</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {coverageData?.uncovered_contract_ids?.length || 0}
            </span>
            <span className="text-xs text-slate-400">contracts lack execution evidence</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Every approved contract requires at least one executed scenario before production release.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Actionable Gaps</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {coverageData?.recommendations?.length || 0}
            </span>
            <span className="text-xs text-slate-400">suggested test additions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Derived automatically from category coverage and adversarial distribution.
          </p>
        </div>
      </div>

      {/* Category & Severity Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Coverage */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-white">Coverage by Behavior Category</h2>
          <div className="space-y-3">
            {coverageData?.category_coverage &&
              Object.entries(coverageData.category_coverage).map(([cat, rate]: [string, any]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat}</span>
                    <span className="font-mono text-cyan-400 font-bold">{(rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, rate * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            {(!coverageData || Object.keys(coverageData?.category_coverage || {}).length === 0) && (
              <div className="text-xs text-slate-500">No categories found in approved contracts.</div>
            )}
          </div>
        </div>

        {/* Severity Coverage */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-white">Coverage by Severity Level</h2>
          <div className="space-y-3">
            {coverageData?.severity_coverage &&
              Object.entries(coverageData.severity_coverage).map(([sev, rate]: [string, any]) => (
                <div key={sev} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{sev}</span>
                    <span className="font-mono text-indigo-400 font-bold">{(rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, rate * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            {(!coverageData || Object.keys(coverageData?.severity_coverage || {}).length === 0) && (
              <div className="text-xs text-slate-500">No severities found in approved contracts.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations & Gaps */}
      {coverageData?.recommendations?.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Recommended Tests to Close Coverage Gaps
          </h2>
          <div className="space-y-2">
            {coverageData.recommendations.map((rec: string, i: number) => (
              <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>{rec}</span>
                <Link
                  href="/scenarios"
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1"
                >
                  Generate Scenario <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
