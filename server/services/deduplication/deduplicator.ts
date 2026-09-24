/**
 * AI Lead Intelligence — Deterministic Deduplication Engine
 * Two-stage deduplication:
 *   Stage 1: High-confidence exact matches (same normalized email or phone).
 *   Stage 2: Possible fuzzy duplicate (high name similarity + supporting match).
 * Preserves original rows; never silently deletes.
 */

import Fuse from 'fuse.js';
import { CleanedLeadRecord } from '../../../src/types/pipeline.ts';

export function deduplicateLeads(leads: CleanedLeadRecord[]): {
  processedLeads: CleanedLeadRecord[];
  exactDuplicateCount: number;
  possibleDuplicateCount: number;
} {
  const emailMap = new Map<string, string>(); // email -> lead_id
  const phoneMap = new Map<string, string>(); // phone -> lead_id
  let exactDuplicateCount = 0;
  let possibleDuplicateCount = 0;

  // First pass: Exact matching on Email & Phone
  for (const lead of leads) {
    const email = lead.contact.email;
    const phone = lead.contact.phone;

    let matchedPrimaryId: string | null = null;
    let matchReason = '';

    if (email && emailMap.has(email)) {
      matchedPrimaryId = emailMap.get(email)!;
      matchReason = `Identical normalized email address (${email})`;
    } else if (phone && phoneMap.has(phone) && !lead.contact.phone_suspicious) {
      matchedPrimaryId = phoneMap.get(phone)!;
      matchReason = `Identical normalized phone number (${phone})`;
    }

    if (matchedPrimaryId && matchedPrimaryId !== lead.lead_id) {
      lead.duplicate_status = 'DUPLICATE';
      lead.duplicate_of_lead_id = matchedPrimaryId;
      lead.duplicate_reason = matchReason;
      exactDuplicateCount++;

      // Merge inquiry context to primary lead to avoid losing complementary notes
      const primaryLead = leads.find((l) => l.lead_id === matchedPrimaryId);
      if (primaryLead && lead.inquiry_text && !primaryLead.inquiry_text.includes(lead.inquiry_text)) {
        primaryLead.inquiry_text = `${primaryLead.inquiry_text} [Additional inquiry from secondary submission: ${lead.inquiry_text}]`;
      }
    } else {
      lead.duplicate_status = 'UNIQUE';
      if (email) emailMap.set(email, lead.lead_id);
      if (phone && !lead.contact.phone_suspicious) phoneMap.set(phone, lead.lead_id);
    }
  }

  // Second pass: Possible fuzzy duplicates for remaining UNIQUE records
  const uniqueLeads = leads.filter((l) => l.duplicate_status === 'UNIQUE');
  const fuse = new Fuse(uniqueLeads, {
    keys: ['name'],
    threshold: 0.25, // High similarity
    includeScore: true,
  });

  for (const lead of uniqueLeads) {
    if (!lead.name || lead.name === 'Unknown Lead') continue;

    const results = fuse.search(lead.name);
    for (const result of results) {
      const candidate = result.item;
      if (candidate.lead_id === lead.lead_id) continue;

      // Check for supporting match (same city/location or similar inquiry length)
      const sameLocation =
        lead.location &&
        candidate.location &&
        lead.location !== 'Unknown / Not Disclosed' &&
        lead.location.toLowerCase() === candidate.location.toLowerCase();

      const nameScore = result.score !== undefined ? 1 - result.score : 0.8;

      if (nameScore >= 0.8 && sameLocation) {
        lead.duplicate_status = 'POSSIBLE_DUPLICATE';
        lead.duplicate_of_lead_id = candidate.lead_id;
        lead.duplicate_reason = `Fuzzy name similarity (${Math.round(nameScore * 100)}%) with identical location (${lead.location}). Flagged for manual review.`;
        lead.fuzzy_similarity_score = nameScore;
        possibleDuplicateCount++;
        break;
      }
    }
  }

  return {
    processedLeads: leads,
    exactDuplicateCount,
    possibleDuplicateCount,
  };
}
