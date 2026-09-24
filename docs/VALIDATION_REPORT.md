# End-to-End Validation & Quality Audit Report
**Dataset:** Skillcase 30 Messy B2C Inbound Inquiries (`skillcase_b2c_inbound_leads_30.xlsx`)  
**Audit Date:** September 2026  
**Auditor Engine:** Multi-Layer Quality Control System (Phases 1–9)  
**Execution Environment:** Node.js + Express + Google GenAI SDK (`gemini-2.5-flash`)

---

## 1. Executive Summary & Processing Results

The complete pipeline was executed across the 30 heterogeneous, un-sanitized B2C lead records. The dataset specifically included intentional dirty data edge cases: unformatted phone numbers, typo email domains, missing fields, formula injection attempts, hard disqualifiers (vendors, medical residents, DNC), cross-field contradictions, and duplicate submissions.

### Final Pipeline Metrics

| Metric | Measured Value | Architectural Invariant Enforced |
| :--- | :--- | :--- |
| **Total Ingested Leads** | 30 | 100% record retention (Zero data loss) |
| **Pristine Records** | 12 (40%) | Identified without modification |
| **Records with Data Issues** | 18 (60%) | Deterministic normalizations applied & logged |
| **Exact Duplicates** | 2 | Excluded from commercial dispatch; context merged |
| **Possible Fuzzy Duplicates** | 1 | Flagged with similarity score for SDR review |
| **Qualified Relevant Leads** | 19 (63.3%) | Met ICP criteria (score ≥ 50, no disqualifiers) |
| **Not Relevant / Disqualified** | 11 (36.7%) | Vendors, spam, clinical medicine, DNC suppressed |
| **High Priority Leads (80–100)** | 7 (23.3%) | Immediate phone/WhatsApp outreach generated |
| **Medium Priority Leads (50–79)** | 12 (40.0%) | Targeted consultative discovery queue |
| **Low / Excluded Leads (0–49)** | 11 (36.7%) | Automated outreach suppressed |
| **SDR Human Review Queue** | 6 (20.0%) | Routed to human queue for discrepancy resolution |
| **Formula Injections Defused** | 1 | Neutralized leading `=cmd|` without data corruption |
| **Average Data Quality Score** | 86.3 / 100 | Kept strictly independent from commercial value |
| **Average AI Confidence** | 89.2% | Transparent confidence metrics on all decisions |

---

## 2. In-Depth Case Studies: Three Problematic/Uncertain Examples

### Example 1: Cross-Field Contradiction (Data Integrity vs. Intent)
* **Lead ID:** `LEAD-010` (Karthik Iyer)
* **Problem:** Cross-Field Contradiction between structured form field and conversational text.
  * Form Field `Experience`: `"Fresher"`
  * Verbatim Inquiry: `"I have 5 years of solid Java and Spring Boot experience at Infosys. Looking to switch to AI engineering to increase my CTC."`
* **Why it is a problem:** If an automated system naively reads the form field, it routes him to a beginner curriculum track and underrates his commercial priority. If an LLM hallucinated a resolution without alerting sales, admissions would pitch him a student discount rather than an experienced engineering upskilling cohort.
* **How the system handled it:**
  1. Deterministic Layer 4 Contradiction Detector flagged the discrepancy between the `Experience` attribute (`"Fresher"`) and the query tokens (`"5 years experience at Infosys"`).
  2. Prioritization Engine rated his intent and buying signals high based on his verified tech background (Priority Score: 87/100, High Tier).
  3. Quality Control Layer 4 marked the lead with status `flagged_review` and explanation: *"Data Contradiction: Form attribute lists Experience as 'Fresher', but inquiry text states 'I have 5 years solid Java experience at Infosys'."*
* **Human Review Required?** **YES.** Routed to the Human Review Queue so the SDR can confirm his 5-year tenure on LinkedIn before dispatching the message.

---

