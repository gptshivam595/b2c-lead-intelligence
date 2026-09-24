import React from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  Table,
  ShieldCheck,
  BarChart3,
  FileText,
} from 'lucide-react';
import { PipelineExecutionSummary, ProcessedLead } from '../types/pipeline.ts';

interface ExportViewProps {
  summary: PipelineExecutionSummary | null;
  leads: ProcessedLead[];
  onDownload: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  summary,
  leads,
  onDownload,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Executive Sales Dossier & Excel Export
        </h2>
        <p className="text-xs text-slate-600 max-w-lg mx-auto">
          Export the fully audited, multi-sheet workbook styled for sales operations and SDR dispatch.
          Includes frozen headers, auto-filters, conditional styling, and 100% record retention.
        </p>
      </div>

      {/* Prominent Download Button Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-base">Ready for Download</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {leads.length} Verified Leads • {summary?.relevance_summary.relevant_count || 0} Qualified ICP •{' '}
            {summary?.priority_summary.high_count || 0} High Priority
          </p>
        </div>

        <div>
          <button
            onClick={onDownload}
            disabled={leads.length === 0}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download Final Excel (.xlsx)</span>
          </button>
        </div>

        <div className="text-2xs text-slate-400">
          Generated via ExcelJS • Formula-injection sanitized • Compatible with Microsoft Excel,
          Google Sheets & LibreOffice.
        </div>
      </div>

      {/* Sheet Structure Breakdown Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Included Workbook Sheets
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <Table className="w-4 h-4 text-indigo-600" />
              <span>1. Lead Intelligence (Main View)</span>
            </div>
            <p className="text-2xs text-slate-500">
              Complete SDR operational sheet with 24 columns, priority conditional formatting,
              contact details, and tailored outreach.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>2. QC Review Queue</span>
            </div>
            <p className="text-2xs text-slate-500">
              Isolated audit sheet highlighting leads flagged for cross-field contradictions,
              fuzzy duplicates, or low confidence.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>3. Cleaned Leads</span>
            </div>
            <p className="text-2xs text-slate-500">
              Normalized records with RFC-compliant emails, E.164 phone numbers, and title-cased
              names.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>4. Raw Ingestion Data</span>
            </div>
            <p className="text-2xs text-slate-500">
              Unmodified source rows preserving original formatting, formulas, and headers for 100%
              auditability.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>5. Processing Summary</span>
            </div>
            <p className="text-2xs text-slate-500">
              Executive KPI scorecard with conversion ratios, priority distribution, and quality
              averages.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 font-semibold text-slate-900">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>6. README & Audit Metadata</span>
            </div>
            <p className="text-2xs text-slate-500">
              Timestamp, configuration parameters, target product capabilities, and guardrails log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
