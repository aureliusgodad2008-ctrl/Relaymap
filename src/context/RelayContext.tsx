// src/context/RelayContext.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  UserProfile,
  SourceDocument,
  DocumentSection,
  EvidenceRecord,
  INITIAL_SOURCES,
  INITIAL_EVIDENCE,
  ReviewerState,
  AccessScope,
} from '@/types/relaymap';

interface RelayContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  sources: SourceDocument[];
  addSource: (source: SourceDocument) => void;
  updateSourceAnalysis: (
    sourceId: string,
    aiSummary: string,
    sections: DocumentSection[]
  ) => void;
  updateSourceScope: (sourceId: string, accessScope: AccessScope) => void;
  deleteSource: (sourceId: string) => void;
  evidence: EvidenceRecord[];
  setEvidence: React.Dispatch<React.SetStateAction<EvidenceRecord[]>>;
  updateEvidenceScope: (id: string, accessScope: AccessScope) => void;
  deleteEvidence: (id: string) => void;
  updateReviewerState: (id: string, state: ReviewerState) => void;
  handoverApproved: boolean;
  setHandoverApproved: (approved: boolean) => void;
  clearWorkspace: () => void;
}

const RelayContext = createContext<RelayContextType | undefined>(undefined);

export function RelayProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sources, setSources] = useState<SourceDocument[]>(INITIAL_SOURCES);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE);
  const [handoverApproved, setHandoverApproved] = useState<boolean>(false);

  const addSource = (newSource: SourceDocument) => {
    setSources((prev) => [newSource, ...prev]);
  };

  const updateSourceAnalysis = (
    sourceId: string,
    aiSummary: string,
    sections: DocumentSection[]
  ) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === sourceId ? { ...s, aiSummary, sections } : s
      )
    );
  };

  // Admin Power: Change a document's security scope and cascade to its claims
  const updateSourceScope = (sourceId: string, accessScope: AccessScope) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, accessScope } : s))
    );
    setEvidence((prev) =>
      prev.map((e) => (e.sourceId === sourceId ? { ...e, accessScope } : e))
    );
  };

  // Admin Power: Change an individual claim's security scope
  const updateEvidenceScope = (id: string, accessScope: AccessScope) => {
    setEvidence((prev) =>
      prev.map((e) => (e.id === id ? { ...e, accessScope } : e))
    );
  };

  const deleteSource = (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    setEvidence((prev) => prev.filter((e) => e.sourceId !== sourceId));
  };

  const deleteEvidence = (id: string) => {
    setEvidence((prev) => prev.filter((e) => e.id !== id));
  };

  const updateReviewerState = (id: string, reviewerState: ReviewerState) => {
    setEvidence((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reviewerState } : item))
    );
  };

  const clearWorkspace = () => {
    setSources([]);
    setEvidence([]);
    setHandoverApproved(false);
  };

  return (
    <RelayContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        sources,
        addSource,
        updateSourceAnalysis,
        updateSourceScope,
        deleteSource,
        evidence,
        setEvidence,
        updateEvidenceScope,
        deleteEvidence,
        updateReviewerState,
        handoverApproved,
        setHandoverApproved,
        clearWorkspace,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}

export function useRelay() {
  const context = useContext(RelayContext);
  if (!context) {
    throw new Error('useRelay must be used within a RelayProvider');
  }
  return context;
}