// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { AppTab, TEAM_USERS, UserProfile } from '@/types/relaymap';
import SourceVault from '@/components/SourceVault';
import EvidenceLedger from '@/components/EvidenceLedger';
import FinalHandover from '@/components/FinalHandover';
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

const ALL_TABS: { id: AppTab; label: string }[] = [
  { id: 'overview', label: '1. Overview' },
  { id: 'vault', label: '2. Source Vault' },
  { id: 'ledger', label: '3. Evidence Ledger' },
  { id: 'handover', label: '4. Final Handover' },
];

export default function RelayMapApp() {
  const { currentUser, setCurrentUser, sources, evidence, handoverApproved } =
    useRelay();
  const [activeTab, setActiveTab] = useState<AppTab>('overview');

  // Switch user AND automatically reset activeTab to that role's default home page!
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveTab(user.defaultTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('overview');
  };

  // 1. ROLE LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-900">
        <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Team White Noise • RelayMap
              </span>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                RelayMap: Evidence-First Handover Platform
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Strict role-based access control: Select a team member to enter their permitted workspace.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Role-Curtailed Access Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEAM_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="text-left p-5 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/30 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 group-hover:bg-blue-600 group-hover:text-white transition">
                      {user.role.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-3">
                    {user.name}
                  </h3>
                  <p className="text-xs font-bold text-blue-600">{user.title}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {user.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Scopes: {user.allowedScopes.join(', ')}
                  </span>
                  <span className="text-slate-700 font-bold">
                    Pages: {user.allowedTabs.length} / 4
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Enforce strict tab guard: if activeTab is not allowed for currentUser, force their defaultTab
  const safeTab: AppTab = currentUser.allowedTabs.includes(activeTab)
    ? activeTab
    : currentUser.defaultTab;

  const visibleEvidence = evidence.filter((item) =>
    currentUser.allowedScopes.includes(item.accessScope)
  );

  const verifiedCount = visibleEvidence.filter(
    (e) => e.status === 'VERIFIED'
  ).length;
  const inProgressCount = visibleEvidence.filter(
    (e) => e.status === 'IN_PROGRESS'
  ).length;
  const unverifiedCount = visibleEvidence.filter(
    (e) => e.status === 'UNVERIFIED'
  ).length;

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
              <h1 className="font-bold text-slate-900">Project Handover Workspace</h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  handoverApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {handoverApproved ? 'APPROVED FOR OM GOLE' : 'DRAFT MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Logged in as {currentUser.name} ({currentUser.role})
            </p>
          </div>
        </div>

        {/* Role-Restricted Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {ALL_TABS.map((tab) => {
            const isAllowed = currentUser.allowedTabs.includes(tab.id);
            if (!isAllowed) {
              return (
                <span
                  key={tab.id}
                  title={`Restricted for ${currentUser.role}`}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 flex items-center gap-1 cursor-not-allowed select-none"
                >
                  <Lock className="w-3 h-3" />
                  {tab.label}
                </span>
              );
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-bold transition ${
                  safeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Switcher */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
            <p className="text-xs text-blue-600 font-medium">{currentUser.title}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 space-y-6">
        {safeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    VERIFIED
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {verifiedCount}
                  </h3>
                  <p className="text-sm text-slate-600">Verified Claims</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    IN PROGRESS
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {inProgressCount}
                  </h3>
                  <p className="text-sm text-slate-600">Active Workstreams</p>
                </div>
                <Clock className="w-10 h-10 text-amber-600" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                    NEEDS REVIEW
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {unverifiedCount}
                  </h3>
                  <p className="text-sm text-slate-600">Unverified / Flagged</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Uploaded Documents ({sources.length}) & Extracted Claims ({visibleEvidence.length})
              </h2>
              {visibleEvidence.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No claims extracted yet. Go to <strong>2. Source Vault</strong> to upload a PDF and run Gemini 3.5 Flash-Lite.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {visibleEvidence.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs font-bold uppercase text-blue-600">
                          {item.category} • {item.status}
                        </span>
                        <p className="font-bold text-slate-900">{item.claim}</p>
                        <p className="text-xs text-slate-500">
                          Owner: {item.owner} • Scope: {item.accessScope}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ledger')}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {item.sourceName} / {item.locator}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {safeTab === 'vault' && <SourceVault />}
        {safeTab === 'ledger' && <EvidenceLedger />}
        {safeTab === 'handover' && <FinalHandover />}
      </main>
    </div>
  );
}