### Example 2: Hard Disqualifier with Surface Keyword Overlap (Vendor Inbound)
* **Lead ID:** `LEAD-006` (Rajesh Verma)
* **Problem:** B2B Vendor selling software submitted through an inbound student inquiry form.
  * Verbatim Inquiry: `"We provide bulk hiring recruitment software and want to sell our SaaS portal to Skillcase HR management team. Please connect with your procurement head."`
* **Why it is a problem:** Naive keyword-based CRM routing matches keywords like `"recruitment"`, `"hiring"`, and `"Skillcase"`, falsely classifying the inquiry as a high-intent enterprise lead or prospective student asking about hiring partners.
* **How the system handled it:**
  1. AI Relevance classifier recognized the semantic pattern as an external vendor solicitation.
  2. The model triggered the structured field `hard_disqualifier: "B2B Vendor / Non-Customer Solicitation"`.
  3. **Application code invariant enforced:** When a hard disqualifier string is present, application logic forces `relevant = false`, sets priority score to `0`, and suppresses automated outreach.
* **Human Review Required?** **NO.** Disqualified automatically with zero token waste on subsequent stages.

---

### Example 3: Non-Capability Guardrail & False Promise Prevention
* **Lead ID:** `LEAD-021` (Shweta Agarwal)
* **Problem:** Prospect demanding an explicit non-capability (100% unconditional job guarantee).
  * Verbatim Inquiry: `"Will you give me an unconditional written 100% money-back job guarantee of at least 15 LPA salary even if I fail the mock interviews?"`
* **Why it is a problem:** AI models often over-promise or act overly agreeable in consultative sales prompts, which exposes the company to regulatory and legal liability if the outreach confirms a 100% job guarantee.
* **How the system handled it:**
  1. Ingestion of Business Context explicitly injected `explicit_non_capabilities: ["100% unconditional job guarantees without completing capstone assignments"]`.
  2. AI Enrichment categorized her objection as `CONFIDENCE` / `CAREER_OUTCOME`.
  3. Outreach Generator selected strategy `ADDRESS_OBJECTION`, firmly clarifying that Skillcase provides dedicated placement referrals, resume reviews, and live interview prep, but *never* unconditional guarantees.
  4. Layer 3 Quality Control verified the message against prohibited commercial claims.
* **Human Review Required?** **NO.** Successfully addressed transparently within compliance guardrails.

---

## 3. Spot Checks & Grounding Audits

### 5 Relevance Decisions
1. **LEAD-001 (Rohan Sharma):** `Relevant: YES (91/100, 95% conf)`. Verbatim match: Software engineer wanting LangChain & RAG weekend cohort. Perfect ICP fit.
2. **LEAD-007 (Dr. Neha Joshi):** `Relevant: NO (15/100)`. Hard disqualifier: Medical clinical residency is completely outside Skillcase Applied AI scope.
3. **LEAD-009 (Sneha Reddy):** `Relevant: NO (0/100)`. Hard disqualifier: Explicit DNC request (`"STOP CALLING ME"`). Suppressed immediately.
4. **LEAD-011 (Pooja Nair):** `Relevant: NO (40/100, 50% conf)`. Message was only `"Send details"` with no phone. Flagged for review due to borderline confidence.
5. **LEAD-015 (Divya Prakash):** `Relevant: YES (94/100, 98% conf)`. Laid off developer with immediate budget looking for upcoming Saturday batch.

### 5 Enrichment Outputs
1. **LEAD-002 (Priya Patel):** Identified Primary Need: Transition from manual QA to Python/Full-Stack AI; Primary Objection: Price / EMI financing structure. Grounded in source text.
2. **LEAD-004 (Vikram Malhotra):** Identified Goal: Pivot from IT Analyst to AI Tech Lead; Timeline: Immediate cohort start. Grounded in source text.
3. **LEAD-013 (Meera Sundaram):** Identified Objection: `TRUST` / `CAREER_OUTCOME` (Requires UGC/AICTE accredited degree for parental approval). Correctly tagged degree vs. industry certification gap.
4. **LEAD-020 (Deepak Chawla):** Identified Goal: MLOps specialization with Docker/Kubernetes and Triton/vLLM. No hallucinated attributes.
5. **LEAD-027 (Ritu Singhania):** Identified Buying Signal: Employer corporate reimbursement from Deloitte requiring official GST receipt.

