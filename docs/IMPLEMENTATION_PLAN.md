# AI Lead Intelligence — Phased Implementation Plan

**Version:** 1.0.0  
**Status:** Approved for Implementation Roadmap  
**Target:** AI Lead Intelligence Platform  

---

## Overview & Guiding Constraints
This plan governs the step-by-step implementation of the AI Lead Intelligence platform. Every phase is strictly isolated, bounded by automated verification, and guarantees:
1. **Zero Data Loss:** Raw data is preserved in full; non-destructive duplicate linking.
2. **Deterministic Boundaries:** Math, phone/email regex, formula escaping, and scoring are deterministic code.
3. **Server-Side Secret Isolation:** Gemini API key accessed only on server via `process.env['skillcase api']` or `SKILLCASE_API` / `GEMINI_API_KEY`.
4. **Targeted AI Inferences:** Grounded in verbatim quotes; structured JSON schemas; dual-pass verification.
5. **Generic Reusability:** Driven by configurable `BusinessContext`.

---

## Phased Implementation Roadmap

### Phase 1: Core Foundation, Domain Types & Secret Configuration
- **Objective:** Establish the full-stack server setup, runtime configuration, and domain type system.
- **Tasks:**
  - Create `server/types/pipeline.ts` with complete TypeScript interfaces (`BusinessContext`, `CleanedLeadRecord`, `RelevanceAssessment`, `PriorityScore`, `EnrichedLead`, `QCResult`, etc.).
  - Implement `server/config/env.ts` with `resolveGeminiApiKey()` checking `process.env['skillcase api']`, `process.env.SKILLCASE_API`, and `process.env.GEMINI_API_KEY`.
  - Implement `server/config/presets.ts` with 4 complete B2C business context profiles (EdTech, InsurTech, Clean Energy, Real Estate).
  - Configure `server/server.ts` Express entrypoint with Vite middleware integration on port 3000.
- **Acceptance Criteria:** Server starts on port 3000, environment secrets resolve cleanly without logging sensitive values, types compile with zero warnings.
- **Test Cases:** Valid/missing key handling, preset retrieval via `/api/context`.

### Phase 2: Ingestion & Dynamic Schema Detection Engine
- **Objective:** Ingest XLSX, XLS, and CSV files, dynamically mapping headers to Core Identity Fields while preserving Domain Attributes.
- **Tasks:**
  - Implement `server/services/ingestion/fileParser.ts` using `exceljs` and streaming CSV reader.
  - Implement `server/services/ingestion/schemaDetector.ts` mapping varied header aliases ("Mobile", "Contact No", "Ph", "Query", "Remarks") to canonical fields.
  - Extract all unmapped domain-specific columns into `custom_attributes` dictionary to prevent data loss.
  - Implement formula injection sanitization (escaping leading `=`, `+`, `-`, `@`, `\t`, `\r`).
- **Acceptance Criteria:** Successfully parses Excel/CSV with messy, heterogeneous headers without losing any custom columns or crashing on malformed rows.
- **Test Cases:** Clean XLSX, messy CSV with missing headers, file with 50+ diverse columns, file containing formula injection strings.

### Phase 3: Deterministic Sanitization & Multi-Pass Deduplication Engine
- **Objective:** Clean contact information, validate phone/email, and identify exact & fuzzy duplicate clusters.
- **Tasks:**
  - Implement `server/services/cleaning/normalizer.ts` (whitespace trimming, title-casing names, E.164 phone formatting, RFC-5322 email syntax validation).
  - Implement `server/services/cleaning/issueDetector.ts` (structured `DataIssue` logging: `missing_required`, `invalid_format`, `formula_escaped`).
  - Implement `server/services/deduplication/deduplicator.ts` using exact hash index on normalized email/phone and `fuse.js` fuzzy matching on composite Name + Location.
  - Implement non-destructive duplicate linking: secondary rows point to primary lead via `duplicate_of_lead_id` and merge complementary notes into primary lead context.
- **Acceptance Criteria:** Phone/email normalized accurately; duplicates identified without deleting secondary rows; data issues structured and tagged.
- **Test Cases:** Invalid phone numbers, misspelled email domains, exact duplicate rows, typo-laden duplicate names with matching phone numbers.

### Phase 4: Gemini Client & Gated AI Relevance Classification
- **Objective:** Initialize `@google/genai` securely and evaluate lead relevance against active `BusinessContext`.
- **Tasks:**
  - Implement `server/services/ai/geminiClient.ts` with `User-Agent: 'aistudio-build'` and rate-limiting wrapper.
  - Implement `server/services/ai/relevanceService.ts` using mini-batches (5–8 leads/batch) with strict `responseSchema`.
  - Enforce 5-dimension weighting: Need Fit (35%), Customer Fit (25%), Intent (20%), Eligibility (10%), Evidence Quality (10%).
  - Implement deterministic hard disqualifier override (if disqualifier met, force `relevant = false`, cap score at $< 30$).
  - Implement **Pipeline Gating**: Disqualified and duplicate leads receive immediate standard triage defaults and bypass downstream generation.
- **Acceptance Criteria:** Qualified vs disqualified leads segregated accurately; hard disqualifiers strictly enforced; token efficiency maximized.
- **Test Cases:** Lead with explicit disqualifier, lead with high need fit, lead with ambiguous intent, rate-limit 429 backoff retry.

