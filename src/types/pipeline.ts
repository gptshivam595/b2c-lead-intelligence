/**
 * AI Lead Intelligence — Comprehensive Shared Domain Types (Phases 1-8)
 */

export type DuplicateStatus = 'UNIQUE' | 'DUPLICATE' | 'POSSIBLE_DUPLICATE';

export type IssueSeverity = 'high' | 'medium' | 'low';

export type FactConfidence = 'STATED' | 'INFERRED' | 'UNKNOWN';

export type PriorityCategory = 'High' | 'Medium' | 'Low' | 'EXCLUDED';

export type OutreachStrategy = 
  | 'CONVERT'
  | 'ADDRESS_OBJECTION'
  | 'QUALIFY'
  | 'EDUCATE'
  | 'FOLLOW_UP'
  | 'NURTURE';

export type ObjectionCategory =
  | 'PRICE'
  | 'ELIGIBILITY'
  | 'TIMELINE'
  | 'CONFIDENCE'
  | 'TRUST'
  | 'CAREER_OUTCOME'
  | 'PRODUCT_FIT'
  | 'INFORMATION_GAP'
  | 'COMPETITOR_COMPARISON'
  | 'OTHER'
  | 'NONE_DETECTED';

export type NextActionCategory =
  | 'ASK_QUALIFICATION_QUESTION'
  | 'ADDRESS_OBJECTION'
  | 'SHARE_PRODUCT_INFORMATION'
  | 'SHARE_PRICING'
  | 'SCHEDULE_CALL'
  | 'SEND_CASE_STUDY'
  | 'FOLLOW_UP'
  | 'NURTURE'
  | 'NO_ACTION'
  | 'HUMAN_REVIEW';

export type QcStatus = 'passed' | 'flagged_review' | 'rejected';

export interface QCIssue {
  layer: 'layer1_schema' | 'layer2_consistency' | 'layer3_evidence' | 'layer4_contradiction' | 'layer5_ai_reviewer';
  field?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

export interface DataIssue {
  lead_id: string;
  field: string;
  issue_type: 
    | 'missing_required' 
    | 'invalid_format' 
    | 'suspicious_phone' 
    | 'malformed_date' 
    | 'contradictory_value' 
    | 'normalization_applied' 
    | 'formula_escaped';
  severity: IssueSeverity;
  explanation: string;
  action_taken: string;
  original_value?: string;
}

export interface BusinessContext {
  id: string;
  name: string;
  industry: string;
  company_description: string;
  product_name: string;
  value_proposition: string;
  target_icp: {
    target_persona: string;
    target_locations?: string[];
    qualifying_criteria: string[];
    disqualifying_criteria: string[];
  };
  product_capabilities: {
    capability_name: string;
    solves_need: string;
    target_tier?: string;
  }[];
  explicit_non_capabilities: string[];
  outreach_guidelines: {
    preferred_tone: 'consultative' | 'empathetic' | 'energetic' | 'authoritative';
    channels: ('whatsapp' | 'email' | 'sms' | 'phone_script')[];
    compliance_rules?: string[];
    prohibited_claims?: string[];
  };
}

export interface RawLeadRecord {
  row_index: number;
  raw_data: Record<string, any>;
}

export interface CleanedLeadRecord {
  lead_id: string;
  row_index: number;
  name: string;
  raw_name: string;
  contact: {
    phone: string | null;
    raw_phone: string | null;
    phone_valid: boolean;
    phone_suspicious: boolean;
    email: string | null;
    raw_email: string | null;
    email_valid: boolean;
  };
  location: string | null;
  raw_location: string | null;
  source: string;
  inquiry_text: string;
  raw_inquiry: string;
  custom_attributes: Record<string, any>;
  data_issues: DataIssue[];
  duplicate_status: DuplicateStatus;
  duplicate_of_lead_id?: string;
  duplicate_reason?: string;
  fuzzy_similarity_score?: number;
  data_quality_score: number; // 0 - 100
  raw_source: Record<string, any>;
}

export interface RelevanceDimensionScores {
  need_fit_score: number;         // 0 - 35
  customer_fit_score: number;     // 0 - 25
  intent_score: number;           // 0 - 20
  eligibility_score: number;      // 0 - 10
  evidence_quality_score: number; // 0 - 10
}

export interface EvidenceItem {
  fact: string;
  quote?: string;
  category: FactConfidence;
}

export interface RelevanceAssessment {
  lead_id: string;
  relevant: boolean;
  classification: 'relevant' | 'not_relevant' | 'uncertain';
  relevance_score: number; // 0 - 100 calculated by application code
  relevance_confidence: number; // 0.0 - 1.0
  relevance_reason: string;
  dimensions: RelevanceDimensionScores;
  evidence: EvidenceItem[];
  unknowns: string[];
  hard_disqualifier: string | null;
  review_required: boolean;
  review_reasons: string[];
}

export interface GroundedInsight {
  topic: string;
  insight: string;
  category: FactConfidence;
  evidence_quote?: string;
}

export interface LeadEnrichment {
  lead_id: string;
  profile: {
    summary: string;
    stated_background?: string;
    career_status?: string;
    inferred_attributes?: string[];
  };
  intent: {
    summary: string;
    goal: string;
    confidence: FactConfidence;
    evidence_quote?: string;
  };
  needs: {
    primary_need: string;
    secondary_needs: string[];
    supported_by_product: boolean;
  };
  objections: {
    category: ObjectionCategory;
    description: string;
    stated_or_inferred: FactConfidence;
    evidence_quote?: string;
  }[];
  missing_information: string[];
  opportunity: {
    description: string;
    value_tier: 'High' | 'Medium' | 'Low' | 'Uncertain';
    upsell_or_pathway?: string;
  };
  recommended_next_action: {
    category: NextActionCategory;
    action_detail: string;
    rationale: string;
  };
  grounded_insights: GroundedInsight[];
}

export interface PriorityDimensionInputs {
  need_fit_scale: number;        // 0 - 5 (Weight: 20%)
  intent_strength_scale: number; // 0 - 5 (Weight: 25%)
  urgency_timeline_scale: number;// 0 - 5 (Weight: 20%)
  buying_signals_scale: number;  // 0 - 5 (Weight: 20%)
  actionability_scale: number;   // 0 - 5 (Weight: 15%)
}

export interface PriorityScoreResult {
  priority_score: number; // 0 - 100
  priority: PriorityCategory;
  priority_reason: string;
  drivers: string[];
  dimensions: PriorityDimensionInputs;
  excluded: boolean;
  exclusion_reason?: string;
  review_required: boolean;
  review_reason?: string;
}

export interface OutreachGenerationResult {
  outreach_strategy: OutreachStrategy;
  personalization_points: string[];
  message_angle: string;
  cta: string;
  outreach: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'phone_script';
  personalized_messages?: {
    whatsapp?: string;
    email?: {
      subject: string;
      body: string;
    };
    sms?: string;
    phone_script?: {
      opener: string;
      value_hook: string;
      objection_response: string;
      call_to_action: string;
    };
  };
  validation: {
    length_valid: boolean;
    no_prohibited_claims: boolean;
    greeting_included: boolean;
  };
}

export interface QCResult {
  qc_status: QcStatus;
  qc_reason: string;
  qc_issues: QCIssue[];
  review_required: boolean;
  checks: {
    layer1_schema_valid: boolean;
    layer2_consistency_valid: boolean;
    layer3_evidence_grounded: boolean;
    layer4_no_contradictions: boolean;
    layer5_ai_reviewer_passed: boolean;
  };
  audited_by: 'multi_layer_qc' | 'human_override';
  auditor_notes?: string;
  human_override?: {
    overridden: boolean;
    overridden_by?: string;
    timestamp?: string;
    notes?: string;
    previous_status?: QcStatus;
  };
}

export interface ProcessedLead {
  lead_id: string;
  name: string;
  contact: string;
  location: string;
  source: string;
  duplicate_status: DuplicateStatus;
  data_quality_score: number;
  data_issues_count: number;
  
