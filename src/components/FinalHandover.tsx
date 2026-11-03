// src/components/FinalHandover.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Lock,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export default function FinalHandover() {
  const {
    currentUser,
    sources,
    evidence,
    handoverApproved,
    setHandoverApproved,
  } = useRelay();

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  if (!currentUser) return null;

  // Strict Gate: If logged in as Newcomer (Om Gole) and handover is NOT approved yet, lock the screen!
  if (currentUser.role === 'NEW_OWNER' && !handoverApproved) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-2xl mx-auto shadow-sm text-slate-900">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          AWAITING PROJECT LEAD / ADMIN APPROVAL
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">
          Welcome, Om Gole (Incoming New Owner)
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Your handover package is currently being prepared and reviewed by <strong>Aurelius Godad (Project Lead)</strong> and <strong>Org Admin</strong>. You will gain access to this page as soon as they approve the final draft.
        </p>
      </div>
    );
  }

  // Always filter what Om Gole is allowed to see (PUBLIC_TEAM for Om, or full preview for Reviewer/Admin)
  const visibleSources = sources.filter((s) =>
    currentUser.allowedScopes.includes(s.accessScope)
  );
  const visibleEvidence = evidence.filter(
    (item) =>
      currentUser.allowedScopes.includes(item.accessScope) &&
      item.reviewerState !== 'REJECTED'
  );

  const nextActions = visibleEvidence.filter(
    (item) => item.category === 'Next Action'
  );
  const decisions = visibleEvidence.filter(
    (item) => item.category === 'Decision'
  );
  const activeWork = visibleEvidence.filter(
    (item) => item.category === 'Active work'
  );
  const risks = visibleEvidence.filter((item) => item.category === 'Risk');

  const canApprove =
    currentUser.role === 'REVIEWER' || currentUser.role === 'ACCESS_OWNER';

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900">
      {/* Header Banner: Always shows Om Gole as the actual Newcomer! */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                handoverApproved
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {handoverApproved
                ? '✓ OFFICIAL APPROVED HANDOVER FOR OM GOLE'
                : 'PREVIEW MODE — PENDING APPROVAL FOR OM GOLE'}
            </span>
            {currentUser.role !== 'NEW_OWNER' && (
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Previewing as {currentUser.name} ({currentUser.role})
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Final Handover Package for Newcomer: Om Gole
          </h1>
          <p className="text-sm text-slate-600">
             Prepared by Vihaan Kunder (Contributor) • Verified by Aurelius Godad (Project Lead)
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          {canApprove && !handoverApproved && (
            <button
              type="button"
              onClick={() => setHandoverApproved(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Approve & Release to Om Gole
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Export Handover PDF
          </button>
        </div>
      </div>

      {visibleSources.length === 0 && visibleEvidence.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-600">
          No handover documents have been extracted yet.
        </div>
      ) : (
        <>
          {/* SECTION 1: General Summary & Multi-Part Document Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              1. Complete Document Summary & Section-by-Section Breakdown
            </h2>

            {visibleSources.map((src) => (
              <div
                key={src.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600">
                      Source Document ({src.accessScope})
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {src.fileName}
                    </h3>
                  </div>

                  {src.fileUrl && (
                    <a
                      href={src.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 print:hidden"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Original File / PDF
                    </a>
                  )}
                </div>

                {/* General Summary */}
                {src.aiSummary && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                    <span className="text-xs font-bold uppercase text-blue-800 block">
                      General Summary of Entire Document
                    </span>
                    <p className="text-sm text-slate-900 leading-relaxed font-medium">
                      {src.aiSummary}
                    </p>
                  </div>
                )}

                {/* Multi-Part Breakdown */}
                {src.sections && src.sections.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Key Document Parts & Where They Are Taken From:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {src.sections.map((sec, idx) => (
                        <div
                          key={sec.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Part {idx + 1}: {sec.title}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                              {sec.locator}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {sec.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SECTION 2: Priority Next Actions for Om Gole */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              2. Priority Next Actions for Om Gole ({nextActions.length})
            </h2>
            {nextActions.map((item, idx) => {
              const isDone = Boolean(completedTasks[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    setCompletedTasks((p) => ({ ...p, [item.id]: !p[item.id] }))
                  }
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {idx + 1}. {item.claim}
                      </p>
                      <p className="text-xs text-slate-600">Owner: {item.owner}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded shrink-0">
                    {item.sourceName} / {item.locator}
                  </span>
                </div>
              );
            })}
          </div>

          {/* SECTION 3: Decisions & Active Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                3. Verified Decisions ({decisions.length})
              </h2>
              {decisions.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                >
                  <span className="text-xs font-bold text-blue-600">
                    {item.sourceName} / {item.locator}
                  </span>
                  <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                  <p className="text-xs text-slate-600">Owner: {item.owner}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                4. Active Work in Progress ({activeWork.length})
              </h2>
              {activeWork.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                >
                  <span className="text-xs font-bold text-blue-600">
                    {item.sourceName} / {item.locator}
                  </span>
                  <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                  <p className="text-xs text-slate-600">Owner: {item.owner}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Open Risks */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              5. Open Risks & Warnings ({risks.length})
            </h2>
            {risks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.claim}</p>
                  <p className="text-xs text-slate-600">
                    Owner: {item.owner} • Scope: {item.accessScope}
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-2.5 py-1 rounded shrink-0">
                  {item.sourceName} / {item.locator}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}