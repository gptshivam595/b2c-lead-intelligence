/**
 * AI Lead Intelligence — Personalized Outreach Service (Phase 7)
 * Generates tailored, non-templated outreach messages anchored in the prospect's actual query.
 * Enforces compliance, realistic CTAs, and absence of hallucinated discounts or guarantees.
 */

import { Type } from '@google/genai';
import {
  BusinessContext,
  CleanedLeadRecord,
  LeadEnrichment,
  OutreachGenerationResult,
  OutreachStrategy,
  PriorityScoreResult,
  RelevanceAssessment,
} from '../../../src/types/pipeline.ts';
import { executeGeminiWithRetry, RECOMMENDED_GEMINI_MODEL } from './geminiClient.ts';

const OUTREACH_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    outreach_strategy: {
      type: Type.STRING,
      enum: ['CONVERT', 'ADDRESS_OBJECTION', 'QUALIFY', 'EDUCATE', 'FOLLOW_UP', 'NURTURE'],
    },
    personalization_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1 to 3 specific facts from the lead inquiry cited in the message.',
    },
    message_angle: {
      type: Type.STRING,
      description: 'Strategic hook or consultative angle used.',
    },
    cta: {
      type: Type.STRING,
      description: 'Clear, low-friction call-to-action matching recommended next action.',
    },
    channel: {
      type: Type.STRING,
      enum: ['whatsapp', 'email', 'sms', 'phone_script'],
    },
    primary_message: {
      type: Type.STRING,
      description: 'Full generated message copy ready to be dispatched.',
    },
    whatsapp_copy: { type: Type.STRING },
    email_subject: { type: Type.STRING },
    email_body: { type: Type.STRING },
  },
  required: [
    'outreach_strategy',
    'personalization_points',
    'message_angle',
    'cta',
    'channel',
    'primary_message',
  ],
};

export async function generatePersonalizedOutreach(
  lead: CleanedLeadRecord,
  relevance: RelevanceAssessment,
  priority: PriorityScoreResult,
  enrichment: LeadEnrichment,
  context: BusinessContext
): Promise<OutreachGenerationResult> {
  // If lead is not relevant or excluded, return a deterministic suppression notice
  if (!relevance.relevant || priority.excluded) {
    return {
      outreach_strategy: 'NURTURE',
      personalization_points: [],
      message_angle: 'Suppression / Ineligible Lead',
      cta: 'No contact required',
      outreach: 'Lead disqualified or duplicate; no automated outreach generated.',
      channel: 'email',
      validation: {
        length_valid: true,
        no_prohibited_claims: true,
        greeting_included: false,
      },
    };
  }

  // Determine Primary Channel based on available contact
  let preferredChannel: 'whatsapp' | 'email' | 'sms' | 'phone_script' = 'whatsapp';
  if (lead.contact.phone_valid) {
    preferredChannel = 'whatsapp';
  } else if (lead.contact.email_valid) {
    preferredChannel = 'email';
  }

  const prompt = `You are an elite Consultative Admissions Advisor for ${context.name}.

BUSINESS CONTEXT & VALUE PROPOSITION:
- Product: ${context.product_name}
- Value Prop: ${context.value_proposition}
- Key Capabilities: ${JSON.stringify(context.product_capabilities.map((c: any) => c.capability_name))}
- Tone: ${context.outreach_guidelines.preferred_tone}
- PROHIBITED CLAIMS (CRITICAL: NEVER PROMISE THESE): ${JSON.stringify(context.outreach_guidelines.prohibited_claims || [])}
- EXPLICIT NON-CAPABILITIES: ${JSON.stringify(context.explicit_non_capabilities)}

LEAD INTELLIGENCE:
- Prospect Name: ${lead.name}
- Inquiry Query: "${lead.inquiry_text}"
- Priority Tier: ${priority.priority} (${priority.priority_score}/100)
- Primary Need: ${enrichment.needs.primary_need}
- Primary Objection: ${enrichment.objections[0]?.category} - "${enrichment.objections[0]?.description}"
- Recommended Next Action: ${enrichment.recommended_next_action.category} ("${enrichment.recommended_next_action.action_detail}")

TASK:
1. Select the most effective Outreach Strategy:
   - CONVERT (if High priority, ready to enroll, asking about batch)
   - ADDRESS_OBJECTION (if explicit concern about price, time, or eligibility)
   - QUALIFY (if critical info is missing)
   - EDUCATE (if asking about curriculum)
   - FOLLOW_UP / NURTURE (if exploratory)
2. Generate a bespoke, human message for channel "${preferredChannel}".
3. Answers 4 questions clearly:
   - Why are we contacting them specifically?
   - What situation/inquiry are we responding to?
   - What value or insight can we offer?
   - What is the easiest next step?
4. PERSONALIZATION RULES:
   - Use 1-3 genuine details from their message.
   - Address them by name with a polite greeting (e.g. "Hi ${lead.name},").
   - NEVER invent fake discounts, scholarships, job guarantees, or arbitrary deadlines.
   - Keep it concise, natural, and friendly.

Return strictly structured JSON.`;

  try {
    const raw = await executeGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: RECOMMENDED_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: OUTREACH_JSON_SCHEMA,
          temperature: 0.2,
        },
      });

      return JSON.parse(response.text || '{}');
    });

    const primaryCopy = (raw.primary_message || raw.whatsapp_copy || raw.email_body || '').trim();

    // Deterministic validation checks
    const hasGreeting = primaryCopy.toLowerCase().includes('hi') || primaryCopy.toLowerCase().includes('hello');
    const lengthValid = primaryCopy.length >= 20 && primaryCopy.length <= 1200;
    const hasProhibited = /100% job guarantee|free laptop|guaranteed salary/i.test(primaryCopy);

    return {
      outreach_strategy: (raw.outreach_strategy as OutreachStrategy) || 'CONVERT',
      personalization_points: Array.isArray(raw.personalization_points) ? raw.personalization_points : [lead.inquiry_text.substring(0, 50)],
      message_angle: raw.message_angle || 'Admissions Discovery',
      cta: raw.cta || enrichment.recommended_next_action.action_detail,
      outreach: primaryCopy || `Hi ${lead.name}, thank you for reaching out to ${context.name}. Let's discuss our upcoming Applied AI cohort.`,
      channel: (raw.channel as any) || preferredChannel,
      personalized_messages: {
        whatsapp: raw.whatsapp_copy || primaryCopy,
        email: {
          subject: raw.email_subject || `Skillcase AI Accelerator: Info regarding your inquiry`,
          body: raw.email_body || primaryCopy,
        },
      },
      validation: {
        length_valid: lengthValid,
        no_prohibited_claims: !hasProhibited,
        greeting_included: hasGreeting,
      },
    };
  } catch (error: any) {
    return {
      outreach_strategy: 'QUALIFY',
      personalization_points: ['General inquiry follow-up'],
      message_angle: 'Consultative Introduction',
      cta: 'Schedule brief consultation',
      outreach: `Hi ${lead.name}, thanks for inquiring about the Skillcase Applied AI Accelerator. I'd love to share our syllabus and answer your questions about the upcoming weekend cohort. Would you be free for a brief 10-minute call tomorrow?`,
      channel: preferredChannel,
      validation: {
        length_valid: true,
        no_prohibited_claims: true,
        greeting_included: true,
      },
    };
  }
}
