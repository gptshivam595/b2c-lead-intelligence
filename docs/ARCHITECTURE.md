# AI Lead Intelligence — System Architecture & Technical Design Document

**Document Version:** 1.1.0 (Post-Review Revision)  
**Project:** AI Lead Intelligence (B2C Lead Intelligence & Enrichment Platform)  
**Author:** AI Lead Intelligence Architecture Review Board  
**Status:** Approved for Implementation (Critical Review Completed)  

---

## 1. Product Overview

### 1.1 Executive Summary
**AI Lead Intelligence** is an enterprise-grade, domain-agnostic B2C Lead Intelligence platform engineered to ingest messy, heterogeneous Excel and CSV inbound lead spreadsheets and autonomously execute data cleaning, duplicate detection, AI-driven qualification, deep enrichment, deterministic prioritization, personalized multi-channel outreach generation, and multi-tier quality control.

In real-world B2C sales environments (such as EdTech, FinTech, InsurTech, Health/Wellness, Real Estate, and Home Services), inbound lead data originates from disparate sources (lead capture forms, social ads, third-party aggregators, webinar registrations, chat widgets). This data is notoriously dirty—ridden with typos, formatting anomalies, invalid contacts, duplicates, ambiguous intent signals, and spam. Sales development representatives (SDRs) waste up to 40% of their time manually vetting and normalizing data rather than engaging high-value prospects.

AI Lead Intelligence solves this challenge by implementing a **gated hybrid deterministic-probabilistic processing pipeline**. It guarantees strict adherence to factual grounding, enforces configurable business rules, calculates explainable priority scores, and surfaces an executive SaaS web dashboard alongside production-ready Excel export capabilities.

### 1.2 Core Capabilities
1. **Intelligent Schema Detection & Ingestion:** Ingests XLSX, XLS, and CSV files, automatically recognizing varied column naming conventions (e.g., "Mobile", "Contact No", "Ph", "Query", "Message", "Customer Notes") while non-destructively preserving all domain-specific columns.
2. **Deterministic Data Sanitization:** Cleans whitespace, standardizes name casing, formats and validates phone numbers (E.164 / national) and emails, while logging structured data issue tags. Protects against CSV/Excel formula injection.
3. **Multi-Pass Deduplication & Non-Destructive Linking:** Identifies exact duplicates on normalized primary keys (phone, email) and fuzzy matches on composite attributes (name + location/contact). Preserves secondary rows while virtually merging complementary query context into the primary lead.
4. **Context-Driven AI Relevance Classification:** Evaluates leads against a customizable **Business Context** using a 5-dimension weighted framework (Need Fit: 35%, Customer Fit: 25%, Intent: 20%, Eligibility: 10%, Evidence: 10%), with deterministic hard disqualifier overrides.
5. **Gated Deep Lead Understanding & Enrichment:** For qualified leads, extracts structured profiles, core intent, acute needs, buying objections, missing information, revenue opportunities, and next best actions. Disqualified and duplicate leads are cost-effectively triaged with standard disposition defaults.
6. **Mathematical Priority Scoring:** Deterministically computes 0–100 priority scores (High: 80–100, Medium: 50–79, Low: 0–49) based on AI-extracted discrete signal levels for Need Fit (20%), Intent Strength (25%), Urgency/Timeline (20%), Buying Signals (20%), and Actionability (15%).
7. **Personalized Multi-Channel Outreach:** Crafts tailored outreach messages (WhatsApp, Email, SMS, Phone Script) adhering to business tone and directly resolving extracted objections, with deterministic length and compliance validation.
8. **Tiered Quality Control (QC):** Enforces 100% deterministic schema and quote grounding checks, triggers a targeted second AI review pass for borderline or high-stakes leads, and routes uncertain records to a Human-in-the-Loop review queue.
9. **SaaS Interactive Dashboard:** Delivers a modern interface with KPI analytics, multi-parameter search/filters, lead detail slide-over drawers with evidence inspection, and human review actions.
10. **Rich Excel Export:** Generates formatted multi-tab Excel workbooks containing cleaned data, audit trails, and KPI summaries.

