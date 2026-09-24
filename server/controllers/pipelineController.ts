/**
 * AI Lead Intelligence — Pipeline Controller
 * Orchestrates full ingestion, deterministic cleaning, AI relevance & enrichment,
 * mathematical priority calculation, outreach generation, multi-layer QC, and Excel export.
 */

import { Request, Response } from 'express';
import {
  ApiResponse,
  BusinessContext,
  CleanedLeadRecord,
  PipelineExecutionSummary,
  ProcessedLead,
} from '../../src/types/pipeline.ts';
import {
  getActiveBusinessContext,
  PRESET_CONTEXTS,
  setActiveBusinessContext,
} from '../config/presets.ts';
import { getSafeSecretStatus, isGeminiConfigured } from '../config/env.ts';
import { parseSpreadsheetBuffer } from '../services/ingestion/fileParser.ts';
import { cleanAndAuditLead } from '../services/cleaning/issueDetector.ts';
import { deduplicateLeads } from '../services/deduplication/deduplicator.ts';
import { classifyLeadRelevance } from '../services/ai/relevanceService.ts';
import { enrichLeadUnderstanding } from '../services/ai/enrichmentService.ts';
import { calculateDeterministicPriority } from '../services/scoring/priorityCalculator.ts';
import { generatePersonalizedOutreach } from '../services/ai/outreachService.ts';
import { runMultiLayerQC } from '../services/qc/qcService.ts';
import { generateSalesWorkbookBuffer } from '../services/export/excelGenerator.ts';
import { SKILLCASE_30_LEADS_DATASET } from '../data/sampleDatasets.ts';
import { detectSchemaAndMapRows } from '../services/ingestion/schemaDetector.ts';
import { getAiCallStats, resetAiCallStats, RECOMMENDED_GEMINI_MODEL } from '../services/ai/geminiClient.ts';

// In-memory cache of current pipeline execution results
let currentProcessedLeads: ProcessedLead[] = [];
let currentExecutionSummary: PipelineExecutionSummary | null = null;

export async function getHealthHandler(_req: Request, res: Response) {
  const secretStatus = getSafeSecretStatus();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      aiConfigured: secretStatus.configured,
      secretSource: secretStatus.source,
      keyPrefix: secretStatus.keyPrefix,
    },
  } as ApiResponse);
}

export async function getContextHandler(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      active: getActiveBusinessContext(),
      presets: Object.values(PRESET_CONTEXTS),
    },
  } as ApiResponse);
}

export async function setContextHandler(req: Request, res: Response) {
  const newContext: BusinessContext = req.body;
  if (!newContext || !newContext.name || !newContext.product_name) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CONTEXT', message: 'Business context must include name and product_name.' },
    } as ApiResponse);
  }

  setActiveBusinessContext(newContext);
  res.json({
    success: true,
    data: { active: getActiveBusinessContext() },
  } as ApiResponse);
}

export async function getSampleDatasetHandler(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      fileName: 'skillcase_b2c_inbound_leads_30.xlsx',
      totalRecords: SKILLCASE_30_LEADS_DATASET.length,
      records: SKILLCASE_30_LEADS_DATASET,
    },
  } as ApiResponse);
}

/**
 * Deterministic Cleaning Only (Phases 2 & 3)
 */
