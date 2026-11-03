// src/types/relaymap.ts

export type UserRole = 'CONTRIBUTOR' | 'NEW_OWNER' | 'REVIEWER' | 'ACCESS_OWNER';

export type AppTab = 'overview' | 'vault' | 'ledger' | 'handover';

export type ClaimCategory = 'Decision' | 'Active work' | 'Risk' | 'Next Action';

export type VerificationStatus = 'VERIFIED' | 'IN_PROGRESS' | 'UNVERIFIED';

export type ReviewerState = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AccessScope = 'PUBLIC_TEAM' | 'CORE_LEAD_ONLY' | 'ADMIN_CONFIDENTIAL';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  description: string;
  allowedScopes: AccessScope[];
  allowedTabs: AppTab[];
  defaultTab: AppTab;
}

export interface DocumentSection {
  id: string;
  title: string;
  summary: string;
  locator: string; // e.g., "Pages 1-2" or "Section 2.1"
}

export interface SourceDocument {
  id: string;
  fileName: string;
  fileType: string;
  owner: string;
  uploadedAt: string;
  accessScope: AccessScope;
  rawContent: string;
  fileUrl?: string; // Browser Blob URL to open the actual PDF/file directly
  base64Data?: string;
  mimeType?: string;
  aiSummary?: string; // General summary of entire document (Editable)
  sections?: DocumentSection[]; // Multi-part breakdown with locators (Editable)
}

export interface EvidenceRecord {
  id: string;
  category: ClaimCategory;
  claim: string;
  owner: string;
  sourceId: string;
  sourceName: string;
  locator: string;
  excerpt: string;
  status: VerificationStatus;
  reviewerState: ReviewerState;
  accessScope: AccessScope;
  conflictNote?: string;
}

export const TEAM_USERS: UserProfile[] = [
  {
    id: 'u2',
    name: 'Vihaan Kunder',
    role: 'CONTRIBUTOR',
    title: 'Departing Member (Contributor — Steps 1 to 3 Only)',
    description:
      'Uploads project PDFs/files, generates AI summaries & claims, and edits vague items. Restricted from Final Handover page.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY'],
    allowedTabs: ['overview', 'vault', 'ledger'],
    defaultTab: 'vault',
  },
  {
    id: 'u1',
    name: 'Aurelius Godad',
    role: 'REVIEWER',
    title: 'Project Lead (Reviewer & Approver)',
    description:
      'Reviews and edits AI summaries and claims in the Evidence Ledger, and approves the final handover package for Om.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY', 'ADMIN_CONFIDENTIAL'],
    allowedTabs: ['overview', 'vault', 'ledger', 'handover'],
    defaultTab: 'ledger',
  },
  {
    id: 'u3',
    name: 'Om Gole',
    role: 'NEW_OWNER',
    title: 'Incoming Member (Newcomer — Step 4 Only)',
    description:
      'Strictly restricted to the Final Handover page, and only after Aurelius or Admin approves the handover package.',
    allowedScopes: ['PUBLIC_TEAM'],
    allowedTabs: ['handover'],
    defaultTab: 'handover',
  },
  {
    id: 'u4',
    name: 'Org Admin',
    role: 'ACCESS_OWNER',
    title: 'Organisation Admin (Security & Access Governance)',
    description:
      'Controls confidentiality scopes (PUBLIC_TEAM vs CORE_LEAD_ONLY vs ADMIN_CONFIDENTIAL) to restrict what Om or Vihaan can see.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY', 'ADMIN_CONFIDENTIAL'],
    allowedTabs: ['overview', 'vault', 'ledger', 'handover'],
    defaultTab: 'overview',
  },
];

export const INITIAL_SOURCES: SourceDocument[] = [];
export const INITIAL_EVIDENCE: EvidenceRecord[] = [];