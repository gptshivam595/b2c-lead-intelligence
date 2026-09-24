/**
 * AI Lead Intelligence — Configurable Business Context Presets
 */

import { BusinessContext } from '../../src/types/pipeline.ts';

export const SKILLCASE_EDTECH_CONTEXT: BusinessContext = {
  id: 'skillcase-edtech',
  name: 'Skillcase Career Accelerator',
  industry: 'EdTech & Professional Development',
  company_description: 'An elite 16-week career accelerator helping engineers and STEM graduates transition into Applied AI & Full-Stack engineering roles through live mentorship and real-world capstone projects.',
  product_name: 'Applied AI & Full-Stack Career Accelerator',
  value_proposition: 'Bridge the gap between theoretical knowledge and senior engineering expectations with live mentor-led projects, production deployments, and dedicated career placement coaching.',
  target_icp: {
    target_persona: 'Software developers, QA/analysts, IT professionals, and technical graduates looking to pivot into Applied AI, GenAI engineering, and modern Full-Stack development.',
    target_locations: ['India', 'Southeast Asia', 'Remote Global'],
    qualifying_criteria: [
      'Has basic coding familiarity or technical degree/experience',
      'Desires career growth, transition to AI/Full-Stack, or higher compensation',
      'Can commit 8-12 hours per week for live sessions and projects',
      'Actively exploring or planning to enroll within 3 months',
    ],
    disqualifying_criteria: [
      'Seeking non-technical or non-IT courses (e.g., K-12, medical, civil engineering, law)',
      'Unwilling to write code or lacking foundational computer literacy',
      'Explicit do-not-contact, abusive, or spam solicitation',
      'Looking strictly for a free hobby tutorial with no intent to invest in mentorship',
    ],
  },
  product_capabilities: [
    {
      capability_name: 'Live 1-on-1 Industry Mentorship',
      solves_need: 'Overcoming technical roadblocks, architectural code reviews, and personal guidance from senior engineers.',
      target_tier: 'Core',
    },
    {
      capability_name: 'Production Capstone Deployments',
      solves_need: 'Building proof-of-work portfolio with live deployed LLM and full-stack applications to impress hiring managers.',
      target_tier: 'Core',
    },
    {
      capability_name: 'Career & Interview Prep Sprint',
      solves_need: 'System design interviews, live coding rounds, resume restructuring, and direct referral pipeline.',
      target_tier: 'Career',
    },
    {
      capability_name: 'Flexible Weekend / Evening Schedule',
      solves_need: 'Allows working professionals to upskill without leaving their current jobs.',
      target_tier: 'Core',
    },
  ],
  explicit_non_capabilities: [
    'No unconditional 100% job guarantee without completing all assignments and interview milestones.',
    'Not an accredited university degree program (it is an industry-recognized career accelerator).',
    'No free full tuition sponsorship without passing the merit scholarship evaluation.',
    'No physical offline classroom attendance (program is 100% live online interactive).',
  ],
  outreach_guidelines: {
    preferred_tone: 'consultative',
    channels: ['whatsapp', 'email', 'sms', 'phone_script'],
    compliance_rules: [
      'Identify as Skillcase admissions advisor',
      'Respect opt-out requests immediately',
      'Do not make unverified salary hike promises',
    ],
    prohibited_claims: [
      'Guaranteed $200k job immediately',
      'Free laptop or direct cash payments',
      'Zero effort required',
    ],
  },
};

export const INSURTECH_CONTEXT: BusinessContext = {
  id: 'shieldguard-insurtech',
  name: 'ShieldGuard Life & Health',
  industry: 'InsurTech & Personal Financial Services',
  company_description: 'Digital-first insurance platform offering comprehensive term life and critical illness coverage with algorithmic underwriting and instant policy issuance.',
  product_name: 'ShieldGuard Comprehensive Family Protection',
  value_proposition: 'Protect your family with affordable, transparent term life and health coverage with zero medical tests for eligible applicants under 45.',
  target_icp: {
    target_persona: 'Working parents, homeowners, primary breadwinners aged 25-55 needing life cover or medical top-up.',
    qualifying_criteria: [
      'Seeking term life or health insurance protection for self or family',
      'Age between 21 and 65',
      'Resident citizen or valid visa holder',
    ],
    disqualifying_criteria: [
      'Inquiring about car or motor insurance',
      'Seeking business commercial liability insurance',
      'Under age 18',
      'Explicit do-not-contact',
    ],
  },
  product_capabilities: [
    {
      capability_name: 'Instant Digital Underwriting',
      solves_need: 'Avoids weeks of waiting and tedious paperwork for life coverage.',
    },
    {
      capability_name: 'Cashless Hospital Network (10,000+ hospitals)',
      solves_need: 'Immediate peace of mind during health emergencies without out-of-pocket delays.',
    },
  ],
  explicit_non_capabilities: [
    'Does not offer motor, vehicle, or travel insurance.',
    'Does not offer high-risk commercial property insurance.',
  ],
  outreach_guidelines: {
    preferred_tone: 'empathetic',
    channels: ['whatsapp', 'email', 'phone_script'],
  },
};