export async function cleanDatasetHandler(req: Request, res: Response) {
  try {
    let rawRows: Record<string, any>[] = [];

    if (req.file) {
      const parsed = await parseSpreadsheetBuffer(req.file.buffer, req.file.originalname);
      rawRows = parsed.rawRecords;
    } else if (Array.isArray(req.body.records)) {
      rawRows = req.body.records;
    } else {
      rawRows = SKILLCASE_30_LEADS_DATASET;
    }

    const { mappedRows, detectedColumns } = detectSchemaAndMapRows(rawRows);

    // Deterministic Normalization & Issue Detection
    const cleanedList: CleanedLeadRecord[] = mappedRows.map((m, idx) =>
      cleanAndAuditLead(m, idx + 1, `LEAD-${String(idx + 1).padStart(3, '0')}`)
    );

    // Deterministic Deduplication
    const { processedLeads, exactDuplicateCount, possibleDuplicateCount } = deduplicateLeads(cleanedList);

    const missingFieldsCount = processedLeads.reduce(
      (acc, l) => acc + l.data_issues.filter((i: any) => i.issue_type === 'missing_required').length,
      0
    );
    const invalidFieldsCount = processedLeads.reduce(
      (acc, l) => acc + l.data_issues.filter((i: any) => i.issue_type === 'invalid_format' || i.issue_type === 'suspicious_phone').length,
      0
    );
    const cleanRecordsCount = processedLeads.filter((l) => l.data_issues.length === 0).length;
    const avgQuality = Math.round(
      processedLeads.reduce((acc, l) => acc + l.data_quality_score, 0) / (processedLeads.length || 1)
    );

    res.json({
      success: true,
      data: {
        totalRecords: processedLeads.length,
        detectedColumns,
        qualitySummary: {
          total_records: processedLeads.length,
          clean_records_count: cleanRecordsCount,
          duplicate_count: exactDuplicateCount,
          possible_duplicate_count: possibleDuplicateCount,
          missing_fields_count: missingFieldsCount,
          invalid_fields_count: invalidFieldsCount,
          average_quality_score: avgQuality,
        },
        cleanedLeads: processedLeads,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CLEANING_FAILED', message: error.message || 'Cleaning failed.' },
    } as ApiResponse);
  }
}

/**
 * Full End-to-End Processing Pipeline (Phases 1 - 9)
 */
export async function processPipelineHandler(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    let rawRows: Record<string, any>[] = [];
    let sourceFileName = 'skillcase_b2c_inbound_leads_30.xlsx';

    if (req.file) {
      sourceFileName = req.file.originalname;
      const parsed = await parseSpreadsheetBuffer(req.file.buffer, req.file.originalname);
      rawRows = parsed.rawRecords;
    } else if (Array.isArray(req.body.records)) {
      rawRows = req.body.records;
      if (req.body.fileName) sourceFileName = req.body.fileName;
    } else {
      rawRows = SKILLCASE_30_LEADS_DATASET;
    }

    const context = getActiveBusinessContext();

    // 1. Ingestion & Schema Detection
    const { mappedRows } = detectSchemaAndMapRows(rawRows);

    // 2. Deterministic Cleaning & Issue Detection
    const initialLeads: CleanedLeadRecord[] = mappedRows.map((m, idx) =>
      cleanAndAuditLead(m, idx + 1, `LEAD-${String(idx + 1).padStart(3, '0')}`)
    );

    // 3. Deterministic Deduplication
    const { processedLeads: cleanedLeads, exactDuplicateCount, possibleDuplicateCount } = deduplicateLeads(initialLeads);

    resetAiCallStats();
    const processedList: ProcessedLead[] = [];

    // Process leads in controlled parallel chunks (concurrency: 4)
    const CHUNK_SIZE = 4;
    for (let i = 0; i < cleanedLeads.length; i += CHUNK_SIZE) {
      const chunk = cleanedLeads.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (lead) => {
          try {
            // 4. AI Relevance Classification (Stage 4)
            const relevance = await classifyLeadRelevance(lead, context);

            // 5. AI Lead Understanding (Stage 5)
            const enrichment = await enrichLeadUnderstanding(lead, relevance, context);

            // 6. Deterministic Priority Math (Stage 6)
            const priority = calculateDeterministicPriority(lead, relevance, enrichment);

            // 7. Personalized Outreach (Stage 7)
            const outreach = await generatePersonalizedOutreach(lead, relevance, priority, enrichment, context);

            // 8. Multi-Layer Quality Control (Stage 8)
            const qc = await runMultiLayerQC(lead, relevance, priority, enrichment, outreach, context, false);

            const contactDisplay = [lead.contact.phone, lead.contact.email].filter(Boolean).join(' | ') || 'No contact provided';

            return {
              lead_id: lead.lead_id,
              name: lead.name,
              contact: contactDisplay,
              location: lead.location || 'Unknown',
              source: lead.source,
              duplicate_status: lead.duplicate_status,
              data_quality_score: lead.data_quality_score,
              data_issues_count: lead.data_issues.length,
              
              relevant: relevance.relevant,
              relevance_classification: relevance.classification,
              relevance_score: relevance.relevance_score,
              relevance_confidence: relevance.relevance_confidence,
              relevance_reason: relevance.relevance_reason,
              ai_error: relevance.ai_error,
              ai_error_message: relevance.ai_error_message,

              profile: enrichment.profile.summary,
              intent: enrichment.intent.summary,
              need: enrichment.needs.primary_need,
              primary_objection: enrichment.objections[0]?.description || 'None detected',
              next_action: enrichment.recommended_next_action.action_detail,
              next_action_category: enrichment.recommended_next_action.category,
              opportunity: enrichment.opportunity.description,
              missing_information: enrichment.missing_information.join('; ') || 'None',

              priority: priority.priority,
              priority_score: priority.priority_score,
              priority_reason: priority.priority_reason,
              priority_drivers: priority.drivers,

              outreach_strategy: outreach.outreach_strategy,
              personalization_points: outreach.personalization_points,
              message_angle: outreach.message_angle,
              cta: outreach.cta,
              outreach: outreach.outreach,

              qc_status: qc.qc_status,
              qc_reason: qc.qc_reason,
              qc_issues: qc.qc_issues,
              review_required: qc.review_required,

              cleaned: lead,
              relevance,
              enrichment,
              priority_details: priority,
              outreach_details: outreach,
              qc,
            } as ProcessedLead;
          } catch (err: any) {
            // Resilient row-level error handling: AI failure must NOT be converted to Not Relevant!
            return {
              lead_id: lead.lead_id,
              name: lead.name,
              contact: lead.contact.phone || lead.contact.email || 'None',
              location: lead.location || 'Unknown',
              source: lead.source,
              duplicate_status: lead.duplicate_status,
              data_quality_score: lead.data_quality_score,
              data_issues_count: lead.data_issues.length,
              relevant: true,
              relevance_classification: 'ai_error',
              relevance_score: 50,
              relevance_confidence: 0.0,
              relevance_reason: `AI processing failure: ${err.message}. Routed to human review.`,
              ai_error: true,
              ai_error_message: err.message,
              priority: 'Medium',
              priority_score: 50,
              priority_reason: 'Preliminary priority pending SDR review due to AI error',
              priority_drivers: ['AI error fallback — manual review required'],
              qc_status: 'flagged_review',
              qc_reason: `Row error: ${err.message}`,
              qc_issues: [{ layer: 'layer1_schema', severity: 'high', issue: err.message, recommendation: 'Retry lead' }],
              review_required: true,
              cleaned: lead,
              qc: {
                qc_status: 'flagged_review',
                qc_reason: err.message,
                qc_issues: [],
                review_required: true,
                checks: {
                  layer1_schema_valid: false,
                  layer2_consistency_valid: true,
                  layer3_evidence_grounded: false,
                  layer4_no_contradictions: true,
                  layer5_ai_reviewer_passed: false,
                },
                audited_by: 'multi_layer_qc',
              },
            } as ProcessedLead;
          }
        })
      );
      processedList.push(...chunkResults);
    }

    currentProcessedLeads = processedList;

    // Compute Summary KPIs
    const durationMs = Date.now() - startTime;
    const summary: PipelineExecutionSummary = {
      run_id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      file_name: sourceFileName,
      business_context_name: context.name,
      total_raw_rows: rawRows.length,
      total_cleaned_leads: processedList.length,
      quality_summary: {
        total_records: processedList.length,
        clean_records_count: processedList.filter(l => l.data_issues_count === 0).length,
        duplicate_count: exactDuplicateCount,
        possible_duplicate_count: possibleDuplicateCount,
        missing_fields_count: cleanedLeads.reduce((acc, l) => acc + l.data_issues.filter((i: any) => i.issue_type === 'missing_required').length, 0),
        invalid_fields_count: cleanedLeads.reduce((acc, l) => acc + l.data_issues.filter((i: any) => i.issue_type === 'invalid_format').length, 0),
        average_quality_score: Math.round(cleanedLeads.reduce((acc, l) => acc + l.data_quality_score, 0) / (cleanedLeads.length || 1)),
      },
      relevance_summary: {
        relevant_count: processedList.filter(l => l.relevant && l.relevance_classification === 'relevant').length,
        not_relevant_count: processedList.filter(l => !l.relevant && l.relevance_classification === 'not_relevant').length,
        uncertain_count: processedList.filter(l => l.relevance_classification === 'uncertain').length,
        ai_error_count: processedList.filter(l => l.relevance_classification === 'ai_error').length,
        review_required_count: processedList.filter(l => l.review_required).length,
        hard_disqualified_count: processedList.filter(l => l.relevance?.hard_disqualifier !== null && l.relevance?.hard_disqualifier !== undefined).length,
      },
      priority_summary: {
        high_count: processedList.filter(l => l.priority === 'High').length,
        medium_count: processedList.filter(l => l.priority === 'Medium').length,
        low_count: processedList.filter(l => l.priority === 'Low').length,
        excluded_count: processedList.filter(l => l.priority === 'EXCLUDED').length,
      },
      qc_summary: {
        passed_count: processedList.filter(l => l.qc_status === 'passed').length,
        flagged_review_count: processedList.filter(l => l.qc_status === 'flagged_review').length,
        rejected_count: processedList.filter(l => l.qc_status === 'rejected').length,
      },
      duration_ms: durationMs,
    };

    currentExecutionSummary = summary;

    res.json({
      success: true,
      data: {
        summary,
        leads: processedList,
        ai_stats: getAiCallStats(),
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PROCESSING_FAILED', message: error.message || 'Pipeline processing failed.' },
    } as ApiResponse);
  }
}

