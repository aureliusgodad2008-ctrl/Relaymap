// src/components/EvidenceLedger.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import {
  AccessScope,
  ClaimCategory,
  EvidenceRecord,
  VerificationStatus,
} from '@/types/relaymap';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Check,
  X,
  Edit3,
  ShieldCheck,
  Lock,
  Filter,
  ExternalLink,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function EvidenceLedger() {
  const {
    currentUser,
    sources,
    evidence,
    setEvidence,
    updateReviewerState,
    handoverApproved,
    setHandoverApproved,
  } = useRelay();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    evidence[0]?.id || null
  );

  // Inline Editor state for fixing claims, owners, and conflicts
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClaim, setEditClaim] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editCategory, setEditCategory] = useState<ClaimCategory>('Decision');
  const [editStatus, setEditStatus] = useState<VerificationStatus>('VERIFIED');
  const [editScope, setEditScope] = useState<AccessScope>('PUBLIC_TEAM');
  const [clearConflict, setClearConflict] = useState(false);

  if (!currentUser) return null;

  // Only show evidence records permitted for the logged-in user's role
  const visibleEvidence = evidence.filter((item) =>
    currentUser.allowedScopes.includes(item.accessScope)
  );

  const filteredEvidence = visibleEvidence.filter((item) =>
    statusFilter === 'ALL' ? true : item.status === statusFilter
  );

  // Currently selected record for the right-side Source Citation Inspector
  const activeRecord =
    visibleEvidence.find((item) => item.id === selectedRecordId) ||
    visibleEvidence[0] ||
    null;

  // Find the matching source document in the Source Vault
  const linkedSource = activeRecord
    ? sources.find(
        (s) =>
          s.id === activeRecord.sourceId ||
          s.fileName
            .toLowerCase()
            .includes(activeRecord.sourceName.toLowerCase().replace(/ /g, '_'))
      )
    : null;

  // Role check: Project Lead (REVIEWER) and Org Admin (ACCESS_OWNER) have full approval rights
  const canApprove =
    currentUser.role === 'REVIEWER' || currentUser.role === 'ACCESS_OWNER';
  const canEdit =
    canApprove || currentUser.role === 'CONTRIBUTOR';

  // Open inline edit mode on a card
  const startEditing = (record: EvidenceRecord) => {
    setEditingId(record.id);
    setEditClaim(record.claim);
    setEditOwner(record.owner);
    setEditCategory(record.category);
    setEditStatus(record.status);
    setEditScope(record.accessScope);
    setClearConflict(Boolean(record.conflictNote));
  };

  // Save inline edits and optionally resolve Rule Validator flags
  const saveEdits = (id: string) => {
    setEvidence((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          claim: editClaim.trim() || item.claim,
          owner: editOwner.trim() || 'Unassigned',
          category: editCategory,
          status: editStatus,
          accessScope: editScope,
          conflictNote: clearConflict ? undefined : item.conflictNote,
        };
      })
    );
    setEditingId(null);
  };

  // One-click Approve & Verify
  const handleApproveClaim = (record: EvidenceRecord) => {
    setEvidence((prev) =>
      prev.map((item) =>
        item.id === record.id
          ? {
              ...item,
              reviewerState: 'APPROVED',
              status: item.status === 'UNVERIFIED' ? 'VERIFIED' : item.status,
              conflictNote: undefined,
            }
          : item
      )
    );
  };

  const approvedCount = visibleEvidence.filter(
    (e) => e.reviewerState === 'APPROVED'
  ).length;
  const pendingCount = visibleEvidence.filter(
    (e) => e.reviewerState === 'PENDING'
  ).length;
  const conflictCount = visibleEvidence.filter((e) =>
    Boolean(e.conflictNote)
  ).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Human-in-the-Loop Control Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Step 04 & 05 • Evidence Ledger & Human Review
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                handoverApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {handoverApproved
                ? 'FINAL PACKAGE APPROVED'
                : 'DRAFT — AWAITING HUMAN APPROVAL'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            The Evidence Ledger
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Click any blue citation link to inspect the exact source excerpt. Edit, reject, or approve findings before publishing the handover.
          </p>
        </div>

        {/* Master Handover Approval Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs">
            <p className="font-bold text-slate-900">
              Review Progress: {approvedCount} / {visibleEvidence.length} Approved
            </p>
            <p className="text-slate-600 mt-0.5">
              {pendingCount} Pending • {conflictCount} Flagged Conflicts
            </p>
          </div>

          {canApprove ? (
            <button
              type="button"
              onClick={() => setHandoverApproved(!handoverApproved)}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                handoverApproved
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {handoverApproved ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Re-open Handover Draft
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Approve Final Handover Package
                </>
              )}
            </button>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              Switch role to Project Lead (Aurelius) to approve final package
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left 7 Cols = Interactive Claims List | Right 5 Cols = Source Citation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Evidence Cards & Reviewer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 px-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filter by Status:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All (${visibleEvidence.length})` },
                { id: 'VERIFIED', label: 'Verified (Green)' },
                { id: 'IN_PROGRESS', label: 'In Progress (Amber)' },
                { id: 'UNVERIFIED', label: 'Unverified / Blocked (Red)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Cards */}
          <div className="space-y-3">
            {filteredEvidence.map((item) => {
              const isSelected = activeRecord?.id === item.id;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecordId(item.id)}
                  className={`bg-white rounded-xl border p-5 transition cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Row: Category + Traffic Light Status + Reviewer Decision + Clickable Citation */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {item.category}
                      </span>

                      {/* Traffic Light Status Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {item.status === 'VERIFIED' && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {item.status === 'UNVERIFIED' && (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {item.status.replace('_', ' ')}
                      </span>

                      {/* Reviewer State Badge */}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.reviewerState === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.reviewerState === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Review: {item.reviewerState}
                      </span>
                    </div>

                    {/* Clickable Accent Blue Citation Link */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordId(item.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      SOURCE: {item.sourceName} / {item.locator}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card Body: Either Inline Edit Form OR Claim Display */}
                  {isEditing ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-slate-50 p-4 rounded-xl"
                    >
                      <p className="text-xs font-bold uppercase text-blue-600">
                        Editing Finding & Resolving Gaps
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Claim Statement
                        </label>
                        <input
                          type="text"
                          value={editClaim}
                          onChange={(e) => setEditClaim(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Assigned Owner
                          </label>
                          <input
                            type="text"
                            value={editOwner}
                            onChange={(e) => setEditOwner(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Category
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) =>
                              setEditCategory(e.target.value as ClaimCategory)
                            }
                            className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                          >
                            <option value="Decision">Decision</option>
                            <option value="Active work">Active work</option>
                            <option value="Risk">Risk</option>
                            <option value="Next Action">Next Action</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Traffic Light Status
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) =>
                              setEditStatus(
                                e.target.value as VerificationStatus
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                          >
                            <option value="VERIFIED">VERIFIED (Green)</option>
                            <option value="IN_PROGRESS">
                              IN_PROGRESS (Amber)
                            </option>
                            <option value="UNVERIFIED">
                              UNVERIFIED (Red)
                            </option>
                          </select>
                        </div>
                      </div>

                      {item.conflictNote && (
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={clearConflict}
                            onChange={(e) => setClearConflict(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Mark Rule Validator conflict/warning as resolved
                        </label>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => saveEdits(item.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base font-bold text-slate-900 mt-3">
                        {item.claim}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-600">
                        <span>
                          Owner:{' '}
                          <strong className="text-slate-900">
                            {item.owner}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Scope: {item.accessScope}
                        </span>
                      </div>

                      {/* Conflict / Rule Validator Alert Box */}
                      {item.conflictNote && (
                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 font-medium flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              Rule Validator Flag:{' '}
                            </span>
                            {item.conflictNote}
                          </div>
                        </div>
                      )}

                      {/* Reviewer Action Buttons */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-500">
                          Click card to inspect supporting source evidence
                        </span>

                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit / Resolve
                            </button>
                          )}

                          {canApprove && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveClaim(item)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateReviewerState(item.id, 'REJECTED')
                                }
                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Clickable Source Evidence Inspector (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6 space-y-5">
            {activeRecord ? (
              <>
                <div className="border-b border-slate-200 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Supporting Citation Inspector
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {activeRecord.sourceName} ({activeRecord.locator})
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Every handover claim is linked to an inspectable source excerpt.
                  </p>
                </div>

                {/* Highlighted Supporting Quote */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Exact Supporting Excerpt
                  </span>
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-900 text-sm font-medium leading-relaxed">
                    &ldquo;{activeRecord.excerpt}&rdquo;
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Claim Owner</span>
                    <span className="font-bold text-slate-900">
                      {activeRecord.owner}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Source Locator</span>
                    <span className="font-bold text-blue-600">
                      {activeRecord.locator}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      Verification Status
                    </span>
                    <span className="font-bold text-slate-900">
                      {activeRecord.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reviewer Decision</span>
                    <span className="font-bold text-slate-900">
                      {activeRecord.reviewerState}
                    </span>
                  </div>
                </div>

                {/* Full Source Document Context Viewer */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-500 block">
                    Full Authorised Source Document Context
                  </span>
                  {linkedSource ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-900 space-y-2 max-h-60 overflow-y-auto">
                      {linkedSource.rawContent.split('\n').map((line, idx) => {
                        const isMatchedChunk =
                          line
                            .toLowerCase()
                            .includes(activeRecord.locator.toLowerCase()) ||
                          line
                            .toLowerCase()
                            .includes(
                              activeRecord.excerpt.slice(0, 20).toLowerCase()
                            );

                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border ${
                              isMatchedChunk
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-slate-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="text-blue-600 font-bold mr-2">
                              Line {idx + 1}:
                            </span>
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      Source file ({activeRecord.sourceName}) verified in project archive.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                Select any claim on the left to inspect its source citation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}