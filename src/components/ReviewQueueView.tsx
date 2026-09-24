import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { ProcessedLead } from '../types/pipeline.ts';

interface ReviewQueueViewProps {
  leads: ProcessedLead[];
  onSelectLead: (lead: ProcessedLead) => void;
  onApproveLead: (leadId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  leads,
  onSelectLead,
  onApproveLead,
}) => {
  const flaggedLeads = leads.filter(
    (l) => l.qc_status === 'flagged_review' || l.qc_status === 'rejected' || l.review_required
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          SDR Human Review & Discrepancy Queue
        </h2>
        <p className="text-xs text-slate-500">
          Showing {flaggedLeads.length} leads requiring human judgment. AI flags records with
          low confidence, cross-field contradictions, or potential duplicate submissions.
        </p>
      </div>

      {flaggedLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-base">Review Queue Clear</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All ingested leads passed automated schema validation, logical consistency checks,
            and evidence grounding without discrepancy flags.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flaggedLeads.map((lead) => {
            const primaryIssue = lead.qc.qc_issues[0];
            const severity = primaryIssue?.severity || 'high';

            return (
              <div
                key={lead.lead_id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 transition-colors space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {lead.lead_id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
                    <span className="text-xs text-slate-500">• {lead.contact}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                        severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {severity} Severity
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Priority: {lead.priority} ({lead.priority_score})
                    </span>
                  </div>
                </div>

                {/* Issue Details & Why Flagged */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-200/70 space-y-1">
                    <span className="font-semibold text-amber-900 uppercase text-2xs tracking-wider block">
                      Why This Record Was Flagged
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {lead.qc_reason}
                    </p>
                    {lead.relevance?.review_reasons && lead.relevance.review_reasons.length > 0 && (
                      <p className="text-2xs text-amber-800 pt-1">
                        Reason: {lead.relevance.review_reasons.join('; ')}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700 uppercase text-2xs tracking-wider block">
                      Original Inbound Context
                    </span>
                    <p className="text-slate-700 italic text-2xs line-clamp-3">
                      "{lead.cleaned.inquiry_text || 'No text provided.'}"
                    </p>
                    <div className="text-2xs text-slate-500 pt-1">
                      Custom Attrs: {JSON.stringify(lead.cleaned.custom_attributes)}
                    </div>
                  </div>
                </div>

                {/* Recommended SDR Action & Quick Resolve */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Recommended Action: </span>
                    {lead.next_action || 'Inspect lead profile and confirm inquiry details before messaging.'}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      View Full Dossier
                    </button>
                    <button
                      onClick={() => onApproveLead(lead.lead_id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                    >
                      Approve Record
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