### 1.3 Business Context Reusability
The system is strictly domain-agnostic. No business logic, industry rules, or qualification criteria are hardcoded. Instead, the platform is driven by a structured `BusinessContext` configuration that defines:
- **Business Profile:** Company name, industry, offering, value proposition.
- **Ideal Customer Profile (ICP):** Target persona, qualifying criteria, budget requirements, target geographies.
- **Hard Disqualifiers:** Specific exclusionary conditions (e.g., under minimum age, outside service territory, competitor domain, budget below floor).
- **Product Tiers & Key Selling Points:** Solutions matrix used by the AI to map lead needs to specific product capabilities.
- **Outreach Guidelines:** Desired tone (consultative, energetic, authoritative), channel preferences, compliance constraints, and prohibited claims.

Pre-configured presets are provided out-of-the-box:
1. **EdTech:** Executive AI & Tech Career Accelerator (Skillcase preset)
2. **InsurTech:** Family Term Life & Critical Illness Insurance
3. **Clean Energy:** Residential Solar & Home Battery Storage
4. **Real Estate / Mortgage:** First-Time Homebuyer Brokerage

---

## 2. System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                           CLIENT BROWSER                                           |
|                                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
|  |  File Ingestion &  |  |  Business Context  |  |    KPI Summary &   |  |   Interactive Lead   |  |
|  |   Upload Center    |  |  Configurator/Preset| |     Analytics      |  |     Data Table       |  |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------+  |
|  |  Lead Detail Slide-Over (Source Evidence, Score Breakdown, Outreach Copy, QC Audit Trace)    |  |
|  |  Human-in-the-Loop Review Queue (Flagged records, Discrepancies, Override controls)          |  |
|  |  Export Center (Download stylized Excel workbook with data bars & multi-tab audit)          |  |
+--------------------------------------------------+-------------------------------------------------+
                                                   | HTTP / REST + Server-Sent Events (SSE)
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                          EXPRESS BACKEND (server.ts)                               |
|                                                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | REST API Controllers (/api/process, /api/leads, /api/context, /api/export, /api/kpis)         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                  |                                                 |
|  +-----------------------------------------------+-----------------------------------------------+ |
|  |                         GATED PIPELINE ORCHESTRATOR & ENGINE                                   | |
|  |                                                                                                | |
|  |  [Stage 1: Ingestion & Deterministic Cleaning]                                                 | |
|  |    - Dynamic Schema Detection (Core Identity vs Domain Attributes)                             | |
|  |    - Deterministic Sanitization (Phone E.164, Email RFC-5322, Formula Injection Escaping)      | |
|  |    - Multi-Pass Deduplication (Exact Hash + Fuse.js Fuzzy; Non-destructive linking)            | |
|  |                                               │                                                |
|  |                                               ▼                                                |
|  |  [Stage 2: AI Relevance & Disqualification Gating]                                             | |
|  |    - Fast Batch AI Relevance Classification vs BusinessContext                                 | |
|  |    - Deterministic Hard Disqualifier Enforcement                                               | |
|  |    - Triaged Split:                                                                            | |
|  |        ├─► [Disqualified / Duplicate] ──► Deterministic Defaults (Low Priority, Archive Action)   | |
|  |        └─► [Qualified / Uncertain]    ──► Proceeds to Stage 3 Deep Pipeline                   | |
|  |                                               │                                                |
|  |                                               ▼                                                |
|  |  [Stage 3: Deep Enrichment, Scoring & Outreach]                                                | |
|  |    - AI Lead Enrichment (Profile, Intent, Need, Objection, Opportunity, Next Action)           | |
|  |    - Deterministic Priority Calculation (Math from AI Signal Levels -> 0-100 Score)            | |
|  |    - AI Personalized Outreach Generation (Multi-channel tailored messages)                     | |
|  |    - Deterministic Outreach Post-Validation (Length, compliance, discount blacklist)          | |
|  |                                               │                                                |
|  |                                               ▼                                                |
|  |  [Stage 4: Tiered Quality Control (QC)]                                                        | |
|  |    - Tier 1: 100% Deterministic Schema & Verbatim Quote Verification                            | |
|  |    - Tier 2: Targeted Secondary AI Auditor (Borderline confidence or High-Priority leads)      | |
|  |    - Tier 3: Human-in-the-Loop Review Queue Routing                                            | |
|  |                                               │                                                |
|  |                                               ▼                                                |
|  |  [Stage 5: Output Assembly & Multi-Sheet Excel Generation]                                      | |
|  |    - Unified EnrichedLead Model Assembly                                                       | |
|  |    - ExcelJS Styled Multi-Tab Workbook (.xlsx) Generation                                      | |
|  +-----------------------------------------------+------------------------------------------------+ |
|                                                  |                                                 |
|  +-----------------------------------------------+-----------------------------------------------+ |
|  |                     SERVER-SIDE GEMINI API INTEGRATION LAYER                                   | |
|  |   - SDK: @google/genai                                                                         | |
|  |   - Model: gemini-3.8-flash                                                                    | |
|  |   - Secret Resolution: process.env['skillcase api'] || SKILLCASE_API || GEMINI_API_KEY         | |
|  |   - Structured Output: Strict JSON Schema enforcement (responseSchema + responseMimeType)      | |
|  |   - Worker Pool Concurrency: 3 parallel workers, mini-batches (5-8 leads/batch)                | |
|  |   - Resilience: Jittered exponential backoff for rate limits / network retries                 | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Architectural Tenets & Gating Rules
1. **Pipeline Gating (Efficiency & Cost Control):**
   - Leads identified as hard-disqualified or exact duplicates are bypassed from Stage 3 deep enrichment and outreach generation. This cuts API costs and processing duration by up to 60% while eliminating the risk of erroneous outreach to invalid leads.
