// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { TEAM_USERS, UserProfile } from '@/types/relaymap';
import SourceVault from '@/components/SourceVault';
import EvidenceLedger from '@/components/EvidenceLedger';
import FinalHandover from '@/components/FinalHandover';
import WorkflowGuide from '@/components/WorkflowGuide';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function RelayMapApp() {
  const { currentUser, setCurrentUser, sources, evidence, handoverApproved } = useRelay();
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'ledger' | 'handover'>('overview');

  // 1. IF NOT LOGGED IN: SHOW ROLE LOGIN PAGE
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-900">
        <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Team White Noise • RelayMap MVP
              </span>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                RelayMap: Evidence-First Handover Platform
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Keep the work. Transfer the knowledge. Select a project role to enter the workspace.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Permission-Aware Workspace
            </div>
          </div>

          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Select Your Handover Role to Log In
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEAM_USERS.map((user: UserProfile) => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className="text-left p-5 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/30 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 group-hover:bg-blue-600 group-hover:text-white transition">
                      {user.role.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-3">{user.name}</h3>
                  <p className="text-xs font-medium text-blue-600">{user.title}</p>
                  <p className="text-sm text-slate-600 mt-2">{user.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                  Access Scopes: {user.allowedScopes.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter evidence based on logged-in user's permission scope
  const visibleEvidence = evidence.filter((item) =>
    currentUser.allowedScopes.includes(item.accessScope)
  );

  const verifiedCount = visibleEvidence.filter((e) => e.status === 'VERIFIED').length;
  const inProgressCount = visibleEvidence.filter((e) => e.status === 'IN_PROGRESS').length;
  const unverifiedCount = visibleEvidence.filter((e) => e.status === 'UNVERIFIED').length;

  // 2. LOGGED-IN WORKSPACE SHELL
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-sm">
            RELAYMAP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900">Campus Rover Project</h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  handoverApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {handoverApproved ? 'APPROVED HANDOVER' : 'HANDOVER DRAFT'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              6-Step Evidence-Linked Continuation Workflow
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: '1. Overview' },
            { id: 'vault', label: '2. Source Vault' },
            { id: 'ledger', label: '3. Evidence Ledger' },
            { id: 'handover', label: '4. Final Handover' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Badge & Role Switcher */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
            <p className="text-xs text-blue-600 font-medium">{currentUser.title}</p>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Switch Role / Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* Dynamic Workflow Guide Banner & Next Step Button */}
        <WorkflowGuide activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 6-Step Workflow Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Complete Product Workflow Status
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                {[
                  { step: '01 CONNECT', desc: `${sources.length} Authorised Files`, done: true },
                  { step: '02 EXTRACT', desc: 'Source Locators Kept', done: true },
                  { step: '03 RECONSTRUCT', desc: `${visibleEvidence.length} Claims Mapped`, done: true },
                  { step: '04 VERIFY', desc: `${unverifiedCount} Flagged Gaps`, done: true },
                  { step: '05 REVIEW', desc: 'Human-in-the-Loop', done: handoverApproved },
                  { step: '06 HAND OVER', desc: 'Role-Filtered Plan', done: handoverApproved },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      item.done
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : 'bg-amber-50/50 border-amber-200 text-slate-900'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{item.step}</p>
                    <p className="text-slate-600 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Light Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    COMPLETE / STABLE
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{verifiedCount}</h3>
                  <p className="text-sm text-slate-600">Verified Claims with Citations</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    IN PROGRESS / PENDING
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{inProgressCount}</h3>
                  <p className="text-sm text-slate-600">Active Workstreams Being Transferred</p>
                </div>
                <Clock className="w-10 h-10 text-amber-600" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                    BLOCKED / CRITICAL
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{unverifiedCount}</h3>
                  <p className="text-sm text-slate-600">Unverified Risks & Ownership Gaps</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Recent Evidence Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Active Workstreams & Extracted Memory (Role-Filtered)
                </h2>
                <span className="text-xs text-slate-500">
                  Showing {visibleEvidence.length} of {evidence.length} total records for {currentUser.role}
                </span>
              </div>

              <div className="space-y-3">
                {visibleEvidence.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          {item.category}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Scope: {item.accessScope}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 mt-1">{item.claim}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Owner: {item.owner}</p>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setActiveTab('ledger')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        SOURCE: {item.sourceName} / {item.locator}
                      </button>
                      <p className="text-xs text-slate-400 mt-1">
                        Review State: {item.reviewerState}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOURCE VAULT */}
        {activeTab === 'vault' && <SourceVault />}

        {/* TAB 3: EVIDENCE LEDGER */}
        {activeTab === 'ledger' && <EvidenceLedger />}

        {/* TAB 4: FINAL HANDOVER */}
        {activeTab === 'handover' && <FinalHandover />}
      </main>
    </div>
  );
}