/**
 * Human SDR Lead Override (Phase 8 Human Review Queue)
 */
export async function overrideLeadHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { relevance, priority, qc_status, notes } = req.body;

  const lead = currentProcessedLeads.find(l => l.lead_id === id);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
    } as ApiResponse);
  }

  if (typeof relevance === 'boolean') {
    lead.relevant = relevance;
    lead.relevance_classification = relevance ? 'relevant' : 'not_relevant';
  }
  if (priority) {
    lead.priority = priority;
  }
  if (qc_status) {
    lead.qc_status = qc_status;
    lead.review_required = qc_status !== 'passed';
  }

  lead.qc.human_override = {
    overridden: true,
    overridden_by: 'SDR Reviewer',
    timestamp: new Date().toISOString(),
    notes: notes || 'Manual SDR confirmation',
  };

  res.json({
    success: true,
    data: lead,
  } as ApiResponse);
}

/**
 * Download Styled Multi-Sheet Sales Excel Workbook (Phase 9)
 */
export async function exportWorkbookHandler(_req: Request, res: Response) {
  try {
    if (currentProcessedLeads.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_DATA', message: 'No processed leads available to export. Run pipeline first.' },
      } as ApiResponse);
    }

    const context = getActiveBusinessContext();
    const summary = currentExecutionSummary || {
      run_id: 'default',
      timestamp: new Date().toISOString(),
      file_name: 'leads_export.xlsx',
      business_context_name: context.name,
      total_raw_rows: currentProcessedLeads.length,
      total_cleaned_leads: currentProcessedLeads.length,
      quality_summary: {
        total_records: currentProcessedLeads.length,
        clean_records_count: currentProcessedLeads.length,
        duplicate_count: 0,
        possible_duplicate_count: 0,
        missing_fields_count: 0,
        invalid_fields_count: 0,
        average_quality_score: 95,
      },
      relevance_summary: {
        relevant_count: currentProcessedLeads.filter(l => l.relevant).length,
        not_relevant_count: currentProcessedLeads.filter(l => !l.relevant).length,
        uncertain_count: 0,
        review_required_count: currentProcessedLeads.filter(l => l.review_required).length,
        hard_disqualified_count: 0,
      },
      priority_summary: {
        high_count: currentProcessedLeads.filter(l => l.priority === 'High').length,
        medium_count: currentProcessedLeads.filter(l => l.priority === 'Medium').length,
        low_count: currentProcessedLeads.filter(l => l.priority === 'Low').length,
        excluded_count: 0,
      },
      qc_summary: {
        passed_count: currentProcessedLeads.filter(l => l.qc_status === 'passed').length,
        flagged_review_count: currentProcessedLeads.filter(l => l.qc_status === 'flagged_review').length,
        rejected_count: 0,
      },
      duration_ms: 0,
    };

    const buffer = await generateSalesWorkbookBuffer(currentProcessedLeads, context, summary);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="AI_Lead_Intelligence_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: error.message || 'Workbook generation failed.' },
    } as ApiResponse);
  }
}

/**
 * Get all current processed leads
 */
export async function getLeadsHandler(_req: Request, res: Response) {
  res.json({
    success: true,
    data: currentProcessedLeads,
  } as ApiResponse);
}

/**
 * Get single lead by ID
 */
export async function getLeadByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  const lead = currentProcessedLeads.find((l) => l.lead_id === id);
  if (!lead) {
    return res.status(404).json({
      error: true,
      message: `Lead ${id} not found.`,
      code: 'LEAD_NOT_FOUND',
    });
  }
  res.json({
    success: true,
    data: lead,
  } as ApiResponse);
}

/**
 * Get latest pipeline results and execution summary
 */
export async function getResultsHandler(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      summary: currentExecutionSummary,
      leads: currentProcessedLeads,
    },
  } as ApiResponse);
}

/**
 * Get leads currently queued for human SDR review
 */
export async function getReviewQueueHandler(_req: Request, res: Response) {
  const queue = currentProcessedLeads.filter(
    (l) => l.qc_status === 'flagged_review' || l.qc_status === 'rejected' || l.review_required
  );
  res.json({
    success: true,
    data: {
      total: queue.length,
      leads: queue,
    },
  } as ApiResponse);
}

