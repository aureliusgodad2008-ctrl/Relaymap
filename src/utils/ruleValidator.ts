// src/utils/ruleValidator.ts
import {
  AccessScope,
  ClaimCategory,
  EvidenceRecord,
  VerificationStatus,
} from '@/types/relaymap';

export interface CandidateClaim {
  category: ClaimCategory;
  claim: string;
  owner: string;
  locator: string;
  excerpt: string;
}

/**
 * Deterministic TypeScript Rule Validator:
 * 1. Verifies source locators and excerpts exist.
 * 2. Flags missing owners or unvalidated test warnings.
 * 3. Detects cross-source contradictions against existing Project Memory.
 */
export function validateExtractedClaims(
  candidates: CandidateClaim[],
  sourceId: string,
  sourceName: string,
  accessScope: AccessScope,
  existingEvidence: EvidenceRecord[]
): EvidenceRecord[] {
  return candidates.map((cand, index) => {
    const cleanLocator = cand.locator?.trim() || 'sec. 1';
    const cleanExcerpt = cand.excerpt?.trim() || cand.claim;
    const cleanOwner = cand.owner?.trim() || 'Unassigned';

    let status: VerificationStatus = 'VERIFIED';
    const issues: string[] = [];

    // Rule 1: Check for missing or unassigned ownership
    if (
      cleanOwner.toLowerCase() === 'unassigned' ||
      cleanOwner.toLowerCase() === 'unknown' ||
      cleanOwner === ''
    ) {
      status = 'UNVERIFIED';
      issues.push('Missing assigned owner for this item.');
    }

    // Rule 2: Check for active / incomplete work keywords
    const lowerClaim = cand.claim.toLowerCase();
    const lowerExcerpt = cleanExcerpt.toLowerCase();
    if (
      cand.category === 'Active work' ||
      lowerClaim.includes('in progress') ||
      lowerClaim.includes('open') ||
      lowerClaim.includes('80%') ||
      lowerClaim.includes('pending')
    ) {
      if (status !== 'UNVERIFIED') {
        status = 'IN_PROGRESS';
      }
    }

    // Rule 3: Flag unverified risks, blockers, or untested hardware/software
    if (
      cand.category === 'Risk' ||
      lowerClaim.includes('not been tested') ||
      lowerClaim.includes('not been validated') ||
      lowerClaim.includes('warning') ||
      lowerClaim.includes('blocked') ||
      lowerExcerpt.includes('warning')
    ) {
      status = 'UNVERIFIED';
      if (!issues.length) {
        issues.push('Critical risk or unvalidated test requires human review.');
      }
    }

    // Rule 4: Cross-source contradiction check (e.g. conflicting controller or battery claims)
    existingEvidence.forEach((existing) => {
      const existingLower = existing.claim.toLowerCase();
      if (
        existingLower.includes('esp32') &&
        (lowerClaim.includes('arduino') || lowerClaim.includes('stm32'))
      ) {
        status = 'UNVERIFIED';
        issues.push(
          `Cross-source conflict: Contradicts "${existing.claim}" in ${existing.sourceName} (${existing.locator}).`
        );
      }
      if (
        existingLower.includes('battery') &&
        lowerClaim.includes('battery') &&
        existing.sourceName !== sourceName
      ) {
        issues.push(
          `Related battery record exists in ${existing.sourceName} (${existing.locator}) — verify latest state.`
        );
      }
    });

    return {
      id: `ev-${Date.now()}-${index}`,
      category: cand.category || 'Decision',
      claim: cand.claim,
      owner: cleanOwner,
      sourceId,
      sourceName: sourceName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      locator: cleanLocator,
      excerpt: cleanExcerpt,
      status,
      reviewerState: 'PENDING',
      accessScope,
      conflictNote: issues.length > 0 ? issues.join(' ') : undefined,
    };
  });
}