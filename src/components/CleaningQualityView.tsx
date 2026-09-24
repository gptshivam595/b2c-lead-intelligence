import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Copy,
  ArrowRight,
  Filter,
  Check,
  Search,
} from 'lucide-react';
import { CleanedLeadRecord, DatasetQualitySummary } from '../types/pipeline.ts';

interface CleaningQualityViewProps {
  cleanedLeads: CleanedLeadRecord[];
  qualitySummary?: DatasetQualitySummary;
}

export const CleaningQualityView: React.FC<CleaningQualityViewProps> = ({
  cleanedLeads,
  qualitySummary,
}) => {
  const [filter, setFilter] = useState<'all' | 'issues' | 'duplicates'>('all');
  const [search, setSearch] = useState('');

  const filtered = cleanedLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.contact.phone || '').includes(search) ||
      (l.contact.email || '').toLowerCase().includes(search.toLowerCase()) ||
      l.lead_id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'issues') return l.data_issues.length > 0;
    if (filter === 'duplicates') return l.duplicate_status !== 'UNIQUE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Deterministic Data Cleaning & Quality Audit
        </h2>
        <p className="text-xs text-slate-500">
          Raw records are preserved verbatim. Zero AI hallucination is used for cleaning; rules are
          pure regex, whitespace normalization, and deterministic RFC/E.164 verification.
        </p>
      </div>

      {/* Summary Scorecard */}
      {qualitySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Avg Quality</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {qualitySummary.average_quality_score}/100
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Pristine Records</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {qualitySummary.clean_records_count}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Exact Duplicates</span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              {qualitySummary.duplicate_count}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Fuzzy Duplicates</span>
            <div className="text-xl font-bold text-orange-600 mt-0.5">
              {qualitySummary.possible_duplicate_count}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Missing Fields</span>
            <div className="text-xl font-bold text-slate-700 mt-0.5">
              {qualitySummary.missing_fields_count}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Invalid Formats</span>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              {qualitySummary.invalid_fields_count}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search lead or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records ({cleanedLeads.length})
          </button>
          <button
            onClick={() => setFilter('issues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'issues'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Has Data Issues
          </button>
          <button
            onClick={() => setFilter('duplicates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'duplicates'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Duplicates & Fuzzy Matches
          </button>
        </div>
      </div>

      {/* Raw vs Cleaned Side-by-Side Comparison Cards */}
      <div className="space-y-3">
        {filtered.map((lead) => (
          <div
            key={lead.lead_id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {lead.lead_id}
                </span>
                <span className="font-semibold text-slate-900 text-sm">{lead.name}</span>
                <span className="text-xs text-slate-500">• {lead.location}</span>
              </div>

              <div className="flex items-center space-x-2">
                {lead.duplicate_status === 'DUPLICATE' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Duplicate of {lead.duplicate_of_lead_id}
                  </span>
                )}
                {lead.duplicate_status === 'POSSIBLE_DUPLICATE' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Fuzzy Match ({lead.duplicate_of_lead_id})
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                    lead.data_quality_score >= 80
                      ? 'bg-emerald-50 text-emerald-700'
                      : lead.data_quality_score >= 50
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  Quality: {lead.data_quality_score}/100
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Raw Ingestion */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono">
                <div className="font-sans font-semibold text-slate-500 uppercase text-2xs tracking-wider">
                  Raw Spreadsheet Values (Unmodified)
                </div>
                <div>
                  <span className="text-slate-400">Name:</span>{' '}
                  <span className="text-slate-800">{lead.raw_name || '<blank>'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>{' '}
                  <span className="text-slate-800">{lead.contact.raw_phone || '<blank>'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <span className="text-slate-800">{lead.contact.raw_email || '<blank>'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>{' '}
                  <span className="text-slate-800">{lead.raw_location || '<blank>'}</span>
                </div>
              </div>

              {/* Normalized Output */}
              <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/60 space-y-1.5">
                <div className="font-semibold text-emerald-800 uppercase text-2xs tracking-wider">
                  Deterministic Cleaned Output
                </div>
                <div>
                  <span className="text-slate-500">Name:</span>{' '}
                  <span className="font-medium text-slate-900">{lead.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>{' '}
                  <span
                    className={`font-medium ${
                      lead.contact.phone_suspicious
                        ? 'text-rose-600 line-through'
                        : 'text-slate-900'
                    }`}
                  >
                    {lead.contact.phone || 'None'}
                  </span>
                  {lead.contact.phone_suspicious && (
                    <span className="ml-1 text-2xs text-rose-600 font-medium">(Suspicious)</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span
                    className={`font-medium ${
                      !lead.contact.email_valid && lead.contact.email
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {lead.contact.email || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Location:</span>{' '}
                  <span className="font-medium text-slate-900">{lead.location}</span>
                </div>
              </div>
            </div>

            {/* Logged Issues Badges */}
            {lead.data_issues.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-2xs font-semibold text-slate-400 uppercase mr-1">
                  Logged Audits:
                </span>
                {lead.data_issues.map((iss, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium ${
                      iss.severity === 'high'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : iss.severity === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {iss.field}: {iss.explanation}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