### Phase 5: Deep Lead Enrichment & Deterministic Priority Engine
- **Objective:** Extract granular intelligence signals for qualified leads and compute mathematical priority scores.
- **Tasks:**
  - Implement `server/services/ai/enrichmentService.ts`: Extract Profile, Intent, Need, Objection, Missing Info, Opportunity, and Next Best Action with verbatim `evidence_quote`.
  - Instruct model to output discrete priority levels: `need_fit_level`, `intent_strength_level`, `urgency_level`, `buying_signals_level`, `actionability_level`.
  - Implement `server/services/scoring/priorityCalculator.ts`: Deterministic TypeScript math applying weights ($20\% + 25\% + 20\% + 20\% + 15\%$) to produce 0–100 score and High ($80–100$), Medium ($50–79$), Low ($0–49$) tiers.
- **Acceptance Criteria:** Inferences grounded in source quotes; priority scores calculated deterministically in code; clear distinction between stated facts vs unknowns.
- **Test Cases:** Lead with immediate timeline (High), exploratory lead with objections (Medium), lead with passive inquiry (Low).

### Phase 6: Multi-Channel Personalized Outreach Synthesizer & Guardrails
- **Objective:** Generate bespoke, objection-resolving outreach across WhatsApp, Email, SMS, and Call Scripts with post-validation.
- **Tasks:**
  - Implement `server/services/ai/outreachService.ts`: Tailor messages to lead's specific need and objection, matching the tone in `BusinessContext`.
  - Implement deterministic post-validator: Enforce length constraints (SMS $\le 160$ chars), verify lead name greeting, and check blacklist for prohibited discount/pricing claims.
- **Acceptance Criteria:** Outreach is contextual, empathetic, objection-resolving, and strictly within character and compliance boundaries.
- **Test Cases:** SMS length truncation, WhatsApp multi-paragraph formatting, email subject/body structure, phone script with objection rebuttal.

### Phase 7: Tiered Quality Control & Human-in-the-Loop Review Queue
- **Objective:** Eliminate hallucinations and route uncertain cases to an interactive SDR review queue.
- **Tasks:**
  - Implement Tier 1 Deterministic QC: Verify schema validity, score boundaries, disqualifier invariants, and substring presence of `evidence_quote` in raw input.
  - Implement Tier 2 Targeted AI Auditor (`server/services/ai/qcReviewerService.ts`): Invoked only on borderline confidence ($0.50–0.75$) or High-Priority leads ($\ge 80$).
  - Implement Tier 3 Human Review Queue triage: Leads with active issues or QC flags routed to `qc_status: 'flagged_review'` with explicit `qc_reason`.
  - Implement `/api/leads/:id/override` API allowing SDRs to manually adjust relevance, priority, or dismiss issues with an immutable audit log.
- **Acceptance Criteria:** Hallucinated quotes flagged; high-stakes leads audited; human overrides recorded with timestamp and reason.
- **Test Cases:** Lead with fabricated quote (flagged), borderline lead verified by Tier 2, human override submission and persistence.

### Phase 8: Formatted Multi-Sheet Excel Workbook Generator
- **Objective:** Export the full processed dataset into a professional, multi-tab Excel file via `exceljs`.
- **Tasks:**
  - Implement `server/services/export/excelGenerator.ts`:
    - **Sheet 1 (Enriched Leads):** All 24 canonical fields + original raw columns. Dark slate header, auto-filter, frozen top row, soft pastel conditional formatting for Priority (Emerald/Amber/Slate).
    - **Sheet 2 (Review Queue):** Filtered view of flagged/uncertain leads with diagnostic notes.
    - **Sheet 3 (Pipeline Analytics):** Summary KPI metrics, qualification rates, and priority distribution.
    - **Sheet 4 (Business Context & Audit):** Metadata, timestamp, business context name, model ID.
  - Implement formula injection sanitization on all export cells.
- **Acceptance Criteria:** Excel file opens cleanly in Microsoft Excel/Google Sheets with pristine formatting, working filters, and zero formula execution risks.
- **Test Cases:** Export 100+ leads, verify conditional formatting rules, verify formula-escaped cells, verify multi-sheet structure.

### Phase 9: Frontend SaaS Dashboard & Interactive Views
- **Objective:** Deliver a responsive, executive-grade React 19 SaaS dashboard.
- **Tasks:**
  - Build `FileUploadZone` with drag-and-drop support, sample dataset selector, and format validation.
  - Build `BusinessContextModal` to inspect, switch, or customize business rules and ICP parameters.
  - Build `ProcessingProgress` with live animated pipeline stage tracker (Stages 1–10).
  - Build `KpiCards` showing Total Leads, Qualification Rate, High Priority count, Data Issues count, and Actionable Today.
  - Build `LeadTable` with search, multi-select filters (Relevance, Priority, QC Status, Data Issues), sorting, and priority chips.
  - Build `LeadDetailDrawer` slide-over panel:
    - Side-by-side Raw vs Cleaned view.
    - Grounded Evidence quote inspector.
    - 5-factor Relevance & Priority visual gauge breakdown.
    - Multi-channel Outreach copy editor with one-click copy.
    - QC Audit trace with SDR Override dialog.
  - Build `ReviewQueueView` dedicated tab for rapid human triage.
- **Acceptance Criteria:** Fluid responsive UI, sub-second search/filtering, zero layout flicker, polished dark/light neutral SaaS aesthetic.
- **Test Cases:** Filtering by multiple facets, searching by phone/name/notes, opening drawer, editing outreach, submitting human override.

### Phase 10: End-to-End Testing, Resilience, and Edge Case Polish
- **Objective:** Validate end-to-end reliability across edge cases and heterogeneous datasets.
- **Tasks:**
  - Test diverse B2C datasets (EdTech, InsurTech, Solar, Real Estate) without changing code.
  - Test edge cases: 100% invalid file, empty rows, 500 leads file, duplicate storm, offline network retry.
  - Verify complete elimination of client-side secret leakage.
- **Acceptance Criteria:** Flawless execution across all 4 sample verticals; 100% build and lint pass; zero crashes on corrupted rows.