export const SOLAR_ENERGY_CONTEXT: BusinessContext = {
  id: 'heliovolt-solar',
  name: 'HelioVolt Residential Solar',
  industry: 'Clean Energy & Home Services',
  company_description: 'Turnkey residential rooftop solar engineering and installation with government subsidy processing and zero-down financing.',
  product_name: 'HelioVolt Grid-Tied Solar Power System',
  value_proposition: 'Slash electricity bills by up to 90% while increasing home value with tier-1 solar panels and 25-year performance warranty.',
  target_icp: {
    target_persona: 'Homeowners with independent roofs or villas paying over $100 / month in electricity bills.',
    qualifying_criteria: [
      'Owns independent house, villa, or row house with dedicated roof rights',
      'Monthly electricity bill exceeds $80',
      'Interested in solar installation within 6 months',
    ],
    disqualifying_criteria: [
      'Tenants or apartment dwellers without roof ownership',
      'Seeking portable camping solar chargers',
      'Commercial industrial solar farm inquiries (> 1 MW)',
      'Explicit do-not-contact',
    ],
  },
  product_capabilities: [
    {
      capability_name: 'Government Subsidy Direct Deduction',
      solves_need: 'Reduces upfront cost by up to 30% through direct subsidy coordination.',
    },
    {
      capability_name: 'Net Metering Grid Interconnection',
      solves_need: 'Allows homeowners to export excess power to the grid for utility credits.',
    },
  ],
  explicit_non_capabilities: [
    'Cannot install on rented apartments without landlord & society HOA roof approvals.',
    'Does not sell DIY solar kits without certified engineering installation.',
  ],
  outreach_guidelines: {
    preferred_tone: 'authoritative',
    channels: ['whatsapp', 'phone_script', 'email'],
  },
};

export const REAL_ESTATE_CONTEXT: BusinessContext = {
  id: 'apex-realty',
  name: 'Apex Residential Properties',
  industry: 'Real Estate & Luxury Housing',
  company_description: 'Premier residential real estate consultancy specializing in high-growth urban corridors and master-planned gated communities.',
  product_name: 'Apex Horizon Luxury Residences',
  value_proposition: 'Modern 2 & 3 BHK luxury residences with world-class clubhouse amenities, close to major tech parks and metro stations.',
  target_icp: {
    target_persona: 'Tech professionals, families, and real estate investors looking for primary residences or rental yield.',
    qualifying_criteria: [
      'Looking to purchase or invest in residential property within 12 months',
      'Budget aligned with project pricing tiers',
    ],
    disqualifying_criteria: [
      'Inquiring strictly for low-budget room rental / PG accommodation',
      'Seeking industrial warehouses or agricultural farmland',
      'Explicit do-not-contact',
    ],
  },
  product_capabilities: [
    {
      capability_name: 'Zero Brokerage Direct Builder Pricing',
      solves_need: 'Saves buyers substantial agent commissions and guarantees lowest pre-launch pricing.',
    },
  ],
  explicit_non_capabilities: [
    'Does not manage rental roommate matching or hostels.',
    'Does not sell agricultural or rural farmland.',
  ],
  outreach_guidelines: {
    preferred_tone: 'consultative',
    channels: ['whatsapp', 'phone_script', 'email'],
  },
};

export const PRESET_CONTEXTS: Record<string, BusinessContext> = {
  [SKILLCASE_EDTECH_CONTEXT.id]: SKILLCASE_EDTECH_CONTEXT,
  [INSURTECH_CONTEXT.id]: INSURTECH_CONTEXT,
  [SOLAR_ENERGY_CONTEXT.id]: SOLAR_ENERGY_CONTEXT,
  [REAL_ESTATE_CONTEXT.id]: REAL_ESTATE_CONTEXT,
};

let activeContext: BusinessContext = { ...SKILLCASE_EDTECH_CONTEXT };

export function getActiveBusinessContext(): BusinessContext {
  return activeContext;
}

export function setActiveBusinessContext(context: BusinessContext): void {
  activeContext = { ...context };
}

export function resetActiveBusinessContext(): void {
  activeContext = { ...SKILLCASE_EDTECH_CONTEXT };
}
