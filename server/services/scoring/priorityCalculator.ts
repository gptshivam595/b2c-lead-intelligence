/**
 * AI Lead Intelligence — Deterministic Priority Engine (Phase 6)
 * Math-driven prioritization strictly enforced in application code.
 *
 * Dimensions (0 to 5 scale):
 * - Need Fit: 20% (Multiplier: 4)
 * - Intent Strength: 25% (Multiplier: 5)
 * - Urgency / Timeline: 20% (Multiplier: 4)
 * - Buying Signals: 20% (Multiplier: 4)
 * - Actionability: 15% (Multiplier: 3)
 * Total Maximum = (5*4) + (5*5) + (5*4) + (5*4) + (5*3) = 20 + 25 + 20 + 20 + 15 = 100
 */

import {
  CleanedLeadRecord,
  LeadEnrichment,
  PriorityCategory,
  PriorityDimensionInputs,
  PriorityScoreResult,
  RelevanceAssessment,
} from '../../../src/types/pipeline.ts';

export function calculateDeterministicPriority(
  lead: CleanedLeadRecord,
  relevance: RelevanceAssessment,
  enrichment?: LeadEnrichment,
  manualDimensions?: PriorityDimensionInputs
): PriorityScoreResult {
  // OVERRIDE 1: Confirmed Duplicate Records
  if (lead.duplicate_status === 'DUPLICATE') {
    return {
      priority_score: 0,
      priority: 'EXCLUDED',
      priority_reason: `Excluded from prioritization: Confirmed duplicate of lead ${lead.duplicate_of_lead_id || 'primary'}.`,
      drivers: ['Duplicate record'],
      dimensions: {
        need_fit_scale: 0,
        intent_strength_scale: 0,
        urgency_timeline_scale: 0,
        buying_signals_scale: 0,
        actionability_scale: 0,
      },
      excluded: true,
      exclusion_reason: 'Duplicate record',
      review_required: false,
    };
  }

  // OVERRIDE 2: Hard Disqualified / Explicit Do-Not-Contact / Not Relevant
  if (!relevance.relevant) {
    return {
      priority_score: 0,
      priority: 'EXCLUDED',
      priority_reason: `Excluded from prioritization: Classified as Not Relevant (${relevance.relevance_reason}).`,
      drivers: ['Non-qualifying criteria'],
      dimensions: {
        need_fit_scale: 0,
        intent_strength_scale: 0,
        urgency_timeline_scale: 0,
        buying_signals_scale: 0,
        actionability_scale: 0,
      },
      excluded: true,
      exclusion_reason: relevance.relevance_reason,
      review_required: relevance.review_required,
    };
  }

  // If manual dimensions are provided, calculate score directly using those inputs
  if (manualDimensions) {
    const priorityScore =
      manualDimensions.need_fit_scale * 4 +
      manualDimensions.intent_strength_scale * 5 +
      manualDimensions.urgency_timeline_scale * 4 +
      manualDimensions.buying_signals_scale * 4 +
      manualDimensions.actionability_scale * 3;

    let priority: PriorityCategory = 'Low';
    if (priorityScore >= 80) {
      priority = 'High';
    } else if (priorityScore >= 50) {
      priority = 'Medium';
    } else {
      priority = 'Low';
    }

    return {
      priority_score: priorityScore,
      priority,
      priority_reason: `Calculated ${priority} Priority (${priorityScore}/100) from dimension scale inputs.`,
      drivers: ['Manual dimension inputs'],
      dimensions: manualDimensions,
      excluded: false,
      review_required: false,
    };
  }

  // EVALUATE 5 DIMENSIONS (0 to 5 normalized scale)
  const inquiryLower = (lead.inquiry_text || '').toLowerCase();
  const drivers: string[] = [];

  // 1. Need Fit (0-5, Weight: 20%)
  let needFitScale = 3;
  if (relevance.dimensions.need_fit_score >= 30) {
    needFitScale = 5;
    drivers.push('Near-perfect need alignment with curriculum');
  } else if (relevance.dimensions.need_fit_score >= 22) {
    needFitScale = 4;
    drivers.push('Clear problem fit solved by mentor-led capstones');
  } else if (relevance.dimensions.need_fit_score <= 10) {
    needFitScale = 1;
  }

  // 2. Intent Strength (0-5, Weight: 25%)
  let intentScale = 2;
  const highIntentKeywords = ['enroll', 'admission', 'fee', 'fees', 'cost', 'pricing', 'start date', 'batch', 'apply', 'syllabus', 'register', 'registering'];
  const hasHighIntentWord = highIntentKeywords.some(w => inquiryLower.includes(w));

  if (hasHighIntentWord || (enrichment && enrichment.intent.goal.toLowerCase().includes('transition'))) {
    intentScale = 4;
    drivers.push('Direct purchase intent or pricing inquiry');
  }
  if (inquiryLower.includes('ready to enroll') || inquiryLower.includes('payment') || inquiryLower.includes('budget ready')) {
    intentScale = 5;
    drivers.push('Immediate enrollment readiness');
  } else if (relevance.dimensions.intent_score <= 5) {
    intentScale = 1;
  }

  // 3. Urgency / Timeline (0-5, Weight: 20%)
  let urgencyScale = 2;
  if (inquiryLower.includes('immediately') || inquiryLower.includes('this week') || inquiryLower.includes('asap') || inquiryLower.includes('laid off') || inquiryLower.includes('urgent')) {
    urgencyScale = 5;
    drivers.push('Urgent start timeline within 7–14 days');
  } else if (inquiryLower.includes('next month') || inquiryLower.includes('next batch') || inquiryLower.includes('weekend')) {
    urgencyScale = 4;
    drivers.push('Active timeline for upcoming cohort');
  } else if (inquiryLower.includes('next year') || inquiryLower.includes('just exploring') || inquiryLower.includes('future')) {
    urgencyScale = 1;
  } else {
    urgencyScale = 3; // Standard inbound assumption
  }

  // 4. Buying Signals (0-5, Weight: 20%)
  let buyingSignalsScale = 2;
  let signalCount = 0;
  if (inquiryLower.includes('placement') || inquiryLower.includes('job') || inquiryLower.includes('career') || inquiryLower.includes('mentor')) signalCount++;
  if (inquiryLower.includes('experience') || inquiryLower.includes('years') || inquiryLower.includes('developer') || inquiryLower.includes('engineer')) signalCount++;
  if (lead.contact.phone_valid && lead.contact.email_valid) signalCount++;

  if (signalCount >= 3) {
    buyingSignalsScale = 5;
    drivers.push('Multiple strong commercial and profile buying signals');
  } else if (signalCount >= 2) {
    buyingSignalsScale = 4;
    drivers.push('Qualified professional profile with clear career objective');
  } else if (signalCount === 1) {
    buyingSignalsScale = 3;
  } else {
    buyingSignalsScale = 1;
  }

  // 5. Actionability (0-5, Weight: 15%)
  let actionabilityScale = 2;
  const hasPhone = Boolean(lead.contact.phone && lead.contact.phone_valid);
  const hasEmail = Boolean(lead.contact.email && lead.contact.email_valid);

  if (hasPhone && hasEmail) {
    actionabilityScale = 5;
    drivers.push('Omnichannel reachable (Verified Phone + Email)');
  } else if (hasPhone) {
    actionabilityScale = 4;
    drivers.push('Direct phone/WhatsApp reachable');
  } else if (hasEmail) {
    actionabilityScale = 3;
  } else {
    actionabilityScale = 1;
  }

  const dimensions: PriorityDimensionInputs = {
    need_fit_scale: needFitScale,
    intent_strength_scale: intentScale,
    urgency_timeline_scale: urgencyScale,
    buying_signals_scale: buyingSignalsScale,
    actionability_scale: actionabilityScale,
  };

  // Exact Formula:
  // (Need * 4) + (Intent * 5) + (Urgency * 4) + (BuyingSignals * 4) + (Actionability * 3)
  const priorityScore =
    needFitScale * 4 +
    intentScale * 5 +
    urgencyScale * 4 +
    buyingSignalsScale * 4 +
    actionabilityScale * 3;

  let priority: PriorityCategory = 'Low';
  if (priorityScore >= 80) {
    priority = 'High';
  } else if (priorityScore >= 50) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  let reviewRequired = false;
  let reviewReason: string | undefined;

  // Review override if AI error or very low confidence
  if (relevance.classification === 'ai_error') {
    reviewRequired = true;
    reviewReason = 'AI evaluation error: routed to human SDR review for manual qualification.';
  } else if (relevance.relevance_confidence < 0.60) {
    reviewRequired = true;
    reviewReason = 'Low relevance confidence requires sales lead inspection.';
  }

  const reason = relevance.classification === 'ai_error'
    ? `Preliminary ${priority} Priority (${priorityScore}/100) — AI classification pending SDR review (${relevance.ai_error_message || 'API error'}).`
    : (drivers.length > 0
        ? `Rated ${priority} Priority (${priorityScore}/100) based on: ${drivers.slice(0, 3).join('; ')}.`
        : `Rated ${priority} Priority (${priorityScore}/100) based on standard qualification signals.`);

  return {
    priority_score: priorityScore,
    priority,
    priority_reason: reason,
    drivers,
    dimensions,
    excluded: false,
    review_required: reviewRequired,
    review_reason: reviewReason,
  };
}
