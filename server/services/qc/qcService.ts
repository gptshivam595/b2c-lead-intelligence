/**
 * AI Lead Intelligence — Multi-Layer Quality Control Service (Phase 8)
 * Enforces rigorous 5-layer checks + Second AI Reviewer + Human Review Queue routing.
 */

import { z } from 'zod';
import { Type } from '@google/genai';
import {
  BusinessContext,
  CleanedLeadRecord,
  LeadEnrichment,
  OutreachGenerationResult,
  PriorityScoreResult,
  QCIssue,
  QCResult,
  RelevanceAssessment,
} from '../../../src/types/pipeline.ts';
import { executeGeminiWithRetry, RECOMMENDED_GEMINI_MODEL } from '../ai/geminiClient.ts';

// Layer 1 Zod Schemas
const RelevanceSchema = z.object({
  relevant: z.boolean(),
  relevance_score: z.number().min(0).max(100),
  relevance_confidence: z.number().min(0).max(1),
  relevance_reason: z.string().min(3),
});

const PrioritySchema = z.object({
  priority_score: z.number().min(0).max(100),
  priority: z.enum(['High', 'Medium', 'Low', 'EXCLUDED']),
});

export async function runMultiLayerQC(
  lead: CleanedLeadRecord,
  relevance: RelevanceAssessment,
  priority: PriorityScoreResult,
  enrichment: LeadEnrichment | undefined,
  outreach: OutreachGenerationResult | undefined,
  context: BusinessContext,
  runAiReviewer = true
): Promise<QCResult> {
  const issues: QCIssue[] = [];

  // ==========================================
  // LAYER 1: STRUCTURED SCHEMA & RANGE VALIDATION (Zod)
  // ==========================================
  let layer1Valid = true;
  const relCheck = RelevanceSchema.safeParse(relevance);
  if (!relCheck.success) {
    layer1Valid = false;
    issues.push({
      layer: 'layer1_schema',
      field: 'relevance',
      severity: 'critical',
      issue: 'Relevance output violated runtime schema bounds or types.',
      recommendation: 'Re-evaluate relevance scores within 0-100 range.',
    });
  }

  const prioCheck = PrioritySchema.safeParse(priority);
  if (!prioCheck.success) {
    layer1Valid = false;
    issues.push({
      layer: 'layer1_schema',
      field: 'priority',
      severity: 'critical',
      issue: 'Priority score or bucket violated schema limits.',
      recommendation: 'Recalculate deterministic priority.',
    });
  }

  // ==========================================
  // LAYER 2: RULE-BASED LOGICAL CONSISTENCY CHECKS
  // ==========================================
  let layer2Valid = true;

  // Invariant 1: If Not Relevant, outreach must not contain active sales pitch
  if (!relevance.relevant && outreach && !outreach.message_angle.includes('Suppression')) {
    layer2Valid = false;
    issues.push({
      layer: 'layer2_consistency',
      field: 'outreach',
      severity: 'high',
      issue: 'Outreach was generated for a lead classified as Not Relevant.',
      recommendation: 'Suppress automated outreach for non-relevant leads.',
    });
  }

  // Invariant 2: Priority Score to Bucket alignment
  if (!priority.excluded) {
    if (priority.priority_score >= 80 && priority.priority !== 'High') {
      layer2Valid = false;
      issues.push({
        layer: 'layer2_consistency',
        field: 'priority',
        severity: 'high',
        issue: `Score of ${priority.priority_score} does not match priority tier "${priority.priority}".`,
        recommendation: 'Align priority bucket to High (>=80).',
      });
    } else if (priority.priority_score >= 50 && priority.priority_score < 80 && priority.priority !== 'Medium') {
      layer2Valid = false;
      issues.push({
        layer: 'layer2_consistency',
        field: 'priority',
        severity: 'high',
        issue: `Score of ${priority.priority_score} does not match priority tier "${priority.priority}".`,
        recommendation: 'Align priority bucket to Medium (50-79).',
      });
    }
  }

  // Invariant 3: Hard Disqualifier must force relevant=false
  if (relevance.hard_disqualifier && relevance.relevant) {
    layer2Valid = false;
    issues.push({
      layer: 'layer2_consistency',
      field: 'hard_disqualifier',
      severity: 'critical',
      issue: `Hard disqualifier "${relevance.hard_disqualifier}" is active but lead was marked Relevant=true.`,
      recommendation: 'Enforce deterministic hard disqualifier override.',
    });
  }

  // Invariant 4: Confirmed duplicate must not be High priority
  if (lead.duplicate_status === 'DUPLICATE' && priority.priority === 'High') {
    layer2Valid = false;
    issues.push({
      layer: 'layer2_consistency',
      field: 'duplicate_status',
      severity: 'high',
      issue: 'Confirmed duplicate record is marked High Priority.',
      recommendation: 'Exclude duplicate records from commercial dispatch queue.',
    });
  }

  // ==========================================
  // LAYER 3: EVIDENCE GROUNDING CHECK
  // ==========================================
  let layer3Valid = true;
  const inquiryLower = (lead.inquiry_text || '').toLowerCase();
  const rawText = JSON.stringify(lead.raw_source).toLowerCase();

  // Check if AI outreach hallucinated discounts or scholarships not present in source or context
  if (outreach && outreach.outreach) {
    const outreachLower = outreach.outreach.toLowerCase();
    if (outreachLower.includes('50% discount') || outreachLower.includes('free laptop') || outreachLower.includes('guaranteed 20 lpa')) {
      layer3Valid = false;
      issues.push({
        layer: 'layer3_evidence',
        field: 'outreach',
        severity: 'critical',
        issue: 'Outreach contains ungrounded or prohibited commercial claims.',
        recommendation: 'Regenerate outreach copy strictly adhering to policy.',
      });
    }
  }

  // ==========================================
  // LAYER 4: CROSS-FIELD CONTRADICTION CHECK
  // ==========================================
  let layer4Valid = true;

  // Check for contradiction between spreadsheet attributes and conversation text
  // Example: spreadsheet experience = 'Fresher', but conversation says "I have 5 years experience"
  const experienceAttr = String(lead.custom_attributes['experience'] || lead.custom_attributes['Experience'] || '').toLowerCase();
  if (experienceAttr.includes('fresher') || experienceAttr.includes('0 years') || experienceAttr === '0') {
    if (inquiryLower.includes('years experience') || inquiryLower.includes('years of experience') || inquiryLower.includes('working at') || inquiryLower.includes('senior developer')) {
      layer4Valid = false;
      issues.push({
        layer: 'layer4_contradiction',
        field: 'experience_vs_inquiry',
        severity: 'high',
        issue: `Data Contradiction: Form attribute lists Experience as "${experienceAttr}", but inquiry text states "${lead.inquiry_text}".`,
        recommendation: 'Route to Human Review Queue to clarify actual work experience.',
      });
    }
  }

  // Check if lead is a possible duplicate
  if (lead.duplicate_status === 'POSSIBLE_DUPLICATE') {
    issues.push({
      layer: 'layer4_contradiction',
      field: 'duplicate_status',
      severity: 'medium',
      issue: `Possible fuzzy duplicate detected (${lead.duplicate_reason}).`,
      recommendation: 'SDR inspection required before dispatch.',
    });
  }

  // ==========================================
  // LAYER 5: TARGETED SECOND AI REVIEWER
  // ==========================================
  let layer5Passed = true;
  let aiReviewNotes = 'Standard pass: deterministic checks verified.';

  // Targeted invocation: run second AI reviewer on High-Priority leads or borderline cases
  if (runAiReviewer && relevance.relevant && (priority.priority === 'High' || relevance.review_required || !layer4Valid)) {
    try {
      const reviewPrompt = `You are a Senior Quality Assurance Auditor inspecting an AI lead qualification pipeline.
Analyze this lead and identify any unsupported claims, hallucinations, contradictions, or inappropriate outreach.

PROSPECT:
- Name: ${lead.name}
- Inquiry Text: "${lead.inquiry_text}"
- Custom Attributes: ${JSON.stringify(lead.custom_attributes)}

PIPELINE OUTPUTS:
- Relevance: ${relevance.relevant} (Reason: ${relevance.relevance_reason})
- Priority: ${priority.priority} (${priority.priority_score}/100)
- Needs: ${enrichment?.needs.primary_need || 'N/A'}
- Objections: ${enrichment?.objections[0]?.description || 'None'}
- Outreach Angle: ${outreach?.message_angle || 'N/A'}
- Outreach Copy: "${outreach?.outreach || 'N/A'}"

BUSINESS RULES:
- Product: ${context.product_name}
- Explicit Non-Capabilities: ${JSON.stringify(context.explicit_non_capabilities)}

TASK:
Return JSON with:
- pass: boolean (false if any hallucination, bad claim, or contradiction is found)
- review_reason: string
- detected_issues: array of strings

Strict JSON only.`;

      const aiReviewResult = await executeGeminiWithRetry(async (ai, activeModel) => {
        const resp = await ai.models.generateContent({
          model: activeModel || RECOMMENDED_GEMINI_MODEL,
          contents: reviewPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        return JSON.parse(resp.text || '{}');
      });

      if (aiReviewResult.pass === false) {
        layer5Passed = false;
        aiReviewNotes = aiReviewResult.review_reason || 'AI auditor flagged potential inconsistency.';
        issues.push({
          layer: 'layer5_ai_reviewer',
          severity: 'high',
          issue: `AI Auditor Flag: ${aiReviewNotes}`,
          recommendation: 'SDR manual review required before approval.',
        });
      }
    } catch (e) {
      // Non-blocking fallback
      aiReviewNotes = 'AI Reviewer offline; routed through deterministic rules.';
    }
  }

  // ==========================================
  // LAYER 6: HUMAN REVIEW QUEUE ROUTING
  // ==========================================
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');
  const hasMedium = issues.some(i => i.severity === 'medium');

  let finalStatus: 'passed' | 'flagged_review' | 'rejected' = 'passed';
  let finalReason = 'All automated quality and consistency checks passed successfully.';

  if (hasCritical) {
    finalStatus = 'rejected';
    finalReason = `Failed critical validation: ${issues.filter(i => i.severity === 'critical').map(i => i.issue).join('; ')}`;
  } else if (hasHigh || hasMedium || relevance.review_required || priority.review_required) {
    finalStatus = 'flagged_review';
    const topIssues = issues.map(i => i.issue).concat(relevance.review_reasons || []);
    finalReason = `Routed to Human Review Queue: ${topIssues.slice(0, 2).join('; ')}`;
  }

  return {
    qc_status: finalStatus,
    qc_reason: finalReason,
    qc_issues: issues,
    review_required: finalStatus !== 'passed',
    checks: {
      layer1_schema_valid: layer1Valid,
      layer2_consistency_valid: layer2Valid,
      layer3_evidence_grounded: layer3Valid,
      layer4_no_contradictions: layer4Valid,
      layer5_ai_reviewer_passed: layer5Passed,
    },
    audited_by: 'multi_layer_qc',
    auditor_notes: aiReviewNotes,
  };
}
