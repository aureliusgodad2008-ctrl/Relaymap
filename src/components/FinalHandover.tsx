// src/components/FinalHandover.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { EvidenceRecord } from '@/types/relaymap';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  Lock,
  CheckSquare,
  Square,
  ExternalLink,
  X,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export default function FinalHandover() {
  const {
    currentUser,
    evidence,
    handoverApproved,
    setHandoverApproved,
  } = useRelay();

  // Interactive Next Actions completion state
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  // Handover recipient acknowledgement state
  const [acknowledged, setAcknowledged] = useState(false);
  // Active citation modal state for clickable sources
  const [inspectedClaim, setInspectedClaim] = useState<EvidenceRecord | null>(null);

  if (!currentUser) return null;

  // 1. Least-Privilege Role Filter: Only show claims allowed for the user's scopes
  const rolePermittedEvidence = evidence.filter((item) =>
    currentUser.allowedScopes.includes(item.accessScope)
  );

  const restrictedHiddenCount = evidence.length - rolePermittedEvidence.length;

  // 2. Exclude rejected findings from the final continuation package
  const handoverItems = rolePermittedEvidence.filter(
    (item) => item.reviewerState !== 'REJECTED'
  );

  const decisions = handoverItems.filter((item) => item.category === 'Decision');
  const activeWork = handoverItems.filter((item) => item.category === 'Active work');
  const risks = handoverItems.filter(
    (item) => item.category === 'Risk' || item.status === 'UNVERIFIED'
  );

  // Build prioritized Next Actions list from Campus Rover baseline + extracted Next Actions
  const dynamicNextActions = [
    {
      id: 'na-1',
      task: 'Run and record a full field battery runtime test',
      owner: 'Incoming Firmware / Hardware Owner',
      source: 'Test Log / latest entry',
      scope: 'CORE_LEAD_ONLY',
    },
    {
      id: 'na-2',
      task: 'Confirm final chassis dimensions with mechanical lead',
      owner: 'Mechanical Lead',
      source: 'Design Notes / p. 3',
      scope: 'PUBLIC_TEAM',
    },
    {
      id: 'na-3',
      task: 'Review ESP32 telemetry packet schema v2 integration status',
      owner: 'Firmware Lead',
      source: 'Task Board / item 14',
      scope: 'PUBLIC_TEAM',
    },
    ...handoverItems
      .filter((item) => item.category === 'Next Action')
      .map((item) => ({
        id: item.id,
        task: item.claim,
        owner: item.owner,
        source: `${item.sourceName} / ${item.locator}`,
        scope: item.accessScope,
      })),
  ].filter((action) =>
    currentUser.allowedScopes.includes(action.scope as any)
  );

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // IF HANDOVER IS NOT YET APPROVED BY REVIEWER: Enforce Human-in-the-Loop Gate
  if (!handoverApproved) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto shadow-sm text-slate-900">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          HUMAN CONTROL GATE ACTIVE
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">
          Handover Package Remains a Draft
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          RelayMap never publishes an unreviewed AI summary directly. An authorised Reviewer must verify the Evidence Ledger and approve the final continuation package first.
        </p>

        {currentUser.role === 'REVIEWER' || currentUser.role === 'ACCESS_OWNER' ? (
          <button
            type="button"
            onClick={() => setHandoverApproved(true)}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl inline-flex items-center gap-2 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Approve & Unlock Final Handover Now
          </button>
        ) : (
          <div className="mt-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            Switch to <strong>Aurelius Godad (Project Lead / Reviewer)</strong> to approve and unlock this handover.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
      {/* Top Action & Role-Permission Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                STEP 06 • HUMAN-APPROVED CONTINUATION PLAN
              </span>
              {acknowledged && (
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  ACKNOWLEDGED BY {currentUser.name.toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Campus Rover Project — Role-Filtered Handover Package
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Every claim below is backed by a clickable source locator and filtered for your role permissions.
            </p>
          </div>

          {/* Export PDF & Acknowledge Buttons (Hidden during print) */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              type="button"
              onClick={() => setAcknowledged(!acknowledged)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                acknowledged
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {acknowledged ? 'Handover Acknowledged' : 'Acknowledge Receipt'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Export Handover PDF
            </button>
          </div>
        </div>

        {/* Recipient & Least-Privilege Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase block">
              Active Recipient View
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {currentUser.name} ({currentUser.role.replace('_', ' ')})
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase block">
              Permitted Access Scopes
            </span>
            <span className="text-sm font-bold text-blue-600 mt-0.5 block">
              {currentUser.allowedScopes.join(', ')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase block">
              Permission Gate Status
            </span>
            {restrictedHiddenCount > 0 ? (
              <span className="text-xs font-bold text-amber-800 mt-0.5 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                {restrictedHiddenCount} confidential record(s) filtered out
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Full workspace visibility granted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Prioritized Next Actions for Incoming Owner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase text-blue-600">
              Immediate Onboarding Checklist
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Priority Next Actions ({dynamicNextActions.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 print:hidden">
            Click any task to mark complete during onboarding
          </span>
        </div>

        <div className="space-y-2.5">
          {dynamicNextActions.map((item, idx) => {
            const isDone = Boolean(completedTasks[item.id]);
            return (
              <div
                key={item.id}
                onClick={() => toggleTask(item.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 hover:bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 text-blue-600 shrink-0"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isDone
                          ? 'line-through text-slate-500'
                          : 'text-slate-900'
                      }`}
                    >
                      {idx + 1}. {item.task}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Owner: <strong className="text-slate-800">{item.owner}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    SOURCE: {item.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 3-Column / Grid Continuation Cards (Decisions, Active Work, Risks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Decisions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Verified Decisions ({decisions.length})
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              STABLE
            </span>
          </div>

          <div className="space-y-3">
            {decisions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedClaim(item)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    SOURCE: {item.sourceName} / {item.locator}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                <p className="text-xs text-slate-600">Owner: {item.owner}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Workstreams */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Active Work in Progress ({activeWork.length})
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              IN PROGRESS
            </span>
          </div>

          <div className="space-y-3">
            {activeWork.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {item.status.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedClaim(item)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    SOURCE: {item.sourceName} / {item.locator}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                <p className="text-xs text-slate-600">Owner: {item.owner}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Open Risks & Flagged Gaps */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Open Risks & Unresolved Items ({risks.length})
            </h2>
            <p className="text-xs text-slate-500">
              Visible only to roles authorised for each risk&apos;s security scope
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-100 text-red-800">
            ATTENTION REQUIRED
          </span>
        </div>

        {risks.length === 0 ? (
          <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
            No open risks visible for your current permission scope ({currentUser.allowedScopes.join(', ')}).
          </p>
        ) : (
          <div className="space-y-3">
            {risks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {item.status}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Scope: {item.accessScope}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                  <p className="text-xs text-slate-700">Owner: {item.owner}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedClaim(item)}
                  className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  SOURCE: {item.sourceName} / {item.locator}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clickable Source Excerpt Modal */}
      {inspectedClaim && (
        <div
          onClick={() => setInspectedClaim(null)}
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600">
                  Verified Source Citation
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {inspectedClaim.sourceName} ({inspectedClaim.locator})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedClaim(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Handover Claim
              </span>
              <p className="text-sm font-bold text-slate-900">
                {inspectedClaim.claim}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Exact Supporting Excerpt from Document
              </span>
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono text-slate-900">
                &ldquo;{inspectedClaim.excerpt}&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span>Owner: {inspectedClaim.owner}</span>
              <span>Reviewer Decision: {inspectedClaim.reviewerState}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}