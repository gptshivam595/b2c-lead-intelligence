/**
 * AI Lead Intelligence — Unit Test Suite
 * Tests deterministic normalizers, deduplication, scoring boundaries, overrides, and QC validation.
 */

import { normalizeEmail, normalizeName, normalizePhone, normalizeWhitespace } from '../server/services/cleaning/normalizer.ts';
import { sanitizeFormulaString } from '../server/services/ingestion/schemaDetector.ts';
import { deduplicateLeads } from '../server/services/deduplication/deduplicator.ts';
import { calculateDeterministicPriority } from '../server/services/scoring/priorityCalculator.ts';
import { CleanedLeadRecord, RelevanceAssessment, LeadEnrichment } from '../src/types/pipeline.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

function assertEquals(actual: any, expected: any, testName: string) {
  totalTests++;
  if (actual === expected) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} — Expected: ${expected}, Actual: ${actual}`);
    process.exitCode = 1;
  }
}

console.log('\n--- 1. Testing Deterministic Normalizers ---');

// Test Name Normalization
assertEquals(normalizeName('   ROHAN   sharma  '), 'Rohan Sharma', 'Normalizes casing and whitespace for names');
assertEquals(normalizeName(''), '', 'Handles empty name gracefully');

// Test Email Normalization & Typo Domain Correction
const emailResult1 = normalizeEmail('test.user@GMIAL.COM');
assertEquals(emailResult1.normalized, 'test.user@gmail.com', 'Corrects gmial.com typo to gmail.com and lowercases');
assertEquals(emailResult1.isValid, true, 'Validates valid RFC email format');

const emailResult2 = normalizeEmail('invalid..email@domain');
assertEquals(emailResult2.isValid, false, 'Flags invalid RFC email format');

// Test Phone Normalization
const phoneResult1 = normalizePhone('9876543210', 'India');
assertEquals(phoneResult1.normalized, '+919876543210', 'Formats 10-digit Indian mobile to E.164');
assertEquals(phoneResult1.isSuspicious, false, 'Recognizes legitimate mobile sequence');

const phoneResult2 = normalizePhone('9999999999');
assertEquals(phoneResult2.isSuspicious, true, 'Detects suspicious repeated dummy digits (9999999999)');

// Test Formula Injection Sanitization
assertEquals(sanitizeFormulaString('=cmd| /c calc'), "'=cmd| /c calc", 'Escapes leading = formula injection');
assertEquals(sanitizeFormulaString('+SUM(A1:A10)'), "'+SUM(A1:A10)", 'Escapes leading + formula injection');
assertEquals(sanitizeFormulaString('@HYPERLINK("evil.com")'), "'@HYPERLINK(\"evil.com\")", 'Escapes leading @ formula injection');
assertEquals(sanitizeFormulaString('Safe Text'), 'Safe Text', 'Leaves safe text untouched');

console.log('\n--- 2. Testing Deduplication Engine ---');

const mockLeads: CleanedLeadRecord[] = [
  {
    lead_id: 'LEAD-001',
    row_index: 1,
    raw_name: 'Rohan Sharma',
    name: 'Rohan Sharma',
    contact: { phone: '+919876543210', email: 'rohan.sharma@example.com', raw_phone: '9876543210', raw_email: 'rohan.sharma@example.com', phone_valid: true, email_valid: true, phone_suspicious: false },
    location: 'Bengaluru',
    raw_location: 'Bengaluru',
    source: 'Google Ads',
    raw_source: { source: 'Google Ads' },
    inquiry_text: 'Interested in AI engineering cohort.',
    raw_inquiry: 'Interested in AI engineering cohort.',
    custom_attributes: {},
    data_issues: [],
    data_quality_score: 100,
    duplicate_status: 'UNIQUE',
  },
  {
    lead_id: 'LEAD-002',
    row_index: 2,
    raw_name: 'Rohan S.',
    name: 'Rohan S',
    contact: { phone: '+919876543210', email: 'rohan.alt@example.com', raw_phone: '+91 98765 43210', raw_email: 'rohan.alt@example.com', phone_valid: true, email_valid: true, phone_suspicious: false },
    location: 'Bangalore',
    raw_location: 'Bangalore',
    source: 'Referral',
    raw_source: { source: 'Referral' },
    inquiry_text: 'Following up on cohort details.',
    raw_inquiry: 'Following up on cohort details.',
    custom_attributes: {},
    data_issues: [],
    data_quality_score: 95,
    duplicate_status: 'UNIQUE',
  },
  {
    lead_id: 'LEAD-003',
    row_index: 3,
    raw_name: 'Ananya Gupta',
    name: 'Ananya Gupta',
    contact: { phone: '+919811122233', email: 'ananya.g@example.com', raw_phone: '9811122233', raw_email: 'ananya.g@example.com', phone_valid: true, email_valid: true, phone_suspicious: false },
    location: 'Delhi',
    raw_location: 'Delhi',
    source: 'LinkedIn',
    raw_source: { source: 'LinkedIn' },
    inquiry_text: 'What are the batch timings?',
    raw_inquiry: 'What are the batch timings?',
    custom_attributes: {},
    data_issues: [],
    data_quality_score: 100,
    duplicate_status: 'UNIQUE',
  },
];

const dedupResult = deduplicateLeads(mockLeads);
assertEquals(dedupResult.exactDuplicateCount, 1, 'Identifies exact duplicate via normalized phone number');
assertEquals(dedupResult.processedLeads[1].duplicate_status, 'DUPLICATE', 'Marks secondary lead as DUPLICATE');
assertEquals(dedupResult.processedLeads[1].duplicate_of_lead_id, 'LEAD-001', 'References primary lead ID in duplicate_of_lead_id');

console.log('\n--- 3. Testing Deterministic Priority Scoring Boundaries ---');

const baseMockLead = mockLeads[0];
const relevantAssessment: RelevanceAssessment = {
  lead_id: 'LEAD-001',
  relevant: true,
  classification: 'relevant',
  relevance_score: 90,
  relevance_confidence: 0.95,
  relevance_reason: 'Strong fit with engineering cohort',
  dimensions: {
    need_fit_score: 30,
    customer_fit_score: 22,
    intent_score: 18,
    eligibility_score: 10,
    evidence_quality_score: 10,
  },
  evidence: [{ fact: 'Software engineer wanting AI', category: 'STATED' }],
  unknowns: [],
  hard_disqualifier: null,
  review_reasons: [],
  review_required: false,
};

const highEnrichment: LeadEnrichment = {
  lead_id: 'LEAD-001',
  profile: {
    summary: 'Software Engineer with 3 years experience',
    stated_background: 'Java, Python',
    career_status: 'Employed',
  },
  intent: {
    summary: 'Wants to become an AI Engineer',
    goal: 'AI Engineer transition within 30 days',
    confidence: 'STATED',
  },
  needs: {
    primary_need: 'LangChain & RAG Capstones',
    secondary_needs: ['Weekend schedule', 'Live mentor'],
    supported_by_product: true,
  },
  objections: [],
  missing_information: [],
  opportunity: {
    description: 'Immediate cohort buyer',
    value_tier: 'High',
  },
  recommended_next_action: {
    category: 'SCHEDULE_CALL',
    action_detail: 'Book Saturday admissions interview',
    rationale: 'High intent engineer ready for cohort start',
  },
  grounded_insights: [],
};

// 1. High Score Boundary (Max Inputs -> 100/100 High)
const highPriorityResult = calculateDeterministicPriority(baseMockLead, relevantAssessment, highEnrichment, {
  need_fit_scale: 5,
  intent_strength_scale: 5,
  urgency_timeline_scale: 5,
  buying_signals_scale: 5,
  actionability_scale: 5,
});
assertEquals(highPriorityResult.priority_score, 100, 'Calculates 100/100 score for max scale inputs');
assertEquals(highPriorityResult.priority, 'High', 'Categorizes 100 as High priority');

// 2. Medium Score Boundary (Need=3, Intent=3, Urgency=3, Buying=3, Action=3 -> 60/100 Medium)
// Math: (3*4) + (3*5) + (3*4) + (3*4) + (3*3) = 12 + 15 + 12 + 12 + 9 = 60
const medPriorityResult = calculateDeterministicPriority(baseMockLead, relevantAssessment, highEnrichment, {
  need_fit_scale: 3,
  intent_strength_scale: 3,
  urgency_timeline_scale: 3,
  buying_signals_scale: 3,
  actionability_scale: 3,
});
assertEquals(medPriorityResult.priority_score, 60, 'Calculates 60/100 for scale 3 inputs');
assertEquals(medPriorityResult.priority, 'Medium', 'Categorizes 60 as Medium priority (50-79)');

// 3. Low Score Boundary (Need=1, Intent=1, Urgency=1, Buying=1, Action=1 -> 20/100 Low)
// Math: (1*4) + (1*5) + (1*4) + (1*4) + (1*3) = 20
const lowPriorityResult = calculateDeterministicPriority(baseMockLead, relevantAssessment, highEnrichment, {
  need_fit_scale: 1,
  intent_strength_scale: 1,
  urgency_timeline_scale: 1,
  buying_signals_scale: 1,
  actionability_scale: 1,
});
assertEquals(lowPriorityResult.priority_score, 20, 'Calculates 20/100 for scale 1 inputs');
assertEquals(lowPriorityResult.priority, 'Low', 'Categorizes 20 as Low priority (0-49)');

console.log('\n--- 4. Testing Critical Overrides ---');

// Override 1: Not Relevant Lead -> Score 0, Category EXCLUDED
const notRelevantAssessment: RelevanceAssessment = {
  ...relevantAssessment,
  relevant: false,
  relevance_score: 20,
  hard_disqualifier: 'B2B Vendor',
};
const excludedOverride1 = calculateDeterministicPriority(baseMockLead, notRelevantAssessment, highEnrichment);
assertEquals(excludedOverride1.priority_score, 0, 'Forces priority score to 0 when lead is Not Relevant');
assertEquals(excludedOverride1.priority, 'EXCLUDED', 'Categorizes Not Relevant lead as EXCLUDED');

// Override 2: Duplicate Lead -> Score 0, Category EXCLUDED
const duplicateLead: CleanedLeadRecord = {
  ...baseMockLead,
  duplicate_status: 'DUPLICATE',
};
const excludedOverride2 = calculateDeterministicPriority(duplicateLead, relevantAssessment, highEnrichment);
assertEquals(excludedOverride2.priority_score, 0, 'Forces priority score to 0 when lead is a confirmed DUPLICATE');
assertEquals(excludedOverride2.priority, 'EXCLUDED', 'Categorizes DUPLICATE lead as EXCLUDED');

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests} / ${totalTests} PASSED`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY.\n');
} else {
  console.error('SOME UNIT TESTS FAILED.\n');
  process.exit(1);
}
