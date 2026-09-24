import React from 'react';
import {
  Users,
  Target,
  Flame,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { PipelineExecutionSummary, ProcessedLead } from '../types/pipeline.ts';

interface DashboardViewProps {
  summary: PipelineExecutionSummary;
  leads: ProcessedLead[];
  onSelectTab: (tab: string) => void;
  onFilterPriority?: (prio: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  leads,
  onSelectTab,
  onFilterPriority,
}) => {
  const avgConfidence = Math.round(
    (leads.reduce((acc, l) => acc + l.relevance_confidence, 0) / (leads.length || 1)) * 100
  );
  const avgPriorityScore = Math.round(
    leads.reduce((acc, l) => acc + l.priority_score, 0) / (leads.length || 1)
  );
  const avgDataQuality = summary.quality_summary.average_quality_score;

  return (
    <div className="space-y-6">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Executive Pipeline Health & KPIs
          </h2>
          <p className="text-xs text-slate-500">
            Source:{' '}
            <span className="font-semibold text-slate-700">{summary.file_name}</span> | Profile:{' '}
            <span className="font-semibold text-slate-700">{summary.business_context_name}</span> |
            Executed: {new Date(summary.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Completed in {(summary.duration_ms / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* 5 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ingested</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.total_cleaned_leads}</div>
          <p className="text-2xs text-slate-500 mt-1">100% record preservation</p>
        </div>

        {/* Relevant */}
        <div
          onClick={() => onSelectTab('leads')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Relevant Fit</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {summary.relevance_summary.relevant_count}
          </div>
          <p className="text-2xs text-slate-500 mt-1">
            {Math.round((summary.relevance_summary.relevant_count / (summary.total_cleaned_leads || 1)) * 100)}%
            qualified conversion
          </p>
        </div>

        {/* High Priority */}
        <div
          onClick={() => {
            if (onFilterPriority) onFilterPriority('High');
            onSelectTab('leads');
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">High Priority</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {summary.priority_summary.high_count}
          </div>
          <p className="text-2xs text-emerald-700 font-medium mt-1">Immediate outreach action</p>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => onSelectTab('review')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {summary.qc_summary.flagged_review_count}
          </div>
          <p className="text-2xs text-amber-700 font-medium mt-1">Human SDR attention queue</p>
        </div>

        {/* Duplicates */}
        <div
          onClick={() => onSelectTab('cleaning')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicates</span>
            <Copy className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700">
            {summary.quality_summary.duplicate_count}
          </div>
          <p className="text-2xs text-slate-500 mt-1">
            +{summary.quality_summary.possible_duplicate_count} fuzzy duplicates
          </p>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Priority Tier Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Commercial Priority Tier</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-emerald-700">High (Score 80–100)</span>
                <span className="font-semibold text-slate-900">
                  {summary.priority_summary.high_count}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${(summary.priority_summary.high_count / (summary.total_cleaned_leads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-amber-700">Medium (Score 50–79)</span>
                <span className="font-semibold text-slate-900">
                  {summary.priority_summary.medium_count}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${(summary.priority_summary.medium_count / (summary.total_cleaned_leads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">Low / Ineligible (Score 0–49)</span>
                <span className="font-semibold text-slate-900">
                  {summary.priority_summary.low_count + summary.priority_summary.excluded_count}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full"
                  style={{
                    width: `${((summary.priority_summary.low_count + summary.priority_summary.excluded_count) / (summary.total_cleaned_leads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Relevance Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Relevance Classification</h3>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <span className="font-medium text-indigo-900">Qualified ICP Prospects</span>
              <span className="font-bold text-indigo-900">
                {summary.relevance_summary.relevant_count}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Not Relevant / Out of Scope</span>
              <span className="font-bold text-slate-700">
                {summary.relevance_summary.not_relevant_count}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50 border border-rose-100">
              <span className="font-medium text-rose-800">Hard Disqualified (Spam, Vendor, DNC)</span>
              <span className="font-bold text-rose-800">
                {summary.relevance_summary.hard_disqualified_count}
              </span>
            </div>
          </div>
        </div>

        {/* Quality & Confidence Audit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Quality & Confidence</h3>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-medium">Avg. Quality Score</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{avgDataQuality}/100</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-medium">Avg. AI Confidence</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{avgConfidence}%</div>
            </div>
          </div>
          <div className="text-2xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>QC Validation Passes:</span>
              <span className="font-semibold text-emerald-600">
                {summary.qc_summary.passed_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Flagged for SDR Review:</span>
              <span className="font-semibold text-amber-600">
                {summary.qc_summary.flagged_review_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
