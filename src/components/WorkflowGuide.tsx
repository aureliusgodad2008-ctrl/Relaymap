// src/components/WorkflowGuide.tsx
'use client';

import React from 'react';
import { useRelay } from '@/context/RelayContext';
import { UserRole } from '@/types/relaymap';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, FileUp, ClipboardCheck, BookOpen } from 'lucide-react';

interface WorkflowGuideProps {
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'vault' | 'ledger' | 'handover') => void;
}

export default function WorkflowGuide({ activeTab, setActiveTab }: WorkflowGuideProps) {
  const { currentUser, handoverApproved } = useRelay();

  if (!currentUser) return null;

  // Role-specific guidance messaging
  const getRoleGuidance = (role: UserRole) => {
    switch (role) {
      case 'CONTRIBUTOR': // Vihaan
        return {
          title: "You are Vihaan (Departing Contributor)",
          action: "Your goal: Upload your scattered project notes, CSV task boards, and design files into the Source Vault (Tab 2) so your knowledge isn't lost upon exit.",
          tabTip: "Go to Source Vault (Tab 2) to upload files or load the demo handover file, then run AI extraction."
        };
      case 'REVIEWER': // Aurelius
        return {
          title: "You are Aurelius (Project Lead & Reviewer)",
          action: "Your goal: Verify what the AI extracted against real document quotes in the Evidence Ledger (Tab 3), resolve any rule flags, and approve the final handover package.",
          tabTip: "Go to Evidence Ledger (Tab 3) to review extracted claims and click 'Approve Final Handover Package'."
        };
      case 'NEW_OWNER': // Om
        return {
          title: "You are Om (Incoming New Owner)",
          action: "Your goal: Receive a verified, role-filtered continuation plan on the Final Handover tab (Tab 4) with zero guesswork and clear first-week onboarding tasks.",
          tabTip: "Go to Final Handover (Tab 4) to check off onboarding to-do items and export your continuation PDF."
        };
      case 'ACCESS_OWNER': // Org Admin
        return {
          title: "You are Org Admin (Access & Security Owner)",
          action: "Your goal: Ensure least-privilege security scopes are enforced so confidential project information is shared only with authorised roles.",
          tabTip: "Check permissions across the Source Vault and Evidence Ledger to ensure role-based filtering is active."
        };
    }
  };

  const guidance = getRoleGuidance(currentUser.role);

  // Tab flow sequence
  const tabs = ['overview', 'vault', 'ledger', 'handover'] as const;
  const currentIndex = tabs.indexOf(activeTab as any);
  const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;

  const getTabLabel = (t: string) => {
    switch(t) {
      case 'overview': return '1. Overview';
      case 'vault': return '2. Source Vault';
      case 'ledger': return '3. Evidence Ledger';
      case 'handover': return '4. Final Handover';
      default: return t;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic "Who You Are & What To Do Next" Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/30 border border-blue-400/30 text-blue-400 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                {currentUser.role.replace('_', ' ')} WORKSPACE
              </span>
              <span className="text-xs text-slate-300">• Logged in as {currentUser.name}</span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white">{guidance.title}</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {guidance.action} <strong className="text-blue-300">{guidance.tabTip}</strong>
            </p>
          </div>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-lg p-3 text-xs text-right shrink-0">
          <span className="text-slate-300 block">Handover State:</span>
          <span className={`font-bold ${handoverApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
            {handoverApproved ? '✓ Approved & Unlocked' : '⏳ Pending Review'}
          </span>
        </div>
      </div>

      {/* Bottom "Next Step →" Navigation Bar for Smooth Flow */}
      {nextTab && (
        <div className="flex justify-end pt-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab(nextTab)}
            className="group bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <span>Next Step: Go to {getTabLabel(nextTab)}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}