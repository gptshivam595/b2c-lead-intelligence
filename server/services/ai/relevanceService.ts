/**
 * AI Lead Intelligence — AI Relevance Classification Service (Phase 4)
 * Uses structured JSON output with Gemini.
 * Application code calculates and enforces the final score and hard disqualifier rules.
 */

import { Type } from '@google/genai';
import {
  BusinessContext,
  CleanedLeadRecord,
  RelevanceAssessment,
} from '../../../src/types/pipeline.ts';
import { executeGeminiWithRetry, RECOMMENDED_GEMINI_MODEL } from './geminiClient.ts';

const RELEVANCE_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    need_fit_score: {
      type: Type.INTEGER,
      description: 'Need / Problem fit score from 0 to 35 based on stated requirements.',
    },
    customer_fit_score: {
      type: Type.INTEGER,
      description: 'Customer profile match score from 0 to 25 based on background and persona.',
    },
    intent_score: {
      type: Type.INTEGER,
      description: 'Intent and purchase readiness score from 0 to 20.',
    },
    eligibility_score: {
      type: Type.INTEGER,
      description: 'Eligibility / Compatibility score from 0 to 10.',
    },
    evidence_quality_score: {
      type: Type.INTEGER,
      description: 'Evidence quality score from 0 to 10 (higher if verbatim quotes are present).',
    },
    classification: {
      type: Type.STRING,
      enum: ['relevant', 'not_relevant', 'uncertain'],
      description: 'Semantic classification before hard disqualifier check.',
    },
    relevance_confidence: {
      type: Type.NUMBER,
      description: 'Confidence level between 0.0 and 1.0.',
    },
    relevance_reason: {
      type: Type.STRING,
      description: 'Concise explanation justifying the relevance classification.',
    },
    hard_disqualifier: {
      type: Type.STRING,
      description: 'Explicit reason if hard disqualifier triggered (e.g. spam, vendor, DNC, non-tech). Otherwise empty string.',
    },
    evidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fact: { type: Type.STRING },
          quote: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['STATED', 'INFERRED', 'UNKNOWN'],
          },
        },
        required: ['fact', 'category'],
      },
    },
    unknowns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'need_fit_score',
    'customer_fit_score',
    'intent_score',
    'eligibility_score',
    'evidence_quality_score',
    'classification',
    'relevance_confidence',
    'relevance_reason',
    'evidence',
    'unknowns',
  ],
};

