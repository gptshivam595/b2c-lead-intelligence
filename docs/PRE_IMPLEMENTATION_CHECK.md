# AI Lead Intelligence — Pre-Implementation Safety & Consistency Audit

**Audit Date:** September 2026  
**Auditor Role:** Senior Full-Stack Architect, AI Systems Engineer, and Product Reviewer  
**Status:** **READY**  
**Gate Decision:** APPROVED TO COMMENCE IMPLEMENTATION  

---

## 1. Safety & Consistency Verification Matrix

### 1.1 Architecture Consistency
| Check | Status | Verification Detail |
|---|---|---|
| **Roadmap Alignment** | PASS | `docs/IMPLEMENTATION_PLAN.md` strictly mirrors `docs/ARCHITECTURE.md` (v1.1.0). Each phase maps to modular components without logical divergence. |
| **Frontend / Backend Decoupling** | PASS | Frontend runs strictly as a client SPA (React 19, Tailwind CSS). All business logic, file ingestion, data transformation, and AI calls are isolated in `server.ts` and Express services. |
| **Deterministic vs Probabilistic Separation** | PASS | All text sanitization, phone E.164 normalization, email syntax validation, duplicate clustering, hard disqualifier enforcement, mathematical priority scoring, and formula escaping are handled in deterministic TypeScript code. Gemini is strictly utilized for semantic inference (relevance reasoning, intent/need/objection extraction, natural language outreach generation, and second-pass auditing). |

### 1.2 Data Safety & Traceability
| Check | Status | Verification Detail |
|---|---|---|
| **Raw Data Immutability** | PASS | The original raw input (`raw_data` / `raw_source`) is stored verbatim in every record and is never modified, truncated, or overwritten. |
| **Zero Silent Record Deletion** | PASS | Malformed, duplicate, or disqualified records are never dropped from the dataset. All records are retained, tagged with diagnostic issue codes, and surfaced in the UI and Excel export. |
| **Non-Destructive Deduplication** | PASS | Exact and fuzzy duplicate rows are linked to their primary parent (`duplicate_of_lead_id`), their context is merged into the primary record for enrichment, and secondary rows remain visible in the dataset with a distinct duplicate badge. |
| **Anti-Hallucination Grounding** | PASS | Missing information is never fabricated. Stated facts are segregated from reasonable inferences, and unknown parameters are tagged explicitly as `"Unknown / Not Disclosed"`. Tier 1 QC performs exact substring matching to ensure every cited `evidence_quote` exists in the source text. |

### 1.3 AI Safety & Secret Management
| Check | Status | Verification Detail |
|---|---|---|
| **Server-Side Isolation** | PASS | `@google/genai` is imported and called strictly on the Node.js backend. Zero client-side bundles contain GenAI imports. |
| **Secret Configuration** | PASS | The existing Google AI Studio secret `skillcase api` is prioritized via `resolveGeminiApiKey()`, checking `process.env['skillcase api']`, `process.env.SKILLCASE_API`, and `process.env.GEMINI_API_KEY`. |
| **Zero Secret Leakage** | PASS | The API key is never printed, logged to stdout/stderr, passed to client responses, or embedded in HTML meta tags. |
| **Structured JSON Schema Enforcement** | PASS | Every Gemini call uses `responseMimeType: "application/json"` with strict `responseSchema` definitions. No unstructured markdown is accepted into the data pipeline. |
| **Deterministic Business Rule Primacy** | PASS | Hard disqualifiers directly override AI relevance classifications. Even if the LLM marks a lead relevant, the deterministic disqualifier check forces `relevant = false` and caps the score below 30. |

### 1.4 Pipeline Ordering & Stage Validations
The pipeline order strictly adheres to the mandated progression with validation gates between every step:
$$\text{Raw File} \longrightarrow \text{Cleaning} \longrightarrow \text{Deduplication} \longrightarrow \text{Relevance} \longrightarrow \text{Enrichment} \longrightarrow \text{Priority Math} \longrightarrow \text{Outreach} \longrightarrow \text{Tiered QC} \longrightarrow \text{Final Model} \longrightarrow \text{Excel Export}$$

- **Stage 1 $\to$ 2:** Schema detector confirms mapped headers and preserves custom attributes before normalizer runs.
- **Stage 2 $\to$ 3:** Normalized phone/email indices are validated before duplicate matching.
- **Stage 3 $\to$ 4:** Duplicate and invalid records are flagged; qualified leads are gated for AI relevance.
- **Stage 4 $\to$ 5:** Disqualified leads bypass deep enrichment, saving API calls.
- **Stage 5 $\to$ 6:** Discrete signal levels extracted by AI are validated before priority math is computed.
- **Stage 6 $\to$ 7:** Priority tier and extracted objections are passed to outreach generator.
- **Stage 7 $\to$ 8:** Outreach copy undergoes length, greeting, and discount blacklist checks before QC tiering.
- **Stage 8 $\to$ 9:** QC checks categorize leads into `passed`, `flagged_review`, or `rejected`.
- **Stage 9 $\to$ 10:** 24-column unified dataset validated before streaming multi-tab Excel export.

