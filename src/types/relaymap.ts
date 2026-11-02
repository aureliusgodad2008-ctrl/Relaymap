// src/types/relaymap.ts

export type UserRole = 'CONTRIBUTOR' | 'NEW_OWNER' | 'REVIEWER' | 'ACCESS_OWNER';

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
}

export interface SourceDocument {
  id: string;
  fileName: string;
  fileType: string;
  owner: string;
  uploadedAt: string;
  accessScope: AccessScope;
  rawContent: string;
}

export interface EvidenceRecord {
  id: string;
  category: ClaimCategory;
  claim: string;
  owner: string;
  sourceId: string;
  sourceName: string;
  locator: string; // e.g., "p. 3" or "item 14"
  excerpt: string;
  status: VerificationStatus;
  reviewerState: ReviewerState;
  accessScope: AccessScope;
  conflictNote?: string;
}

export const TEAM_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Aurelius Godad',
    role: 'REVIEWER',
    title: 'Project Lead (Reviewer)',
    description: 'Reviews ownership gaps, conflicting facts, and approves the final handover.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY', 'ADMIN_CONFIDENTIAL'],
  },
  {
    id: 'u2',
    name: 'Vihaan Kunder',
    role: 'CONTRIBUTOR',
    title: 'Departing Member (Contributor)',
    description: 'Uploads authorised files and transfers decisions, tasks, and context before exit.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY'],
  },
  {
    id: 'u3',
    name: 'Om Gole',
    role: 'NEW_OWNER',
    title: 'Incoming Member (New Owner)',
    description: 'Receives the approved, role-filtered continuation plan and next actions.',
    allowedScopes: ['PUBLIC_TEAM'],
  },
  {
    id: 'u4',
    name: 'Org Admin',
    role: 'ACCESS_OWNER',
    title: 'Organisation Admin (Access Owner)',
    description: 'Enforces access scopes so confidential material is shared only with authorised roles.',
    allowedScopes: ['PUBLIC_TEAM', 'CORE_LEAD_ONLY', 'ADMIN_CONFIDENTIAL'],
  },
];

export const INITIAL_SOURCES: SourceDocument[] = [
  {
    id: 'src-1',
    fileName: 'Design_Notes.pdf',
    fileType: 'PDF',
    owner: 'Vihaan Kunder',
    uploadedAt: '2026-10-28',
    accessScope: 'PUBLIC_TEAM',
    rawContent:
      '[Page 3] Controller Trade-off Study: After testing Arduino Mega and ESP32, the prototype controller selected is ESP32 due to built-in Wi-Fi/BLE telemetry support.Final chassis dimensions still require confirmation with mechanical lead.',
  },
  {
    id: 'src-2',
    fileName: 'Task_Board_Export.csv',
    fileType: 'CSV',
    owner: 'Vihaan Kunder',
    uploadedAt: '2026-10-30',
    accessScope: 'PUBLIC_TEAM',
    rawContent:
      'Item 14,Telemetry integration,IN_PROGRESS,Owner: Firmware lead,Blocked on packet schema v2.\nItem 18,Confirm final chassis dimensions,OPEN,Owner: Mechanical lead.',
  },
  {
    id: 'src-3',
    fileName: 'Test_Log_Latest.md',
    fileType: 'MARKDOWN',
    owner: 'Aurelius Godad',
    uploadedAt: '2026-11-01',
    accessScope: 'CORE_LEAD_ONLY',
    rawContent:
      '## Latest Entry\nBench test completed at 40% load. WARNING: Battery runtime has not been validated in a full field test. Must run and record a full battery test before deployment.',
  },
];

export const INITIAL_EVIDENCE: EvidenceRecord[] = [
  {
    id: 'ev-1',
    category: 'Decision',
    claim: 'Prototype controller selected: ESP32.',
    owner: 'Hardware Team',
    sourceId: 'src-1',
    sourceName: 'Design Notes',
    locator: 'p. 3',
    excerpt: 'After testing Arduino Mega and ESP32, the prototype controller selected is ESP32 due to built-in Wi-Fi/BLE telemetry support.',
    status: 'VERIFIED',
    reviewerState: 'APPROVED',
    accessScope: 'PUBLIC_TEAM',
  },
  {
    id: 'ev-2',
    category: 'Active work',
    claim: 'Telemetry integration is still open. Owner: Firmware lead.',
    owner: 'Firmware lead',
    sourceId: 'src-2',
    sourceName: 'Task Board',
    locator: 'item 14',
    excerpt: 'Item 14,Telemetry integration,IN_PROGRESS,Owner: Firmware lead,Blocked on packet schema v2.',
    status: 'IN_PROGRESS',
    reviewerState: 'PENDING',
    accessScope: 'PUBLIC_TEAM',
  },
  {
    id: 'ev-3',
    category: 'Risk',
    claim: 'Battery runtime has not been validated in a full test.',
    owner: 'Unassigned',
    sourceId: 'src-3',
    sourceName: 'Test Log',
    locator: 'latest entry',
    excerpt: 'WARNING: Battery runtime has not been validated in a full field test. Must run and record a full battery test before deployment.',
    status: 'UNVERIFIED',
    reviewerState: 'PENDING',
    accessScope: 'CORE_LEAD_ONLY',
    conflictNote: 'Missing assigned owner for critical pre-deployment test.',
  },
];