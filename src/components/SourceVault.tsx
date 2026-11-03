// src/components/SourceVault.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRelay } from '@/context/RelayContext';
import {
  AccessScope,
  DocumentSection,
  EvidenceRecord,
  SourceDocument,
} from '@/types/relaymap';
import { parseFileWithLocators } from '@/utils/fileParser';
import { validateExtractedClaims } from '@/utils/ruleValidator';
import {
  Upload,
  FileText,
  PlusCircle,
  Cpu,
  Trash2,
  KeyRound,
  RotateCcw,
  ExternalLink,
  Edit3,
  Save,
  BookOpen,
  Shield,
} from 'lucide-react';

export default function SourceVault() {
  const {
    currentUser,
    sources,
    addSource,
    updateSourceAnalysis,
    updateSourceScope,
    deleteSource,
    evidence,
    setEvidence,
    clearWorkspace,
  } = useRelay();

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [accessScope, setAccessScope] = useState<AccessScope>('PUBLIC_TEAM');
  const [rawContent, setRawContent] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [base64Data, setBase64Data] = useState<string | undefined>(undefined);
  const [mimeType, setMimeType] = useState<string | undefined>(undefined);

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // API Key Live Check
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    live: boolean;
    message: string;
    loading: boolean;
  }>({ checked: false, live: false, message: '', loading: false });

  // Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [lastExtracted, setLastExtracted] = useState<EvidenceRecord[]>([]);

  // Editable Summary & Multi-Part Sections State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [draftSummary, setDraftSummary] = useState('');
  const [draftSections, setDraftSections] = useState<DocumentSection[]>([]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ACCESS_OWNER';
  const canEdit =
    currentUser.role === 'CONTRIBUTOR' ||
    currentUser.role === 'REVIEWER' ||
    isAdmin;

  const visibleSources = sources.filter((src) =>
    currentUser.allowedScopes.includes(src.accessScope)
  );

  const selectedSource =
    visibleSources.find((s) => s.id === selectedSourceId) ||
    visibleSources[0] ||
    null;

  // Sync editable fields when selectedSource changes
  useEffect(() => {
    if (selectedSource) {
      setDraftSummary(selectedSource.aiSummary || '');
      setDraftSections(selectedSource.sections || []);
      setIsEditingSummary(false);
    }
  }, [selectedSource?.id, selectedSource?.aiSummary, selectedSource?.sections]);

  const handleVerifyApiKey = async () => {
    setApiStatus({ checked: false, live: false, message: '', loading: true });
    try {
      const res = await fetch('/api/extract', { method: 'GET' });
      const data = await res.json();
      setApiStatus({
        checked: true,
        live: Boolean(data.live),
        message: data.message,
        loading: false,
      });
    } catch {
      setApiStatus({
        checked: true,
        live: false,
        message: 'Could not reach server to test API key.',
        loading: false,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const parsed = await parseFileWithLocators(file);
    setFileType(parsed.fileType);
    setRawContent(parsed.formattedContent);
    setFileUrl(parsed.fileUrl);
    setBase64Data(parsed.base64Data);
    setMimeType(parsed.mimeType);
    setUploadSuccess(false);
    setExtractionError('');
  };

  const handleAddAuthorisedSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !rawContent.trim()) return;

    const newDoc: SourceDocument = {
      id: `src-${Date.now()}`,
      fileName: fileName.trim(),
      fileType,
      owner: currentUser.name,
      uploadedAt: new Date().toISOString().split('T')[0],
      accessScope,
      rawContent: rawContent.trim(),
      fileUrl,
      base64Data,
      mimeType,
    };

    addSource(newDoc);
    setSelectedSourceId(newDoc.id);
    setFileName('');
    setRawContent('');
    setFileUrl(undefined);
    setBase64Data(undefined);
    setMimeType(undefined);
    setUploadSuccess(true);
  };

  const handleRunExtraction = async (sourceToExtract: SourceDocument) => {
    setIsExtracting(true);
    setExtractionError('');
    setLastExtracted([]);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: sourceToExtract.id,
          fileName: sourceToExtract.fileName,
          rawContent: sourceToExtract.rawContent,
          base64Data: sourceToExtract.base64Data,
          mimeType: sourceToExtract.mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setExtractionError(data.error || 'Extraction failed.');
        return;
      }

      updateSourceAnalysis(
        sourceToExtract.id,
        data.summary || '',
        data.sections || []
      );

      if (data.claims) {
        const validatedRecords = validateExtractedClaims(
          data.claims,
          sourceToExtract.id,
          sourceToExtract.fileName,
          sourceToExtract.accessScope,
          evidence
        );

        setEvidence((prev) => [
          ...validatedRecords,
          ...prev.filter((e) => e.sourceId !== sourceToExtract.id),
        ]);
        setLastExtracted(validatedRecords);
      }
    } catch (err: any) {
      setExtractionError(`Error: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveSummaryEdits = () => {
    if (!selectedSource) return;
    updateSourceAnalysis(selectedSource.id, draftSummary, draftSections);
    setIsEditingSummary(false);
  };

  const updateDraftSectionField = (
    idx: number,
    field: keyof DocumentSection,
    value: string
  ) => {
    setDraftSections((prev) =>
      prev.map((sec, i) => (i === idx ? { ...sec, [field]: value } : sec))
    );
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Bar: Live API Key Checker & Workspace Reset */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleVerifyApiKey}
            disabled={apiStatus.loading}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
          >
            <KeyRound className="w-4 h-4 text-blue-400" />
            {apiStatus.loading ? 'Checking Key...' : 'Verify Live API Key'}
          </button>

          {apiStatus.checked && (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                apiStatus.live
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {apiStatus.message}
            </span>
          )}
        </div>

        {canEdit && (sources.length > 0 || evidence.length > 0) && (
          <button
            type="button"
            onClick={clearWorkspace}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All Workspace Data
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Intake (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Step 01 • Upload Project Document
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5 mb-4">
            Source Vault Intake
          </h2>

          <form onSubmit={handleAddAuthorisedSource} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                1. Select File (PDF, TXT, MD, CSV)
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-5 hover:border-blue-600 hover:bg-blue-50/30 transition cursor-pointer">
                <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                <span className="text-sm font-semibold text-slate-900">
                  Click to choose a PDF or file from your PC
                </span>
                <span className="text-xs text-slate-600 mt-0.5 text-center">
                  Stored in browser memory so you can open and view the file directly
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="File name..."
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Format
                </label>
                <input
                  type="text"
                  readOnly
                  value={fileType}
                  className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-900 font-bold border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                2. Security & Access Scope
              </label>
              <select
                value={accessScope}
                onChange={(e) => setAccessScope(e.target.value as AccessScope)}
                className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg"
              >
                {currentUser.allowedScopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope === 'PUBLIC_TEAM' &&
                      'PUBLIC_TEAM (Shared with Newcomer Om)'}
                    {scope === 'CORE_LEAD_ONLY' &&
                      'CORE_LEAD_ONLY (Level 3 — Hidden from Om)'}
                    {scope === 'ADMIN_CONFIDENTIAL' &&
                      'ADMIN_CONFIDENTIAL (Reviewer & Admin Only)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                3. File Preview / Notes
              </label>
              <textarea
                rows={3}
                required
                placeholder="Upload a file above or type raw project notes..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-white text-slate-900 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Save File to Source Vault
            </button>

            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                ✓ File added! Click &ldquo;Run Gemini AI Extraction&rdquo; on the right to generate the General Summary &amp; Multi-Part Breakdown.
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Stored Files + Open PDF + Editable Multi-Part Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stored Files List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Stored Project Documents ({visibleSources.length})
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Click <strong>Open Original File</strong> to view the uploaded PDF in a new tab, or select it to run Gemini 3.5 Flash-Lite.
            </p>

            {visibleSources.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm text-slate-600">
                No documents uploaded yet. Upload a PDF or file on the left to start!
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSources.map((src) => {
                  const isSelected = selectedSource?.id === src.id;
                  return (
                    <div
                      key={src.id}
                      onClick={() => setSelectedSourceId(src.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-900">
                              {src.fileName}
                            </p>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                              {src.fileType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Uploaded by {src.owner} • {src.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap items-center gap-2"
                      >
                        {/* Admin Exclusive Control: Change Security Scope Live */}
                        {isAdmin ? (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <select
                              value={src.accessScope}
                              onChange={(e) =>
                                updateSourceScope(
                                  src.id,
                                  e.target.value as AccessScope
                                )
                              }
                              className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none"
                            >
                              <option value="PUBLIC_TEAM">PUBLIC_TEAM</option>
                              <option value="CORE_LEAD_ONLY">
                                CORE_LEAD_ONLY
                              </option>
                              <option value="ADMIN_CONFIDENTIAL">
                                ADMIN_CONFIDENTIAL
                              </option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                            {src.accessScope}
                          </span>
                        )}

                        {/* Open Original PDF / Document Directly */}
                        {src.fileUrl && (
                          <a
                            href={src.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Original File
                          </a>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => deleteSource(src.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Document: Gemini 3.5 Flash-Lite General Summary & Multi-Part Breakdown */}
          {selectedSource && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-blue-600">
                    Step 02 • Gemini 3.5 Flash-Lite Document Breakdown
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">
                    {selectedSource.fileName}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSource.fileUrl && (
                    <a
                      href={selectedSource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      View PDF
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={() => handleRunExtraction(selectedSource)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
                  >
                    <Cpu className="w-4 h-4" />
                    {isExtracting
                      ? 'Gemini 3.5 Flash-Lite Analyzing...'
                      : 'Run Gemini AI Extraction & Summarizer'}
                  </button>
                </div>
              </div>

              {extractionError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs font-bold">
                  {extractionError}
                </div>
              )}

              {/* Embedded PDF Preview if it's a PDF */}
              {selectedSource.fileUrl && selectedSource.fileType === 'PDF' && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Embedded Original PDF Viewer
                  </span>
                  <iframe
                    src={selectedSource.fileUrl}
                    title={selectedSource.fileName}
                    className="w-full h-64 rounded-xl border border-slate-300 bg-slate-100"
                  />
                </div>
              )}

              {/* Editable General Summary + Multi-Part Document Breakdown */}
              {selectedSource.aiSummary && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      AI Document Summary & Multi-Part Breakdown
                    </h5>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          isEditingSummary
                            ? handleSaveSummaryEdits()
                            : setIsEditingSummary(true)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          isEditingSummary
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isEditingSummary ? (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save Summary Edits
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" /> Edit Summaries
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 1. General Summary of Entire Document */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <span className="text-xs font-bold uppercase text-blue-800 block">
                      1. General Summary of Entire Document
                    </span>
                    {isEditingSummary ? (
                      <textarea
                        rows={4}
                        value={draftSummary}
                        onChange={(e) => setDraftSummary(e.target.value)}
                        className="w-full p-3 text-sm bg-white text-slate-900 border border-blue-300 rounded-lg"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 leading-relaxed font-medium">
                        {selectedSource.aiSummary}
                      </p>
                    )}
                  </div>

                  {/* 2. Document Divided into Multiple Parts with Source Locators */}
                  {draftSections.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase text-slate-600 block">
                        2. Document Divided into Key Parts (With Source Locations)
                      </span>

                      {draftSections.map((sec, idx) => (
                        <div
                          key={sec.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                        >
                          {isEditingSummary ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={(e) =>
                                    updateDraftSectionField(
                                      idx,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Section Title"
                                  className="col-span-2 px-3 py-1.5 text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={sec.locator}
                                  onChange={(e) =>
                                    updateDraftSectionField(
                                      idx,
                                      'locator',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Page / Section"
                                  className="px-3 py-1.5 text-xs font-bold bg-white text-blue-700 border border-slate-300 rounded-lg"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={sec.summary}
                                onChange={(e) =>
                                  updateDraftSectionField(
                                    idx,
                                    'summary',
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <h6 className="text-sm font-bold text-slate-900">
                                  Part {idx + 1}: {sec.title}
                                </h6>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                  Taken from: {sec.locator}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {sec.summary}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {lastExtracted.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                  ✓ Extracted {lastExtracted.length} actionable claims into Step 3 (Evidence Ledger) for editing &amp; human approval!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}