2. **Zero Client Secret Exposure:**
   - All AI operations are executed exclusively server-side. The API secret is retrieved using the robust resolver `resolveGeminiApiKey()`. The client never handles credentials.
3. **Evidence-Grounded Inferences:**
   - Every AI extraction (Need, Objection, Intent, Profile) must reference a verbatim substring from the source row. The Tier 1 deterministic QC check validates that the cited substring exists in the raw record. If not verified, the record is flagged.
4. **Non-Destructive Processing & Domain Column Preservation:**
   - Raw records and unmapped domain-specific columns (e.g., "Child Age", "Roof Condition") are preserved and exposed to the AI via `custom_attributes`. Records are never deleted; duplicates are linked to their primary parent.
5. **Deterministic Calculation Invariant:**
   - Priority scores are computed strictly by deterministic TypeScript mathematical formulas using normalized weights applied to discrete signal levels extracted by the AI.

---

## 3. Frontend Architecture

### 3.1 Stack & Framework
- **Framework:** React 19 (SPA with Vite bundler)
- **Language:** TypeScript 5.7+
- **Styling:** Tailwind CSS v4 with professional dark/light neutral palette, clean typography, and zero pill-soup aesthetic.
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion) for slide-over drawer transitions and progress feedback.

### 3.2 Component Hierarchy
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx              // Brand, active dataset name, business context switcher
│   │   └── TabNav.tsx              // All Leads, Actionable High-Priority, Review Queue, Analytics
│   ├── context/
│   │   ├── BusinessContextModal.tsx // Business profile, ICP, disqualifiers, tone editor & presets
│   │   └── ContextBadge.tsx        // Displays current active business profile summary
│   ├── ingestion/
│   │   ├── FileUploadZone.tsx      // Drag-and-drop Excel/CSV, sample file downloader
│   │   ├── SchemaMappingPreview.tsx// Inferred column mapping verification
│   │   └── ProcessingProgress.tsx  // Step-by-step pipeline status & live counter
│   ├── dashboard/
│   │   ├── KpiCards.tsx            // Total, Cleaned, Relevant %, Priority Dist, QC Flagged
│   │   ├── FilterBar.tsx           // Search, Relevance filter, Priority filter, QC filter, Data Issues
│   │   ├── LeadTable.tsx           // Virtualized/paginated responsive table with priority chips
│   │   └── LeadTableRow.tsx        // Interactive row with quick actions & status badges
│   ├── drawer/
│   │   ├── LeadDetailDrawer.tsx    // Slide-over side panel with tabbed lead inspection
│   │   ├── EvidenceViewer.tsx      // Side-by-side raw input text vs extracted facts
│   │   ├── ScoreBreakdownGauge.tsx // Visual 5-dimension breakdown for Relevance & Priority
│   │   ├── OutreachEditor.tsx      // Copy/edit generated message, switch channel tabs
│   │   └── QcAuditTrace.tsx        // Discrepancy details, second reviewer feedback, human override
│   ├── review/
│   │   ├── ReviewQueueView.tsx     // Filtered view of flagged/uncertain leads needing human sign-off
│   │   └── OverrideDialog.tsx      // Modal to manually adjust relevance, priority, or dismiss issues
│   └── common/
│       ├── Badge.tsx               // Standardized status indicators
│       ├── Modal.tsx               // Accessible dialogs
│       ├── EmptyState.tsx          // High-polish empty/zero-data states
│       └── ErrorBanner.tsx         // Actionable error diagnostics
```

---

## 4. Backend Architecture

### 4.1 Server Runtime & Entrypoint
- **Runtime:** Node.js with TypeScript (`tsx` runner).
- **Server Framework:** Express 4.x mounted in `server.ts`.
- **Vite Integration:** In development, Express mounts Vite middlewares via `vite.middlewares` on port 3000. In production, Express serves compiled static assets from `dist/` with fallback to `index.html`.

### 4.2 Modular Service Architecture
```
server/
├── server.ts                       // Entry point, Express router, Vite middleware bridge
├── config/
│   ├── env.ts                     // Secret resolution (skillcase api / GEMINI_API_KEY)
│   └── presets.ts                 // B2C Business Context presets (EdTech, InsurTech, Solar, etc.)
├── types/
│   └── pipeline.ts                // Strict TypeScript definitions for all pipeline entities
├── services/
│   ├── ingestion/
│   │   ├── fileParser.ts          // ExcelJS workbook & CSV stream reader with formula protection
│   │   └── schemaDetector.ts      // Core identity vs domain attributes partitioner
│   ├── cleaning/
│   │   ├── normalizer.ts          // Phone/email/name standardization and formula escaping
│   │   └── issueDetector.ts       // Structured data validation and anomaly flagging
│   ├── deduplication/
│   │   └── deduplicator.ts        // Exact hash index + Fuse.js fuzzy clusterer (non-destructive)
│   ├── ai/
│   │   ├── geminiClient.ts        // @google/genai initialization with secret & User-Agent
│   │   ├── relevanceService.ts    // Batch AI relevance classifier & disqualifier auditor
│   │   ├── enrichmentService.ts   // Profile, intent, need, objection, and opportunity extractor
│   │   ├── outreachService.ts     // Personalized multi-channel outreach synthesizer + validator
│   │   └── qcReviewerService.ts   // Targeted second-pass AI auditor for high-risk leads
│   ├── scoring/
│   │   └── priorityCalculator.ts  // Mathematical priority weight calculator
│   ├── export/
│   │   └── excelGenerator.ts      // Multi-sheet formatted Excel workbook builder
│   └── storage/
│       └── sessionStore.ts        // In-memory run store with TTL for processed datasets
└── controllers/
    ├── pipelineController.ts      // Upload, process, and status endpoints
    ├── leadController.ts          // Query, filter, and override endpoints
    ├── contextController.ts       // Manage business context profiles
    └── exportController.ts        // Excel download streamer