  // Phase 4
  relevant: boolean;
  relevance_classification: 'relevant' | 'not_relevant' | 'uncertain';
  relevance_score: number;
  relevance_confidence: number;
  relevance_reason: string;
  
  // Phase 5
  profile?: string;
  intent?: string;
  need?: string;
  primary_objection?: string;
  next_action?: string;
  next_action_category?: NextActionCategory;
  opportunity?: string;
  missing_information?: string;
  
  // Phase 6
  priority: PriorityCategory;
  priority_score: number;
  priority_reason: string;
  priority_drivers: string[];
  
  // Phase 7
  outreach_strategy?: OutreachStrategy;
  personalization_points?: string[];
  message_angle?: string;
  cta?: string;
  outreach?: string;

  // Phase 8 QC
  qc_status: QcStatus;
  qc_reason: string;
  qc_issues: QCIssue[];
  review_required: boolean;

  // Deep objects
  cleaned: CleanedLeadRecord;
  relevance?: RelevanceAssessment;
  enrichment?: LeadEnrichment;
  priority_details?: PriorityScoreResult;
  outreach_details?: OutreachGenerationResult;
  qc: QCResult;
}

export interface DatasetQualitySummary {
  total_records: number;
  clean_records_count: number;
  duplicate_count: number;
  possible_duplicate_count: number;
  missing_fields_count: number;
  invalid_fields_count: number;
  average_quality_score: number;
}

export interface PipelineExecutionSummary {
  run_id: string;
  timestamp: string;
  file_name: string;
  business_context_name: string;
  total_raw_rows: number;
  total_cleaned_leads: number;
  quality_summary: DatasetQualitySummary;
  relevance_summary: {
    relevant_count: number;
    not_relevant_count: number;
    uncertain_count: number;
    review_required_count: number;
    hard_disqualified_count: number;
  };
  priority_summary: {
    high_count: number;
    medium_count: number;
    low_count: number;
    excluded_count: number;
  };
  qc_summary: {
    passed_count: number;
    flagged_review_count: number;
    rejected_count: number;
  };
  outreach_summary?: {
    strategy_counts: Record<string, number>;
  };
  duration_ms: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ActiveTab = 
  | 'upload' 
  | 'cleaning' 
  | 'relevance' 
  | 'enrichment' 
  | 'priority' 
  | 'outreach'
  | 'review' 
  | 'leads' 
  | 'export';
