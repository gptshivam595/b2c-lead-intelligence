/**
 * AI Lead Intelligence — Multi-Sheet Excel Workbook Generator (Phase 9)
 * Generates an executive-grade, sales-ready Excel file using ExcelJS.
 */

import ExcelJS from 'exceljs';
import {
  BusinessContext,
  PipelineExecutionSummary,
  ProcessedLead,
} from '../../../src/types/pipeline.ts';
import { sanitizeFormulaString } from '../ingestion/schemaDetector.ts';

export async function generateSalesWorkbookBuffer(
  leads: ProcessedLead[],
  context: BusinessContext,
  summary: PipelineExecutionSummary
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI Lead Intelligence Platform';
  workbook.created = new Date();

  const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };

  const HEADER_FONT: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const BORDER_STYLE: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // ==========================================
  // SHEET 1: README / Summary
  // ==========================================
  const sheetReadme = workbook.addWorksheet('README & Overview', {
    views: [{ showGridLines: true }],
  });

  sheetReadme.columns = [
    { header: 'Property', key: 'prop', width: 28 },
    { header: 'Details', key: 'val', width: 65 },
  ];

  sheetReadme.addRow({ prop: 'Workbook Title', val: 'AI Lead Intelligence Sales Dossier' });
  sheetReadme.addRow({ prop: 'Target Product', val: context.product_name });
  sheetReadme.addRow({ prop: 'Industry Context', val: context.industry });
  sheetReadme.addRow({ prop: 'Generated At', val: new Date().toISOString() });
  sheetReadme.addRow({ prop: 'Total Records Evaluated', val: summary.total_cleaned_leads });
  sheetReadme.addRow({ prop: 'Pipeline Version', val: 'v1.1.0 Multi-Layer QC Verified' });
  sheetReadme.addRow({ prop: 'Sheet Navigation', val: '1. Lead Intelligence (Main SDR View), 2. QC Review (Human Attention), 3. Cleaned Leads, 4. Raw Data, 5. Analytics KPI Summary' });

  // Style Sheet 1 header
  sheetReadme.getRow(1).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });

  // ==========================================
  // SHEET 2: Lead Intelligence (MAIN OUTPUT SHEET)
  // ==========================================
  const sheetMain = workbook.addWorksheet('Lead Intelligence', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });

  const mainColumns = [
    { header: 'Lead ID', key: 'lead_id', width: 14 },
    { header: 'Full Name', key: 'name', width: 20 },
    { header: 'Contact', key: 'contact', width: 26 },
    { header: 'Location', key: 'location', width: 18 },
    { header: 'Source', key: 'source', width: 16 },
    { header: 'Data Issues', key: 'data_issues', width: 24 },
    { header: 'Duplicate Status', key: 'duplicate_status', width: 18 },
    { header: 'Relevant', key: 'relevant', width: 12 },
    { header: 'Relevance Reason', key: 'relevance_reason', width: 34 },
    { header: 'Relevance Conf.', key: 'relevance_confidence', width: 16 },
    { header: 'Profile', key: 'profile', width: 30 },
    { header: 'Intent / Goal', key: 'intent', width: 30 },
    { header: 'Need', key: 'need', width: 28 },
    { header: 'Objection', key: 'objection', width: 24 },
    { header: 'Missing Info', key: 'missing_information', width: 22 },
    { header: 'Opportunity', key: 'opportunity', width: 26 },
    { header: 'Priority Score', key: 'priority_score', width: 14 },
    { header: 'Priority', key: 'priority', width: 14 },
    { header: 'Priority Reason', key: 'priority_reason', width: 34 },
    { header: 'Next Action', key: 'next_action', width: 26 },
    { header: 'Outreach Strategy', key: 'outreach_strategy', width: 20 },
    { header: 'Personalized Outreach', key: 'outreach', width: 45 },
    { header: 'QC Status', key: 'qc_status', width: 16 },
    { header: 'QC Reason', key: 'qc_reason', width: 34 },
  ];

  sheetMain.columns = mainColumns;
  sheetMain.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: mainColumns.length },
  };

  sheetMain.getRow(1).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  sheetMain.getRow(1).height = 28;

  for (const lead of leads) {
    const contactStr = [
      lead.cleaned.contact.phone ? `Ph: ${lead.cleaned.contact.phone}` : null,
      lead.cleaned.contact.email ? `Em: ${lead.cleaned.contact.email}` : null,
    ].filter(Boolean).join(' | ');

    const issuesStr = lead.cleaned.data_issues.map((i: any) => `${i.field}: ${i.issue_type}`).join('; ') || 'None';

    const row = sheetMain.addRow({
      lead_id: lead.lead_id,
      name: sanitizeFormulaString(lead.name),
      contact: sanitizeFormulaString(contactStr),
      location: sanitizeFormulaString(lead.location),
      source: sanitizeFormulaString(lead.source),
      data_issues: sanitizeFormulaString(issuesStr),
      duplicate_status: lead.duplicate_status,
      relevant: lead.relevant ? 'YES' : 'NO',
      relevance_reason: sanitizeFormulaString(lead.relevance_reason),
      relevance_confidence: `${Math.round(lead.relevance_confidence * 100)}%`,
      profile: sanitizeFormulaString(lead.profile || lead.cleaned.inquiry_text),
      intent: sanitizeFormulaString(lead.intent || 'Career transition'),
      need: sanitizeFormulaString(lead.need || 'Hands-on AI curriculum'),
      objection: sanitizeFormulaString(lead.primary_objection || 'None detected'),
      missing_information: sanitizeFormulaString(lead.missing_information || 'None'),
      opportunity: sanitizeFormulaString(lead.opportunity || 'Upcoming cohort applicant'),
      priority_score: lead.priority_score,
      priority: lead.priority,
      priority_reason: sanitizeFormulaString(lead.priority_reason),
      next_action: sanitizeFormulaString(lead.next_action || 'Schedule discovery call'),
      outreach_strategy: lead.outreach_strategy || 'NURTURE',
      outreach: sanitizeFormulaString(lead.outreach || 'No message generated'),
      qc_status: lead.qc_status.toUpperCase(),
      qc_reason: sanitizeFormulaString(lead.qc_reason),
    });

    row.height = 24;
    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'top', wrapText: true };
    });

    // Soft pastel styling on Priority cell
    const prioCell = row.getCell('priority');
    if (lead.priority === 'High') {
      prioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Soft emerald
      prioCell.font = { color: { argb: 'FF166534' }, bold: true };
    } else if (lead.priority === 'Medium') {
      prioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Soft amber
      prioCell.font = { color: { argb: 'FF92400E' }, bold: true };
    } else {
      prioCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Soft slate
      prioCell.font = { color: { argb: 'FF475569' } };
    }

    // Soft pastel styling on QC Status
    const qcCell = row.getCell('qc_status');
    if (lead.qc_status === 'flagged_review') {
      qcCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } }; // Orange
      qcCell.font = { color: { argb: 'FFC2410C' }, bold: true };
    } else if (lead.qc_status === 'rejected') {
      qcCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red
      qcCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }
  }

  // ==========================================
  // SHEET 3: QC Review Queue
  // ==========================================
  const sheetQc = workbook.addWorksheet('QC Review Queue', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });

  const qcColumns = [
    { header: 'Lead ID', key: 'lead_id', width: 14 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'QC Status', key: 'qc_status', width: 16 },
    { header: 'Primary Flag Reason', key: 'qc_reason', width: 40 },
    { header: 'Specific Layer Issues', key: 'issues', width: 50 },
    { header: 'Recommended SDR Action', key: 'sdr_action', width: 30 },
  ];
  sheetQc.columns = qcColumns;
  sheetQc.getRow(1).eachCell((c) => {
    c.fill = HEADER_FILL;
    c.font = HEADER_FONT;
  });

  const flaggedLeads = leads.filter(l => l.qc_status === 'flagged_review' || l.qc_status === 'rejected');
  for (const lead of flaggedLeads) {
    const issuesDetail = lead.qc.qc_issues.map((i: any) => `[${i.layer}] ${i.issue}`).join('\n') || lead.qc_reason;
    const r = sheetQc.addRow({
      lead_id: lead.lead_id,
      name: sanitizeFormulaString(lead.name),
      qc_status: lead.qc_status.toUpperCase(),
      qc_reason: sanitizeFormulaString(lead.qc_reason),
      issues: sanitizeFormulaString(issuesDetail),
      sdr_action: sanitizeFormulaString(lead.next_action || 'Inspect original query before messaging'),
    });
    r.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  }

  // ==========================================
  // SHEET 4: Cleaned Leads
  // ==========================================
  const sheetCleaned = workbook.addWorksheet('Cleaned Leads', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });
  sheetCleaned.columns = [
    { header: 'Lead ID', key: 'lead_id', width: 14 },
    { header: 'Normalized Name', key: 'name', width: 22 },
    { header: 'Normalized Phone', key: 'phone', width: 18 },
    { header: 'Normalized Email', key: 'email', width: 26 },
    { header: 'Normalized Location', key: 'location', width: 18 },
    { header: 'Data Quality Score', key: 'quality_score', width: 18 },
    { header: 'Issues Count', key: 'issues_count', width: 14 },
    { header: 'Duplicate Status', key: 'duplicate', width: 18 },
  ];
  sheetCleaned.getRow(1).eachCell((c) => {
    c.fill = HEADER_FILL;
    c.font = HEADER_FONT;
  });

  for (const l of leads) {
    const r = sheetCleaned.addRow({
      lead_id: l.lead_id,
      name: sanitizeFormulaString(l.cleaned.name),
      phone: sanitizeFormulaString(l.cleaned.contact.phone || 'None'),
      email: sanitizeFormulaString(l.cleaned.contact.email || 'None'),
      location: sanitizeFormulaString(l.cleaned.location || 'Unknown'),
      quality_score: `${l.cleaned.data_quality_score}/100`,
      issues_count: l.cleaned.data_issues.length,
      duplicate: l.duplicate_status,
    });
    r.eachCell(c => c.border = BORDER_STYLE);
  }

  // ==========================================
  // SHEET 5: Raw Data
  // ==========================================
  const sheetRaw = workbook.addWorksheet('Raw Data', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });
  sheetRaw.columns = [
    { header: 'Lead ID', key: 'lead_id', width: 14 },
    { header: 'Raw Name', key: 'raw_name', width: 20 },
    { header: 'Raw Phone', key: 'raw_phone', width: 20 },
    { header: 'Raw Email', key: 'raw_email', width: 26 },
    { header: 'Raw Location', key: 'raw_location', width: 20 },
    { header: 'Raw Inquiry / Notes', key: 'raw_inquiry', width: 45 },
    { header: 'Raw Payload Snapshot', key: 'snapshot', width: 50 },
  ];
  sheetRaw.getRow(1).eachCell((c) => {
    c.fill = HEADER_FILL;
    c.font = HEADER_FONT;
  });

  for (const l of leads) {
    const r = sheetRaw.addRow({
      lead_id: l.lead_id,
      raw_name: sanitizeFormulaString(l.cleaned.raw_name),
      raw_phone: sanitizeFormulaString(l.cleaned.contact.raw_phone),
      raw_email: sanitizeFormulaString(l.cleaned.contact.raw_email),
      raw_location: sanitizeFormulaString(l.cleaned.raw_location),
      raw_inquiry: sanitizeFormulaString(l.cleaned.raw_inquiry),
      snapshot: sanitizeFormulaString(JSON.stringify(l.cleaned.raw_source)),
    });
    r.eachCell(c => c.border = BORDER_STYLE);
  }

  // ==========================================
  // SHEET 6: Processing Summary (KPIs)
  // ==========================================
  const sheetSummary = workbook.addWorksheet('Processing Summary', {
    views: [{ showGridLines: true }],
  });
  sheetSummary.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Count / Value', key: 'value', width: 24 },
  ];
  sheetSummary.getRow(1).eachCell((c) => {
    c.fill = HEADER_FILL;
    c.font = HEADER_FONT;
  });

  const avgConfidence = Math.round(
    (leads.reduce((acc, l) => acc + l.relevance_confidence, 0) / (leads.length || 1)) * 100
  );
  const avgPriority = Math.round(
    leads.reduce((acc, l) => acc + l.priority_score, 0) / (leads.length || 1)
  );

  sheetSummary.addRow({ metric: 'Total Raw Inbound Leads', value: summary.total_cleaned_leads });
  sheetSummary.addRow({ metric: 'Relevant Leads (Qualified)', value: summary.relevance_summary.relevant_count });
  sheetSummary.addRow({ metric: 'Not Relevant / Disqualified', value: summary.relevance_summary.not_relevant_count });
  sheetSummary.addRow({ metric: 'High Priority (80–100)', value: summary.priority_summary.high_count });
  sheetSummary.addRow({ metric: 'Medium Priority (50–79)', value: summary.priority_summary.medium_count });
  sheetSummary.addRow({ metric: 'Low Priority / Excluded', value: summary.priority_summary.low_count + summary.priority_summary.excluded_count });
  sheetSummary.addRow({ metric: 'Confirmed Duplicates', value: summary.quality_summary.duplicate_count });
  sheetSummary.addRow({ metric: 'Possible Fuzzy Duplicates', value: summary.quality_summary.possible_duplicate_count });
  sheetSummary.addRow({ metric: 'Leads Requiring Human Review', value: summary.qc_summary.flagged_review_count });
  sheetSummary.addRow({ metric: 'Average Relevance Confidence', value: `${avgConfidence}%` });
  sheetSummary.addRow({ metric: 'Average Priority Score', value: `${avgPriority} / 100` });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
