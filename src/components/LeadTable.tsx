import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flame,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ProcessedLead } from '../types/pipeline.ts';

interface LeadTableProps {
  leads: ProcessedLead[];
  onSelectLead: (lead: ProcessedLead) => void;
  initialPriorityFilter?: string;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  initialPriorityFilter = 'ALL',
}) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriorityFilter);
  const [relevanceFilter, setRelevanceFilter] = useState<string>('ALL');
  const [qcFilter, setQcFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(search.toLowerCase()) ||
          lead.contact.toLowerCase().includes(search.toLowerCase()) ||
          lead.location.toLowerCase().includes(search.toLowerCase()) ||
          lead.lead_id.toLowerCase().includes(search.toLowerCase()) ||
          (lead.intent || '').toLowerCase().includes(search.toLowerCase()) ||
          (lead.need || '').toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false;
        if (relevanceFilter === 'RELEVANT' && !lead.relevant) return false;
        if (relevanceFilter === 'NOT_RELEVANT' && lead.relevant) return false;
        if (qcFilter !== 'ALL' && lead.qc_status !== qcFilter) return false;

        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.priority_score - a.priority_score
          : a.priority_score - b.priority_score;
      });
  }, [leads, search, priorityFilter, relevanceFilter, qcFilter, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Master Leads Intelligence Explorer
          </h2>
          <p className="text-xs text-slate-500">
            Showing {filteredLeads.length} of {leads.length} leads. Click any record to inspect
            grounded evidence and personalized outreach.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, or need..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All Priorities</option>
          <option value="High">High Priority (80–100)</option>
          <option value="Medium">Medium Priority (50–79)</option>
          <option value="Low">Low Priority (0–49)</option>
          <option value="EXCLUDED">Excluded / Ineligible</option>
        </select>

        {/* Relevance Filter */}
        <select
          value={relevanceFilter}
          onChange={(e) => setRelevanceFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All Relevance</option>
          <option value="RELEVANT">Relevant (ICP Fit)</option>
          <option value="NOT_RELEVANT">Not Relevant / Out of Scope</option>
        </select>

        {/* QC Filter */}
        <select
          value={qcFilter}
          onChange={(e) => setQcFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All QC Statuses</option>
          <option value="passed">Passed Validation</option>
          <option value="flagged_review">Flagged for Review</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Sort Button */}
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Sort Score: {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-2xs tracking-wider">
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-4">Relevant</th>
                <th className="py-3 px-4">Intent / Goal</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">QC Status</th>
                <th className="py-3 px-4">Next Action</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.lead_id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                >
                  {/* Lead Info */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {lead.name}
                    </div>
                    <div className="text-2xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-slate-400">{lead.lead_id}</span>
                      <span>•</span>
                      <span>{lead.location}</span>
                    </div>
                  </td>

                  {/* Relevant Badge */}
                  <td className="py-3 px-4">
                    {lead.relevant ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Yes ({lead.relevance_score}/100)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        No ({lead.relevance_score}/100)
                      </span>
                    )}
                  </td>

                  {/* Intent / Goal */}
                  <td className="py-3 px-4 max-w-[200px]">
                    <div className="truncate text-slate-800 font-medium">
                      {lead.intent || lead.cleaned.inquiry_text || 'Standard upskilling'}
                    </div>
                    <div className="text-2xs text-slate-400 truncate mt-0.5">{lead.need}</div>
                  </td>

                  {/* Priority Tier */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-2xs font-bold ${
                        lead.priority === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : lead.priority === 'Low'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {lead.priority === 'High' && <Flame className="w-3 h-3 mr-1 fill-emerald-700" />}
                      {lead.priority}
                    </span>
                  </td>

                  {/* Deterministic Score */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                    {lead.priority_score}
                  </td>

                  {/* QC Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${
                        lead.qc_status === 'passed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : lead.qc_status === 'flagged_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {lead.qc_status === 'flagged_review' && (
                        <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                      )}
                      {lead.qc_status === 'passed' ? 'PASSED' : 'REVIEW'}
                    </span>
                  </td>

                  {/* Next Action */}
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="truncate text-slate-700">
                      {lead.next_action || 'Review inquiry'}
                    </div>
                  </td>

                  {/* Row Chevron */}
                  <td className="py-3 px-3 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 inline transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
