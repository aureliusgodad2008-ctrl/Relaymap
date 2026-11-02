// src/context/RelayContext.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  UserProfile,
  SourceDocument,
  EvidenceRecord,
  TEAM_USERS,
  INITIAL_SOURCES,
  INITIAL_EVIDENCE,
  ReviewerState,
} from '@/types/relaymap';

interface RelayContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  sources: SourceDocument[];
  addSource: (source: SourceDocument) => void;
  evidence: EvidenceRecord[];
  setEvidence: React.Dispatch<React.SetStateAction<EvidenceRecord[]>>;
  updateReviewerState: (id: string, state: ReviewerState) => void;
  handoverApproved: boolean;
  setHandoverApproved: (approved: boolean) => void;
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

  const updateReviewerState = (id: string, reviewerState: ReviewerState) => {
    setEvidence((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reviewerState } : item))
    );
  };

  return (
    <RelayContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        sources,
        addSource,
        evidence,
        setEvidence,
        updateReviewerState,
        handoverApproved,
        setHandoverApproved,
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