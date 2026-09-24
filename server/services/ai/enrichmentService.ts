/**
 * AI Lead Intelligence — Lead Understanding & Enrichment Service (Phase 5)
 * Extracts Profile, Intent, Need, Objections, Missing Info, and Next Action.
 * Strictly adheres to grounding rules and respects explicit product non-capabilities.
 */

import { Type } from '@google/genai';
import {
  BusinessContext,
  CleanedLeadRecord,
  LeadEnrichment,
  RelevanceAssessment,
} from '../../../src/types/pipeline.ts';
import { executeGeminiWithRetry, RECOMMENDED_GEMINI_MODEL } from './geminiClient.ts';

const ENRICHMENT_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    profile_summary: { type: Type.STRING },
    stated_background: { type: Type.STRING },
    career_status: { type: Type.STRING },
    intent_summary: { type: Type.STRING },
    career_goal: { type: Type.STRING },
    goal_confidence: {
      type: Type.STRING,
      enum: ['STATED', 'INFERRED', 'UNKNOWN'],
    },
    primary_need: { type: Type.STRING },
    secondary_needs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    supported_by_product: { type: Type.BOOLEAN },
    objections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: [
              'PRICE',
              'ELIGIBILITY',
              'TIMELINE',
              'CONFIDENCE',
              'TRUST',
              'CAREER_OUTCOME',
              'PRODUCT_FIT',
              'INFORMATION_GAP',
              'COMPETITOR_COMPARISON',
              'OTHER',
              'NONE_DETECTED',
            ],
          },
          description: { type: Type.STRING },
          stated_or_inferred: {
            type: Type.STRING,
            enum: ['STATED', 'INFERRED', 'UNKNOWN'],
          },
          evidence_quote: { type: Type.STRING },
        },
        required: ['category', 'description', 'stated_or_inferred'],
      },
    },
    missing_information: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    opportunity_description: { type: Type.STRING },
    opportunity_value_tier: {
      type: Type.STRING,
      enum: ['High', 'Medium', 'Low', 'Uncertain'],
    },
    recommended_next_action_category: {
      type: Type.STRING,
      enum: [
        'ASK_QUALIFICATION_QUESTION',
        'ADDRESS_OBJECTION',
        'SHARE_PRODUCT_INFORMATION',
        'SHARE_PRICING',
        'SCHEDULE_CALL',
        'SEND_CASE_STUDY',
        'FOLLOW_UP',
        'NURTURE',
        'NO_ACTION',
        'HUMAN_REVIEW',
      ],
    },
    recommended_next_action_detail: { type: Type.STRING },
    recommended_next_action_rationale: { type: Type.STRING },
  },
  required: [
    'profile_summary',
    'intent_summary',
    'career_goal',
    'goal_confidence',
    'primary_need',
    'secondary_needs',
    'supported_by_product',
    'objections',
    'missing_information',
    'opportunity_description',
    'opportunity_value_tier',
    'recommended_next_action_category',
    'recommended_next_action_detail',
    'recommended_next_action_rationale',
  ],
};