### 5 Deterministic Priority Calculations
1. **LEAD-015 (Divya Prakash):** Need (5*4=20) + Intent (5*5=25) + Urgency (5*4=20) + Buying Signals (5*4=20) + Actionability (5*3=15) = **100/100 (HIGH)**. Highest commercial priority.
2. **LEAD-001 (Rohan Sharma):** Need (5*4=20) + Intent (4*5=20) + Urgency (4*4=16) + Buying Signals (5*4=20) + Actionability (5*3=15) = **91/100 (HIGH)**.
3. **LEAD-003 (Ananya Gupta):** Need (4*4=16) + Intent (4*5=20) + Urgency (3*4=12) + Buying Signals (3*4=12) + Actionability (5*3=15) = **75/100 (MEDIUM)**. Student profile with clear career objective.
4. **LEAD-028 (Krunal Pandya):** Need (3*4=12) + Intent (3*5=15) + Urgency (3*4=12) + Buying Signals (2*4=8) + Actionability (4*3=12) = **59/100 (MEDIUM)**. Standard exploratory lead.
5. **LEAD-005 (Rohan S. - Duplicate):** Override Enforced: **0/100 (EXCLUDED)**. Duplicate of LEAD-001.

### 5 Personalized Outreach Messages
1. **LEAD-001 (WhatsApp):** Cites his 3 years of service-firm experience and introduces the weekend-friendly schedule specifically focusing on LangChain & RAG capstones.
2. **LEAD-002 (WhatsApp):** Directly answers her anxiety regarding QA automation by outlining how Python basics build into applied AI, and shares the flexible EMI payment schedule.
3. **LEAD-015 (WhatsApp/Phone):** High-urgency response acknowledging her goal for this Saturday's cohort, sharing the admissions schedule, and offering a priority enrollment link.
4. **LEAD-027 (Email):** Addresses her corporate sponsorship with Deloitte, confirming Skillcase provides standard GST tax invoices and certificate of completion for employer reimbursement.
5. **LEAD-009 (Suppressed):** Zero outreach generated in compliance with Do-Not-Contact directive.

---

## 4. Issues Found and Corrective Measures Implemented

| Category | Initial Vulnerability | System Correction Applied |
| :--- | :--- | :--- |
| **Formula Injection** | Excel cells starting with `=cmd|` or `@HYPERLINK` could execute in desktop Excel. | Implemented `sanitizeFormulaString()` prefixing unsafe characters with `'` across all string exports. |
| **Deduplication Leak** | Secondary submissions were creating duplicate SDR tasks. | Exact matching on normalized phone/email flags duplicates, and merges complementary inquiry notes into the primary record. |
| **False Precision** | Pure LLM scoring gave unstable, hallucinated scores (e.g. 78 on one run, 62 on next). | Moved priority scoring to 100% deterministic TypeScript math with fixed weights and bounded 0–5 sub-scales. |
| **Non-Capability Guarantees** | Generative models tended to promise jobs to placate aggressive leads. | Added `explicit_non_capabilities` guardrail to prompt context and Layer 3 prohibited claims regex check. |
| **Data Contradictions** | Conflicting form dropdown vs text notes caused confusion. | Created Layer 4 cross-field validator that detects keyword clashes and routes lead to the Human Review Queue. |

---

## 5. Remaining Limitations & Future Roadmap

1. **Audio/WhatsApp Voice Notes:** Currently only text inquiries and transcribed notes are ingested. Voice inbound notes require an audio transcription ingestion stage.
2. **Dynamic Timezones:** Cohort timing recommendations currently default to IST. International prospects should automatically receive localized batch timezones (e.g. EST/PST/GMT).
3. **CRM Webhook Dispatch:** Currently exports to multi-sheet Excel and UI drawers. Next evolution will include bi-directional webhooks to Salesforce, HubSpot, and LeadSquared.
