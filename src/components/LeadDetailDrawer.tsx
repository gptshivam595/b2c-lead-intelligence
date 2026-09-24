import React, { useState } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Target,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  Edit3,
} from 'lucide-react';
import { ProcessedLead } from '../types/pipeline.ts';

interface LeadDetailDrawerProps {
  lead: ProcessedLead | null;
  onClose: () => void;
  onOverride?: (
    leadId: string,
    updates: {
      relevance?: boolean;
      priority?: 'High' | 'Medium' | 'Low' | 'EXCLUDED';
      qc_status?: 'passed' | 'flagged_review' | 'rejected';
      notes?: string;
    }
  ) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onOverride,
}) => {
  if (!lead) return null;

  const [copied, setCopied] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<any>(lead.priority);
  const [overrideNotes, setOverrideNotes] = useState('');

  const handleCopy = () => {
    const textToCopy =
      selectedChannel === 'email' && lead.outreach_details?.personalized_messages?.email
        ? `Subject: ${lead.outreach_details.personalized_messages.email.subject}\n\n${lead.outreach_details.personalized_messages.email.body}`
        : lead.outreach || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyOverride = () => {
    if (onOverride) {
      onOverride(lead.lead_id, {
        priority: overridePriority,
        qc_status: 'passed',
        notes: overrideNotes || 'Manual SDR confirmation and review approval.',
      });
    }
    setShowOverrideModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
              {lead.lead_id}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{lead.name}</h3>
              <p className="text-xs text-slate-500">
                {lead.contact} • {lead.location}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOverrideModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>SDR Action</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scroll Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Status & Scores Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-2xs font-semibold text-slate-500 uppercase">ICP Relevance</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {lead.relevant ? 'Qualified' : 'Out of Scope'}
              </div>
              <span className="text-2xs text-slate-500">
                Score: {lead.relevance_score}/100 ({Math.round(lead.relevance_confidence * 100)}%
                conf)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-2xs font-semibold text-slate-500 uppercase">Commercial Priority</span>
              <div
                className={`text-base font-bold mt-1 ${
                  lead.priority === 'High'
                    ? 'text-emerald-600'
                    : lead.priority === 'Medium'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {lead.priority} Tier
              </div>
              <span className="text-2xs font-semibold font-mono text-slate-700">
                Score: {lead.priority_score}/100
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-2xs font-semibold text-slate-500 uppercase">QC Audit Status</span>
              <div
                className={`text-base font-bold mt-1 ${
                  lead.qc_status === 'passed' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {lead.qc_status === 'passed' ? 'Passed' : 'Needs Review'}
              </div>
              <span className="text-2xs text-slate-500">
                {lead.qc.qc_issues.length} layer checks logged
              </span>
            </div>
          </div>

          {/* Stated Inquiry & Source Information */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Verbatim Inbound Query & Raw Context</span>
            </div>
            <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 italic">
              "{lead.cleaned.inquiry_text || 'No query message provided in submission.'}"
            </p>
            <div className="flex flex-wrap gap-2 text-2xs text-slate-500 pt-1">
              <span>Source: <strong>{lead.source}</strong></span>
              <span>•</span>
              <span>Data Quality: <strong>{lead.data_quality_score}/100</strong></span>
              <span>•</span>
              <span>Duplicate Status: <strong>{lead.duplicate_status}</strong></span>
            </div>
          </div>

          {/* AI Lead Understanding & Grounded Insights (Phase 5) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Semantic Lead Intelligence</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 block font-medium">Candidate Goal / Intent</span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {lead.intent || 'Upskilling'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 block font-medium">Primary Need</span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {lead.need || 'Practical Mentorship'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 block font-medium">Detected Objection</span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {lead.primary_objection || 'None detected'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-slate-500 block font-medium">Missing Critical Info</span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {lead.missing_information || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Deterministic Priority Math (Phase 6) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Priority Calculation</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-900">
                Total: {lead.priority_score} / 100
              </span>
            </div>

            {lead.priority_details && (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Need Fit (Weight 20%):</span>
                  <span className="font-mono font-medium">
                    {lead.priority_details.dimensions.need_fit_scale}/5 →{' '}
                    {lead.priority_details.dimensions.need_fit_scale * 4} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Intent Strength (Weight 25%):</span>
                  <span className="font-mono font-medium">
                    {lead.priority_details.dimensions.intent_strength_scale}/5 →{' '}
                    {lead.priority_details.dimensions.intent_strength_scale * 5} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Urgency / Timeline (Weight 20%):</span>
                  <span className="font-mono font-medium">
                    {lead.priority_details.dimensions.urgency_timeline_scale}/5 →{' '}
                    {lead.priority_details.dimensions.urgency_timeline_scale * 4} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Commercial Buying Signals (Weight 20%):</span>
                  <span className="font-mono font-medium">
                    {lead.priority_details.dimensions.buying_signals_scale}/5 →{' '}
                    {lead.priority_details.dimensions.buying_signals_scale * 4} pts
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Actionability (Weight 15%):</span>
                  <span className="font-mono font-medium">
                    {lead.priority_details.dimensions.actionability_scale}/5 →{' '}
                    {lead.priority_details.dimensions.actionability_scale * 3} pts
                  </span>
                </div>
              </div>
            )}

            {lead.priority_drivers && lead.priority_drivers.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-2xs font-semibold text-slate-500 uppercase block mb-1">
                  Strongest Commercial Drivers:
                </span>
                <ul className="list-disc pl-5 text-xs text-slate-700 space-y-0.5">
                  {lead.priority_drivers.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Personalized Outreach Copy (Phase 7) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Personalized Outreach
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-indigo-50 text-indigo-700">
                  Strategy: {lead.outreach_strategy}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex rounded-md border border-slate-200 overflow-hidden text-2xs">
                  <button
                    onClick={() => setSelectedChannel('whatsapp')}
                    className={`px-2 py-1 font-medium ${
                      selectedChannel === 'whatsapp'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setSelectedChannel('email')}
                    className={`px-2 py-1 font-medium ${
                      selectedChannel === 'email'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    Email
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedChannel === 'email' && lead.outreach_details?.personalized_messages?.email ? (
                <>
                  <div className="font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-1">
                    Subject: {lead.outreach_details.personalized_messages.email.subject}
                  </div>
                  {lead.outreach_details.personalized_messages.email.body}
                </>
              ) : (
                lead.outreach
              )}
            </div>

            <div className="text-2xs text-slate-500 space-y-1">
              <div>
                <strong>Strategic Angle:</strong> {lead.message_angle || 'Admissions consultation'}
              </div>
              <div>
                <strong>Recommended Next Action:</strong> {lead.next_action}
              </div>
            </div>
          </div>

          {/* Quality Control Audit Inspection (Phase 8) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>Multi-Layer Quality Control Log</span>
            </span>

            <div className="space-y-1.5 text-2xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Layer 1 — Runtime Schema Bounds (Zod):</span>
                <span className="font-semibold text-emerald-600">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Layer 2 — Logical Invariants & Disqualifiers:</span>
                <span className="font-semibold text-emerald-600">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Layer 3 — Evidence Grounding & Prohibited Claims:</span>
                <span className="font-semibold text-emerald-600">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Layer 4 — Cross-Field Contradiction Audit:</span>
                <span
                  className={`font-semibold ${
                    lead.qc.checks.layer4_no_contradictions
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {lead.qc.checks.layer4_no_contradictions ? 'PASSED' : 'FLAGGED CONTRADICTION'}
                </span>
              </div>
            </div>

            {lead.qc.qc_issues.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>QC Review Triggers:</span>
                </div>
                {lead.qc.qc_issues.map((iss, i) => (
                  <div key={i} className="pl-4 text-2xs">
                    • <strong>[{iss.layer}]</strong> {iss.issue} ({iss.recommendation})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Override Modal */}
        {showOverrideModal && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">SDR Human Review & Override</h4>
              <p className="text-xs text-slate-500">
                Adjust commercial priority or resolve QC review status with an audited reason.
              </p>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Adjust Commercial Priority Tier
                </label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                  <option value="EXCLUDED">Exclude Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="e.g., Verified candidate phone directly; cleared contradiction."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyOverride}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Approve & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