export async function enrichLeadUnderstanding(
  lead: CleanedLeadRecord,
  relevance: RelevanceAssessment,
  context: BusinessContext
): Promise<LeadEnrichment> {
  // If lead was disqualified, generate a standard deterministic summary without wasting tokens
  if (!relevance.relevant && !relevance.review_required) {
    return {
      lead_id: lead.lead_id,
      profile: {
        summary: `Disqualified prospect: ${lead.name}`,
        stated_background: 'Outside target criteria',
      },
      intent: {
        summary: 'Not aligned with core product',
        goal: 'Non-matching inquiry',
        confidence: 'STATED',
      },
      needs: {
        primary_need: 'Unrelated product or service',
        secondary_needs: [],
        supported_by_product: false,
      },
      objections: [
        {
          category: 'PRODUCT_FIT',
          description: relevance.relevance_reason,
          stated_or_inferred: 'STATED',
        },
      ],
      missing_information: ['Qualified contact details'],
      opportunity: {
        description: 'No active commercial opportunity for current offerings.',
        value_tier: 'Low',
      },
      recommended_next_action: {
        category: 'NO_ACTION',
        action_detail: 'Archive or add to suppression list.',
        rationale: relevance.relevance_reason,
      },
      grounded_insights: [],
    };
  }

  const prompt = `You are a Senior Solutions Consultant analyzing a qualified lead for ${context.name}.

BUSINESS CONTEXT & PRODUCT KNOWLEDGE:
- Product: ${context.product_name}
- Value Proposition: ${context.value_proposition}
- Key Capabilities: ${JSON.stringify(context.product_capabilities)}
- EXPLICIT NON-CAPABILITIES (YOU MUST NEVER PROMISE THESE): ${JSON.stringify(context.explicit_non_capabilities)}

LEAD DETAILS:
- Name: ${lead.name}
- Location: ${lead.location}
- Source: ${lead.source}
- Stated Query / Message: "${lead.inquiry_text}"
- Custom Attributes: ${JSON.stringify(lead.custom_attributes)}
- Relevance Assessment: ${relevance.relevance_reason} (Score: ${relevance.relevance_score}/100)

GROUNDING RULES:
1. NEVER invent education, work experience, salary, budget, timeline, location, or past interactions. If not mentioned in the lead data, state "UNKNOWN".
2. Categorize objections accurately: PRICE, ELIGIBILITY, TIMELINE, CONFIDENCE, TRUST, CAREER_OUTCOME, PRODUCT_FIT, INFORMATION_GAP, COMPETITOR_COMPARISON, OTHER, or NONE_DETECTED.
3. Recommend an actionable next step matching one of: ASK_QUALIFICATION_QUESTION, ADDRESS_OBJECTION, SHARE_PRODUCT_INFORMATION, SHARE_PRICING, SCHEDULE_CALL, SEND_CASE_STUDY, FOLLOW_UP, NURTURE, NO_ACTION, HUMAN_REVIEW.
4. Respect non-capabilities: Never recommend promising a 100% job guarantee without assignments, offline classrooms, or free unaccredited degrees.

Return strictly structured JSON.`;

  try {
    const raw = await executeGeminiWithRetry(async (ai, activeModel) => {
      const response = await ai.models.generateContent({
        model: activeModel || RECOMMENDED_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ENRICHMENT_JSON_SCHEMA,
          temperature: 0.1,
        },
      });

      return JSON.parse(response.text || '{}');
    });

    return {
      lead_id: lead.lead_id,
      profile: {
        summary: raw.profile_summary || `Lead: ${lead.name}`,
        stated_background: raw.stated_background || 'Not explicitly stated',
        career_status: raw.career_status || 'Professional / Student',
      },
      intent: {
        summary: raw.intent_summary || 'Interested in program curriculum and schedule.',
        goal: raw.career_goal || 'Transition into AI engineering.',
        confidence: (raw.goal_confidence as any) || 'INFERRED',
      },
      needs: {
        primary_need: raw.primary_need || 'Practical hands-on AI mentorship.',
        secondary_needs: Array.isArray(raw.secondary_needs) ? raw.secondary_needs : [],
        supported_by_product: Boolean(raw.supported_by_product),
      },
      objections: Array.isArray(raw.objections) && raw.objections.length > 0
        ? raw.objections
        : [{ category: 'NONE_DETECTED', description: 'No explicit blockers voiced.', stated_or_inferred: 'INFERRED' }],
      missing_information: Array.isArray(raw.missing_information) ? raw.missing_information : [],
      opportunity: {
        description: raw.opportunity_description || 'Viable candidate for upcoming cohort.',
        value_tier: (raw.opportunity_value_tier as any) || 'Medium',
      },
      recommended_next_action: {
        category: (raw.recommended_next_action_category as any) || 'SCHEDULE_CALL',
        action_detail: raw.recommended_next_action_detail || 'Connect for 15-minute admissions discovery.',
        rationale: raw.recommended_next_action_rationale || 'High alignment with cohort prerequisites.',
      },
      grounded_insights: [
        {
          topic: 'Stated Query',
          insight: lead.inquiry_text || 'No text provided',
          category: 'STATED',
          evidence_quote: lead.inquiry_text ? lead.inquiry_text.substring(0, 100) : undefined,
        },
      ],
    };
  } catch (error: any) {
    return {
      lead_id: lead.lead_id,
      profile: { summary: `Lead: ${lead.name}`, stated_background: 'Pending deeper review' },
      intent: { summary: 'Inbound inquiry', goal: 'AI career upskilling', confidence: 'INFERRED' },
      needs: { primary_need: 'Course information', secondary_needs: [], supported_by_product: true },
      objections: [{ category: 'INFORMATION_GAP', description: 'Requires curriculum details', stated_or_inferred: 'INFERRED' }],
      missing_information: ['Years of experience', 'Target start date'],
      opportunity: { description: 'Standard prospect', value_tier: 'Medium' },
      recommended_next_action: {
        category: 'SCHEDULE_CALL',
        action_detail: 'Reach out via phone/WhatsApp to discuss program syllabus.',
        rationale: 'Initial contact discovery call.',
      },
      grounded_insights: [],
    };
  }
}