### 1.5 Business Logic Invariants
The mathematical formulas and weighting models are hardcoded into deterministic code:
- **Relevance Framework:**
  $$\text{Relevance Score} = (\text{NeedFit} \times 0.35) + (\text{CustomerFit} \times 0.25) + (\text{Intent} \times 0.20) + (\text{Eligibility} \times 0.10) + (\text{Evidence} \times 0.10)$$
  *Hard Disqualifier Invariant:* If any disqualifier is triggered, `relevant = false` and $\text{Relevance Score} \le 29$.
- **Priority Framework:**
  $$\text{Priority Score} = (\text{NeedFit} \times 0.20) + (\text{Intent} \times 0.25) + (\text{Urgency} \times 0.20) + (\text{BuyingSignals} \times 0.20) + (\text{Actionability} \times 0.15)$$
  *Score Tiers:* High ($80–100$), Medium ($50–79$), Low ($0–49$).

### 1.6 Quality Control Rigor
- **Deterministic Tier 1:** Schema format validation, E.164 phone & RFC-5322 email regex, score boundary constraints, disqualifier consistency, verbatim quote substring verification, and outreach length/banned claims check.
- **Targeted AI Tier 2:** Secondary independent Gemini audit invoked exclusively on high-risk leads (borderline confidence $0.50–0.75$, High Priority $\ge 80$, or unverified quotes).
- **Human Review Queue Tier 3:** Interactive review screen for SDRs with discrepancy inspection, one-click override, and immutable timestamped audit logging.

### 1.7 Domain Agility & Generic Architecture
- The pipeline does not hardcode EdTech or Skillcase-specific field names.
- Schema detection maps synonyms across any industry ("Parent Name", "Student", "Patient", "Applicant", "Buyer", "Phone", "WhatsApp", "Tel", "Query", "Requirements").
- Domain attributes not in core identity fields are preserved in `custom_attributes` and fed into AI prompt context.
- System includes 4 complete out-of-the-box presets (EdTech, InsurTech, Clean Energy, Real Estate) and accepts custom runtime `BusinessContext` configurations.

### 1.8 Dependency Control & Lean Stack Analysis
Only strictly necessary, lightweight libraries are planned:
1. **`exceljs`:** Required to stream, parse, format, style, and generate multi-sheet Excel (.xlsx) workbooks with frozen headers, conditional formatting, and auto-filters. (Node.js has no native Excel format capabilities).
2. **`zod`:** Required for deterministic runtime schema validation of API payloads and structured AI responses.
3. **`fuse.js`:** Lightweight zero-dependency library for fuzzy string similarity across composite name/location fields without spinning up an external search service.
4. **`multer`:** Standard lightweight middleware for parsing `multipart/form-data` file uploads in Express.
- **Rejected Dependencies:** No heavy relational/NoSQL databases, microservices, external queue workers (Kafka/BullMQ), vector databases, or authentication systems. The application relies cleanly on in-memory ephemeral storage with TTL.

### 1.9 Fault Tolerance & Error Handling
- **Row-Level Fault Isolation:** A malformed row in an Excel file is isolated, marked as `malformed_row`, assigned `qc_status: 'flagged_review'`, and processed alongside valid leads without crashing the batch.
- **Exponential Backoff:** Gemini API calls incorporate a 3-tier jittered backoff for HTTP 429 / 503 errors. If an AI batch fails after 3 retries, affected leads fall back gracefully to deterministic triage values without pipeline abortion.
- **State Recovery:** The server maintains run state in an in-memory session store; if the client connection is interrupted, the frontend can query `GET /api/process/status/:run_id` to restore state.

### 1.10 Cost & Token Efficiency
- **Gated Pipeline:** Disqualified and duplicate leads (often 40–70% of inbound volume) bypass Stage 3 deep enrichment and outreach generation, eliminating thousands of unnecessary tokens.
- **Adaptive Mini-Batching:** Ingestion groups 5–8 leads per prompt, reducing API invocations for a 100-lead file from 100 calls down to ~15.
- **Targeted Secondary QC:** Only 15–20% of leads (borderline or high-stakes) receive a second AI audit call, avoiding 80% redundant LLM invocations.

### 1.11 Scope Control & Phased Discipline
- Development will strictly follow `docs/IMPLEMENTATION_PLAN.md` phase-by-phase.
- No future phases will be written early.
- Existing functionality and working build states will be preserved across each increment.

### 1.12 Testability & Acceptance Criteria
Every phase in `docs/IMPLEMENTATION_PLAN.md` has defined acceptance criteria and edge-case test suites.

---

## 2. Gate Decision Summary

### Status: **READY**

- **Critical Issues:** None (0)
- **High Issues:** None (0)
- **Resolved Issues:** All 18 issues identified during architecture review (pipeline gating, formula injection, tiered QC, domain attribute preservation, priority calculation contracts) are resolved and documented in `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.
- **Remaining Risks:** 
  1. *Very large files (> 500 leads):* Mitigated by client-side file size restrictions and row count warnings.
  2. *Transient API rate limits:* Mitigated by exponential backoff and mini-batching.

---

## 3. Implementation Authorization
The architectural design, data models, business rules, safety mechanisms, and implementation plan are thoroughly verified and completely consistent. 

**The project is officially marked READY to begin Phase 1.**
