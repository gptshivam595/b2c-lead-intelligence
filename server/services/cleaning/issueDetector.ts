/**
 * AI Lead Intelligence — Data Issue Detector & Quality Scorer
 * Deterministically audits raw vs normalized data, flags issues with severity,
 * and computes a normalized Data Quality Score (0-100) kept strictly independent from lead commercial priority.
 */

import { CleanedLeadRecord, DataIssue } from '../../../src/types/pipeline.ts';
import { normalizeName, normalizeEmail, normalizePhone, normalizeWhitespace } from './normalizer.ts';
import { MappedRow } from '../ingestion/schemaDetector.ts';

export function cleanAndAuditLead(
  row: MappedRow,
  rowIndex: number,
  leadId: string
): CleanedLeadRecord {
  const issues: DataIssue[] = [];

  // 1. Audit & Normalize Name
  const rawName = row.name || '';
  const normalizedName = normalizeName(rawName);
  if (!rawName.trim()) {
    issues.push({
      lead_id: leadId,
      field: 'name',
      issue_type: 'missing_required',
      severity: 'high',
      explanation: 'Name field is empty or missing in raw source row.',
      action_taken: 'Tagged as missing name; defaulted to "Unknown Lead".',
      original_value: rawName,
    });
  } else if (rawName !== normalizedName) {
    issues.push({
      lead_id: leadId,
      field: 'name',
      issue_type: 'normalization_applied',
      severity: 'low',
      explanation: 'Casing and extraneous whitespace were cleaned and normalized to Title Case.',
      action_taken: 'Normalized whitespace and casing.',
      original_value: rawName,
    });
  }

  // 2. Audit & Normalize Email
  const rawEmail = row.email || '';
  const emailNorm = normalizeEmail(rawEmail);
  if (!rawEmail.trim()) {
    issues.push({
      lead_id: leadId,
      field: 'email',
      issue_type: 'missing_required',
      severity: 'medium',
      explanation: 'Email address is missing.',
      action_taken: 'Retained as null; relied on alternative contact channels.',
      original_value: rawEmail,
    });
  } else if (!emailNorm.isValid) {
    issues.push({
      lead_id: leadId,
      field: 'email',
      issue_type: 'invalid_format',
      severity: 'high',
      explanation: `Email address "${rawEmail}" does not satisfy RFC-5322 syntax.`,
      action_taken: 'Flagged as invalid email.',
      original_value: rawEmail,
    });
  } else if (emailNorm.correctionApplied) {
    issues.push({
      lead_id: leadId,
      field: 'email',
      issue_type: 'normalization_applied',
      severity: 'low',
      explanation: `Typo domain in email was corrected to standard provider domain.`,
      action_taken: `Corrected domain to ${emailNorm.normalized}.`,
      original_value: rawEmail,
    });
  }

  // 3. Audit & Normalize Phone
  const rawPhone = row.phone || '';
  const phoneNorm = normalizePhone(rawPhone);
  if (!rawPhone.trim()) {
    issues.push({
      lead_id: leadId,
      field: 'phone',
      issue_type: 'missing_required',
      severity: 'medium',
      explanation: 'Phone number is missing.',
      action_taken: 'Retained as null; cannot initiate phone/WhatsApp outreach.',
      original_value: rawPhone,
    });
  } else if (phoneNorm.isSuspicious) {
    issues.push({
      lead_id: leadId,
      field: 'phone',
      issue_type: 'suspicious_phone',
      severity: 'high',
      explanation: `Phone number "${rawPhone}" contains repeating or dummy digit sequence.`,
      action_taken: 'Flagged as suspicious phone; marked invalid for automated SMS/call.',
      original_value: rawPhone,
    });
  } else if (!phoneNorm.isValid) {
    issues.push({
      lead_id: leadId,
      field: 'phone',
      issue_type: 'invalid_format',
      severity: 'medium',
      explanation: `Phone digit length (${phoneNorm.digitsOnly.length}) is outside expected ITU standards.`,
      action_taken: 'Flagged as invalid phone format.',
      original_value: rawPhone,
    });
  }

  // 4. Audit Location
  const rawLocation = row.location || '';
  const normalizedLocation = normalizeWhitespace(rawLocation);
  if (!rawLocation.trim()) {
    issues.push({
      lead_id: leadId,
      field: 'location',
      issue_type: 'missing_required',
      severity: 'low',
      explanation: 'Geographic location or city is not specified.',
      action_taken: 'Marked location as "Unknown / Not Disclosed".',
      original_value: rawLocation,
    });
  }

  // 5. Audit Inquiry / Conversation
  const rawInquiry = row.inquiry_text || '';
  const normalizedInquiry = normalizeWhitespace(rawInquiry);
  if (!rawInquiry.trim()) {
    issues.push({
      lead_id: leadId,
      field: 'inquiry_text',
      issue_type: 'missing_required',
      severity: 'medium',
      explanation: 'No inquiry text, query notes, or chat history provided.',
      action_taken: 'Marked inquiry text as empty; AI must rely on profile or attributes.',
      original_value: rawInquiry,
    });
  }

  // 6. Calculate Data Quality Score (0 - 100)
  // Baseline: 100
  // High severity penalty: -25
  // Medium severity penalty: -15
  // Low severity penalty: -5
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'high') score -= 25;
    else if (issue.severity === 'medium') score -= 15;
    else if (issue.severity === 'low') score -= 5;
  }
  const data_quality_score = Math.max(0, Math.min(100, score));

  return {
    lead_id: leadId,
    row_index: rowIndex,
    name: normalizedName || 'Unknown Lead',
    raw_name: rawName,
    contact: {
      phone: phoneNorm.normalized,
      raw_phone: rawPhone,
      phone_valid: phoneNorm.isValid,
      phone_suspicious: phoneNorm.isSuspicious,
      email: emailNorm.normalized,
      raw_email: rawEmail,
      email_valid: emailNorm.isValid,
    },
    location: normalizedLocation || 'Unknown / Not Disclosed',
    raw_location: rawLocation,
    source: row.source || 'Direct Inbound',
    inquiry_text: normalizedInquiry,
    raw_inquiry: rawInquiry,
    custom_attributes: row.custom_attributes,
    data_issues: issues,
    duplicate_status: 'UNIQUE',
    data_quality_score,
    raw_source: row.raw_source,
  };
}