export async function classifyLeadRelevance(
  lead: CleanedLeadRecord,
  context: BusinessContext
): Promise<RelevanceAssessment> {
  // Pre-check for duplicate records: duplicates bypass LLM call and receive standard non-relevant triage
  if (lead.duplicate_status === 'DUPLICATE') {
    return {
      lead_id: lead.lead_id,
      relevant: false,
      classification: 'not_relevant',
      relevance_score: 0,
      relevance_confidence: 1.0,
      relevance_reason: `Excluded from pipeline: Identified as confirmed duplicate of lead ${lead.duplicate_of_lead_id || 'primary'}.`,
      dimensions: {
        need_fit_score: 0,
        customer_fit_score: 0,
        intent_score: 0,
        eligibility_score: 0,
        evidence_quality_score: 0,
      },
      evidence: [{ fact: 'Duplicate record linked to primary lead', category: 'STATED' }],
      unknowns: [],
      hard_disqualifier: 'Duplicate record',
      review_required: false,
      review_reasons: [],
    };
  }

  const prompt = `You are an expert B2C Lead Qualification Analyst evaluating an inbound prospect for ${context.name}.

BUSINESS CONTEXT:
- Industry: ${context.industry}
- Product: ${context.product_name}
- Value Proposition: ${context.value_proposition}
- Target ICP Persona: ${context.target_icp.target_persona}
- Qualifying Criteria: ${JSON.stringify(context.target_icp.qualifying_criteria)}
- Disqualifying Criteria: ${JSON.stringify(context.target_icp.disqualifying_criteria)}

PROSPECT DATA:
- Lead ID: ${lead.lead_id}
- Name: ${lead.name}
- Location: ${lead.location}
- Stated Query / Message / Notes: "${lead.inquiry_text || 'No inquiry text provided'}"
- Additional Attributes: ${JSON.stringify(lead.custom_attributes)}

EVALUATION RULES:
1. Need / Problem Fit: Max 35 points. Does the prospect express a problem or desire this product directly solves?
2. Customer Fit: Max 25 points. Does the prospect fit the target persona?
3. Intent: Max 20 points. Does the inquiry show active inquiry, immediate timeline, pricing request, or career transition intent?
4. Eligibility / Compatibility: Max 10 points. Is there any blocker mentioned?
5. Evidence Quality: Max 10 points. High if the inquiry has explicit quotes; lower if vague.
6. HARD DISQUALIFIERS: If the inquiry is an obvious vendor/spam, requests an unrelated product (e.g. medical school, loan, offline classes only), or says "stop calling", identify the hard disqualifier string.
7. Missing information (e.g. location or email) must NOT automatically mean "Not Relevant". Distinguish STATED, INFERRED, and UNKNOWN facts.

Return strictly structured JSON.`;

  try {
    const rawResult = await executeGeminiWithRetry(async (ai, activeModel) => {
      const response = await ai.models.generateContent({
        model: activeModel || RECOMMENDED_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RELEVANCE_JSON_SCHEMA,
          temperature: 0.1, // High determinism
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    });

    // Enforce bounds deterministically
    const needFit = Math.min(35, Math.max(0, Number(rawResult.need_fit_score) || 0));
    const customerFit = Math.min(25, Math.max(0, Number(rawResult.customer_fit_score) || 0));
    const intent = Math.min(20, Math.max(0, Number(rawResult.intent_score) || 0));
    const eligibility = Math.min(10, Math.max(0, Number(rawResult.eligibility_score) || 0));
    const evidenceQuality = Math.min(10, Math.max(0, Number(rawResult.evidence_quality_score) || 0));

    // Calculate score in application code
    let calculatedScore = needFit + customerFit + intent + eligibility + evidenceQuality;
    let confidence = Math.min(1.0, Math.max(0.0, Number(rawResult.relevance_confidence) || 0.8));
    const hardDisqualifier = rawResult.hard_disqualifier ? rawResult.hard_disqualifier.trim() : null;

    const reviewReasons: string[] = [];

    // HARD DISQUALIFIER OVERRIDE (Application Code Enforces Invariant)
    let isRelevant = calculatedScore >= 50;
    if (hardDisqualifier && hardDisqualifier.length > 0) {
      isRelevant = false;
      calculatedScore = Math.min(25, calculatedScore);
      reviewReasons.push(`Hard disqualifier triggered: "${hardDisqualifier}"`);
    }

    if (confidence < 0.70) {
      reviewReasons.push(`Low relevance confidence (${Math.round(confidence * 100)}%)`);
    }
    if (calculatedScore >= 45 && calculatedScore <= 55) {
      reviewReasons.push(`Borderline relevance score (${calculatedScore}/100)`);
    }

    const reviewRequired = reviewReasons.length > 0;

    return {
      lead_id: lead.lead_id,
      relevant: isRelevant,
      classification: isRelevant ? 'relevant' : (reviewRequired ? 'uncertain' : 'not_relevant'),
      relevance_score: calculatedScore,
      relevance_confidence: confidence,
      relevance_reason: rawResult.relevance_reason || (isRelevant ? 'Matches ICP criteria.' : 'Does not match product requirements.'),
      dimensions: {
        need_fit_score: needFit,
        customer_fit_score: customerFit,
        intent_score: intent,
        eligibility_score: eligibility,
        evidence_quality_score: evidenceQuality,
      },
      evidence: Array.isArray(rawResult.evidence) ? rawResult.evidence : [],
      unknowns: Array.isArray(rawResult.unknowns) ? rawResult.unknowns : ['timeline', 'budget'],
      hard_disqualifier: hardDisqualifier || null,
      review_required: reviewRequired,
      review_reasons: reviewReasons,
    };
  } catch (error: any) {
    // Robust AI Error Handling:
    // AI API failure must NEVER be converted to "Relevant = NO" / "NOT_RELEVANT".
    // It is explicitly tagged as "ai_error", preserving the error and routing to human review.
    return {
      lead_id: lead.lead_id,
      relevant: true, // Do NOT silently mark as Not Relevant / Excluded
      classification: 'ai_error',
      relevance_score: 50, // Neutral placeholder score
      relevance_confidence: 0.0,
      relevance_reason: `AI classification temporarily unavailable: ${error?.message || 'Gemini API call failed'}. Routed to human review.`,
      dimensions: {
        need_fit_score: 15,
        customer_fit_score: 10,
        intent_score: 10,
        eligibility_score: 10,
        evidence_quality_score: 5,
      },
      evidence: [{ fact: 'Raw inquiry preserved without alteration', category: 'STATED' }],
      unknowns: ['Full evaluation pending SDR review / AI retry'],
      hard_disqualifier: null,
      review_required: true,
      review_reasons: [`AI Service Error: ${error?.message || 'Gemini API call failed'} - Routed to Human Review Queue`],
      ai_error: true,
      ai_error_message: error?.message || 'Gemini API call failed',
    };
  }
}