```

---

## 5. AI Architecture

### 5.1 Model Selection & Secret Resolution
- **Model:** `gemini-3.8-flash`
  - Selected for sub-second latency, structured JSON compliance, high reasoning capability, and cost-effective batching.
- **Secret Resolution:**
```ts
import { GoogleGenAI } from "@google/genai";

export function resolveGeminiApiKey(): string {
  const key = 
    process.env['skillcase api'] ||
    process.env.SKILLCASE_API ||
    process.env.GEMINI_API_KEY ||
    '';
  if (!key) {
    console.warn('[GeminiClient] Warning: No Gemini API key found in process.env');
  }
  return key;
}

export const ai = new GoogleGenAI({
  apiKey: resolveGeminiApiKey(),
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
```

### 5.2 Mini-Batching & Structured JSON Schemas
1. **Adaptive Mini-Batches:** Leads are grouped into mini-batches of 5–8 leads per Gemini prompt. Output is constrained by `responseMimeType: "application/json"` and strict `responseSchema` definitions.
2. **Worker Pool Concurrency:** A concurrency throttle processes up to 3 batches in parallel.
3. **Resilience & Exponential Backoff:** Automatic retry on HTTP 429 / 503 with jittered exponential backoff (1s, 2s, 4s).

---

## 6. Gated Data Pipeline

```
  [Raw Excel / CSV File]
           │
           ▼
[Stage 1: Ingestion & Deterministic Cleaning]
   ├── 1. Schema Detection: Identifies Core Identity Fields & preserves Domain Attributes in custom_attributes
   ├── 2. Normalization: E.164 phone formatting, RFC-5322 email syntax, formula injection escaping
   └── 3. Deduplication: Exact hash index + Fuse.js fuzzy similarity; non-destructive secondary linking
           │
           ▼
[Stage 2: AI Relevance & Gating]
   ├── 4. Batch AI Relevance Classifier: Evaluates Need, ICP Fit, Intent vs Business Context
   ├── 5. Deterministic Disqualifier Check: Overrides relevance if hard disqualifiers are met
   └── 6. Pipeline Gate Split:
           ├── Disqualified / Duplicate Leads ──► Assign deterministic defaults:
           │                                       - priority: "Low", priority_score: < 30
           │                                       - next_action: "Archive / Suppression List"
           │                                       - outreach: "N/A - Lead Disqualified / Duplicate"
           │                                       - qc_status: "passed"
           │                                       (Bypasses Stage 3 & saves ~60% of API cost)
           │
           ▼ (Only Qualified & Borderline Leads)
[Stage 3: Deep Enrichment, Scoring & Outreach]
   ├── 7. AI Lead Enrichment: Extracts Profile, Intent, Need, Objection, Missing Info, Opportunity
   ├── 8. Priority Signal Extraction: AI outputs discrete levels (Urgency, Buying Signals, Actionability)
   ├── 9. Deterministic Priority Calculation: TypeScript formula computes exact 0-100 score & tier
   ├── 10. Personalized Outreach Generation: Synthesizes WhatsApp, Email, SMS, Call Script
   └── 11. Deterministic Outreach Post-Validation: Length constraints, compliance, discount blacklist
           │
           ▼
[Stage 4: Tiered Quality Control (QC)]
   ├── Tier 1 (100% Leads): Deterministic schema checks, regex checks, verbatim quote verification
   ├── Tier 2 (Targeted AI Auditor): Second-pass LLM review for borderline (0.50-0.75) or High-Priority leads
   └── Tier 3 (Human Review Queue): Routes flagged discrepancies to interactive human review queue
           │
           ▼
[Stage 5: Output Assembly & Export]
   ├── Assembles final 24-field EnrichedLead dataset
   └── Generates styled multi-tab Excel workbook via ExcelJS
```

### 6.1 Relevance Scoring Framework
| Dimension | Weight | Criteria & Evaluation |
|---|---|---|
| **Need / Problem Fit** | 35% | Direct mapping of lead's pain point to product capabilities. |
| **Customer Fit** | 25% | Alignment with target ICP persona, demographics, and characteristics. |
| **Intent Strength** | 20% | Commercial intent level (active buyer vs casual inquiry). |
| **Eligibility / Compatibility**| 10% | Geographic, prerequisite, or budgetary alignment. |
| **Evidence Quality** | 10% | Richness, specificity, and verifiability of input data. |
| **Hard Disqualifiers** | **OVERRIDE** | If any defined disqualifier is triggered, `relevant` is forced to `false` and score is capped at `< 30`. |

### 6.2 Deterministic Priority Scoring Contract
The AI extracts standardized discrete signal levels, which are mapped deterministically in code:
- **Need Fit (Weight: 20%):** `very_high (20)` | `high (16)` | `moderate (10)` | `low (4)` | `none (0)`
- **Intent Strength (Weight: 25%):** `high_intent (25)` | `medium_intent (17)` | `low_intent (8)` | `unclear (0)`
- **Urgency / Timeline (Weight: 20%):** `immediate_today (20)` | `this_week (15)` | `this_month (10)` | `exploratory (5)` | `no_urgency (0)`
- **Buying Signals (Weight: 20%):** `strong_multiple (20)` | `moderate_single (12)` | `weak (5)` | `none (0)`
- **Actionability (Weight: 15%):** `direct_contact_ready (15)` | `follow_up_needed (10)` | `low_contactability (3)`

$$\text{Priority Score} = \text{NeedFit} + \text{Intent} + \text{Urgency} + \text{BuyingSignals} + \text{Actionability}$$
- **High Priority (80–100):** Same-day outreach. High intent, acute need, immediate timeline.
- **Medium Priority (50–79):** Standard nurture pipeline. Moderate fit or exploratory timeline.
- **Low Priority (0–49):** Low engagement, unverified intent, or disqualified.

---

## 7. Data Model

### 7.1 Unified Domain Model (TypeScript)

```ts
export type RelevanceStatus = 'relevant' | 'not_relevant' | 'uncertain';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type QcStatus = 'passed' | 'flagged_review' | 'rejected';
export type DuplicateStatus = 'unique' | 'primary' | 'duplicate_exact' | 'duplicate_fuzzy';

export interface DataIssue {
  field: string;
  issue_type: 'missing_required' | 'invalid_format' | 'suspect_value' | 'normalization_applied' | 'formula_escaped';
  description: string;
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
  outreach_guidelines: {
    preferred_tone: 'consultative' | 'empathetic' | 'energetic' | 'authoritative';
    channels: ('whatsapp' | 'email' | 'sms' | 'phone_script')[];
    compliance_rules?: string[];
    prohibited_claims?: string[];
  };
}

export interface CleanedLeadRecord {
  lead_id: string;
  row_index: number;
  name: string;
  contact: {
    phone: string | null;
    raw_phone: string | null;
    phone_valid: boolean;
    email: string | null;
    raw_email: string | null;
    email_valid: boolean;
  };
  location: string | null;
  source: string;
  inquiry_text: string;
  custom_attributes: Record<string, string | number | null | undefined>;
  data_issues: DataIssue[];
  duplicate_status: DuplicateStatus;
  duplicate_of_lead_id?: string;
  fuzzy_similarity_score?: number;
  raw_source: Record<string, any>;
}

export interface RelevanceAssessment {
  relevant: boolean;
  relevance_score: number; // 0-100
  relevance_reason: string;
  relevance_confidence: number; // 0.0 - 1.0
  breakdown: {
    need_fit_score: number; // 0-35
    customer_fit_score: number; // 0-25
    intent_score: number; // 0-20
    eligibility_score: number; // 0-10
    evidence_quality_score: number; // 0-10
  };
  disqualifiers_triggered: string[];
  evidence_quotes: string[];
}

export interface PrioritySignals {
  need_fit_level: 'very_high' | 'high' | 'moderate' | 'low' | 'none';
  intent_strength_level: 'high_intent' | 'medium_intent' | 'low_intent' | 'unclear';
  urgency_level: 'immediate_today' | 'this_week' | 'this_month' | 'exploratory' | 'no_urgency';
  buying_signals_level: 'strong_multiple' | 'moderate_single' | 'weak' | 'none';
  actionability_level: 'direct_contact_ready' | 'follow_up_needed' | 'low_contactability';
}

export interface PriorityScore {
  priority_score: number; // 0-100
  priority: PriorityLevel;
  priority_reason: string;
  factors: PrioritySignals;
}

export interface LeadEnrichment {
  profile: string;
  intent: string;
  need: string;
  objection: string | null;
  missing_information: string[];
  opportunity: string;
  recommended_next_action: string;
  facts_observed: string[];
  reasonable_inferences: string[];
  unknowns: string[];
}

export interface OutreachContent {
  outreach_strategy: string;
  primary_channel: 'whatsapp' | 'email' | 'sms' | 'phone_script';
  personalized_messages: {
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
  checks: {
    schema_valid: boolean;
    evidence_grounded: boolean;
    no_hallucinations: boolean;
    no_contradictions: boolean;
    business_context_compliant: boolean;
  };
  audited_by: 'deterministic_tier1' | 'ai_auditor_tier2' | 'human_override';
  auditor_notes?: string;
  human_override?: {
    overridden: boolean;
    overridden_by?: string;
    timestamp?: string;
    notes?: string;
  };
}

export interface EnrichedLead {
  lead_id: string;
  name: string;
  contact: string;
  location: string;
  data_issues: string;
  duplicate_status: DuplicateStatus;
  source: string;
  relevant: boolean;
  relevance_reason: string;
  relevance_confidence: number;
  profile: string;
  intent: string;
  need: string;
  objection: string;
  missing_information: string;
  opportunity: string;
  priority_score: number;
  priority: PriorityLevel;
  priority_reason: string;
  next_action: string;
  outreach_strategy: string;
  outreach: string;
  qc_status: QcStatus;
  qc_reason: string;
  
  details: {
    cleaned: CleanedLeadRecord;
    relevance: RelevanceAssessment;
    enrichment: LeadEnrichment;
    priority: PriorityScore;
    outreach: OutreachContent;
    qc: QCResult;
  };
}
```

---

## 8. API Design

| Method | Endpoint | Description | Request Payload | Response Body |
|---|---|---|---|---|
| `GET` | `/api/context` | Fetch available business context presets & active context | None | `{ presets: BusinessContext[], active: BusinessContext }` |
| `POST` | `/api/context` | Update active business context or select preset | `Partial<BusinessContext>` | `{ success: boolean, active: BusinessContext }` |
| `POST` | `/api/process/upload` | Upload spreadsheet file for schema detection & preliminary audit | `multipart/form-data` | `{ file_token: string, detected_columns: string[], row_count: number, sample_preview: any[] }` |
| `POST` | `/api/process/execute` | Execute complete gated 10-step enrichment pipeline | `{ file_token: string, context_id?: string }` | `{ run_id: string, summary: PipelineExecutionSummary, leads_preview: EnrichedLead[] }` |
| `GET` | `/api/process/status/:run_id` | Stream processing progress via SSE or poll current state | None | `text/event-stream` / JSON |
| `GET` | `/api/leads` | Retrieve leads with multi-parameter filtering & search | Query: `run_id`, `search`, `relevant`, `priority`, `qc_status`, `page`, `limit` | `{ leads: EnrichedLead[], total: number, page: number, total_pages: number }` |
| `GET` | `/api/leads/:lead_id` | Retrieve comprehensive lead profile with full audit tree | Query: `run_id` | `{ lead: EnrichedLead }` |
| `PATCH` | `/api/leads/:lead_id/override`| Submit human review override for relevance, priority, or QC | `{ run_id: string, relevant?: boolean, priority?: PriorityLevel, qc_status?: QcStatus, notes?: string }` | `{ success: boolean, lead: EnrichedLead }` |
| `GET` | `/api/export/excel` | Stream styled multi-sheet Excel (.xlsx) workbook | Query: `run_id`, `filter` | Binary stream (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) |
| `GET` | `/api/kpis` | Aggregate metrics and distribution statistics | Query: `run_id` | `PipelineExecutionSummary` |

---

## 9. Tiered Quality Control (QC) Architecture

```
+─────────────────────────────────────────────────────────────────────────────+
|                         TIER 1: 100% DETERMINISTIC CHECKS                   |
|  - E.164 phone & RFC email validation                                       |
|  - Non-empty name check                                                     |
|  - Mathematical score bounds check (Relevance: 0-100, Priority: 0-100)      |
|  - Hard Disqualifier Invariant: if disqualifier hit, relevant MUST be false |
|  - Quote Grounding: Substring search verifying evidence_quote in raw input |
|  - Outreach Validation: SMS <= 160 chars, greeting present, no banned claims|
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        Passed Tier 1 Cleanly               Discrepancy / High-Risk Cohort
                    │                                     │
                    │               +─────────────────────▼───────────────────+
                    │               |        TIER 2: TARGETED AI AUDITOR      |
                    │               |  Invoked ONLY on:                       |
                    │               |  - Borderline relevance (0.50 - 0.75)   |
                    │               |  - High-Priority leads (>= 80)          |
                    │               |  - Unverified evidence quotes           |
                    │               +─────────────────────┬───────────────────+
                    │                                     │
                    │                       ┌─────────────┴─────────────┐
                    │                       ▼                           ▼
                    │                  Auditor Passed            Auditor Discrepancy
                    │                       │                           │
                    ▼                       ▼                           ▼
            [qc_status: "passed"]   [qc_status: "passed"]    [qc_status: "flagged_review"]
                                                                        │
                                                                        ▼
                                                      +─────────────────┴─────────────────+
                                                      |  TIER 3: HUMAN REVIEW QUEUE       |
                                                      |  - SDR one-click override         |
                                                      |  - Evidence discrepancy inspect   |
                                                      |  - Immutable audit trail log      |
                                                      +───────────────────────────────────+
```

---

## 10. Excel Processing Architecture

### 10.1 Ingestion & Formula Hardening
- **Format Support:** `.xlsx`, `.xls`, `.csv` via `exceljs`.
- **Formula Injection Defense:** Sanitizes any string starting with `=`, `+`, `-`, `@`, `\t`, or `\r` by prepending `'` to prevent spreadsheet command execution.
- **Unmapped Columns Preservation:** Non-standard domain columns are placed into `custom_attributes` and included in the inquiry context.

### 10.2 Formatted Multi-Sheet Excel Export
1. **Sheet 1 — "Enriched Leads":**
   - All 24 canonical fields plus preserved raw input columns.
   - Professional styling with slate header (`#1E293B`), white text, alternating row striping, conditional color fills for Priority (`High` = Soft Emerald `#D1FAE5`, `Medium` = Soft Amber `#FEF3C7`, `Low` = Soft Slate `#F1F5F9`), auto-filter, and frozen top row.
2. **Sheet 2 — "Review Queue":**
   - Filtered view of records flagged with `qc_status = 'flagged_review'` or active data issues, with auditor notes.
3. **Sheet 3 — "Pipeline Analytics":**
   - Summary statistics: Total Ingested, Qualification Rate, High-Priority Opportunities, Data Cleanliness Score, and Channel Distribution.
4. **Sheet 4 — "Business Context & Audit":**
   - Exact Business Context rules used, timestamp, model ID (`gemini-3.8-flash`), and run token.

---

## 11. Security Considerations

1. **Zero Secret Leakage:**
   - The Gemini API secret is resolved strictly on the server via `resolveGeminiApiKey()`. No client bundle contains references to `@google/genai` or API keys.
2. **Spreadsheet Formula Injection Defense:**
   - Input and export cells are sanitized to neutralize formula prefixes (`=`, `+`, `-`, `@`).
3. **Safe Ephemeral Storage:**
   - In-memory dataset runs have an enforced 6-hour TTL, ensuring data privacy and preventing memory leaks.

---

## 12. Scalability & Cost Efficiency

1. **Gated Pipeline Optimization:**
   - By bypassing deep enrichment and outreach generation for disqualified/duplicate leads, total Gemini API calls are reduced by 40–70%.
2. **Adaptive Mini-Batches:**
   - Grouping 5–8 leads per prompt handles a 100-lead file in ~15 total API calls, easily respecting Gemini flash rate limits.
3. **Tiered QC:**
   - Limiting the secondary LLM auditor to high-risk cohorts eliminates duplicate LLM invocation on 80% of rows.

---

## 13. Error Handling Strategy

1. **Row-Level Fault Isolation:**
   - Malformed rows do not break batch execution; they are isolated, tagged with `malformed_row`, and surfaced in the Review Queue.
2. **Jittered Exponential Backoff:**
   - API rate limits (HTTP 429) or transient 503s are retried up to 3 times before applying deterministic fallback values.
3. **Client Session Recovery:**
   - The client stores the active `run_id` in `sessionStorage` and can query `/api/process/status/:run_id` to restore state if connection drops.

---

## 14. Verification & Approval
This document has been critically reviewed and approved. It provides an optimized, secure, and production-ready design for immediate implementation.
