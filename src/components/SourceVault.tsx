// src/components/SourceVault.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { AccessScope, EvidenceRecord, SourceDocument } from '@/types/relaymap';
import { parseFileWithLocators } from '@/utils/fileParser';
import { validateExtractedClaims } from '@/utils/ruleValidator';
import {
  Upload,
  FileText,
  Lock,
  CheckCircle2,
  Eye,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  Cpu,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function SourceVault() {
  const { currentUser, sources, addSource, evidence, setEvidence } = useRelay();

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('MARKDOWN');
  const [accessScope, setAccessScope] = useState<AccessScope>('PUBLIC_TEAM');
  const [rawContent, setRawContent] = useState('');
  const [selectedSource, setSelectedSource] = useState<SourceDocument | null>(
    sources[0] || null
  );
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Part 3 Extraction & Validation states
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtracted, setLastExtracted] = useState<EvidenceRecord[]>([]);
  const [extractionEngine, setExtractionEngine] = useState<string>('');

  if (!currentUser) return null;

  // Filter sources so users only see files allowed for their role (Least Privilege)
  const visibleSources = sources.filter((src) =>
    currentUser.allowedScopes.includes(src.accessScope)
  );

  // Handle real file selection from PC (.txt, .md, .csv, .pdf, .docx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const parsed = await parseFileWithLocators(file);
    setFileType(parsed.fileType);
    setRawContent(parsed.formattedContent);
    setUploadSuccess(false);
  };

  // 1-Click Synthetic Sample Loader (Includes an intentional conflict & risk for testing!)
  const loadSampleHandoverFile = () => {
    setFileName('Power_Subsystem_Handover.md');
    setFileType('MARKDOWN');
    setAccessScope('PUBLIC_TEAM');
    setRawContent(
      `[Section: Power Architecture / L1] Decision: Switched voltage regulator to buck converter LM2596 for stable 5V rail. Owner: Hardware Team.\n` +
        `[Section: Open Blockers / L4] Active work: Solar charging PCB layout is 80% complete. Owner: Vihaan Kunder.\n` +
        `[Section: Critical Risks / L8] WARNING: Thermal dissipation on LM2596 has not been tested under full motor stall current.\n` +
        `[Section: Legacy Note / L12] Decision: Prototype controller uses Arduino Mega for bench testing. Owner: Firmware lead.`
    );
    setUploadSuccess(false);
  };

  // Save authorised source into Project Workspace
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
    };

    addSource(newDoc);
    setSelectedSource(newDoc);
    setFileName('');
    setRawContent('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  // PART 3: Run AI Structured Extraction + Deterministic TypeScript Rule Validator
  const handleRunExtraction = async (sourceToExtract: SourceDocument) => {
    setIsExtracting(true);
    setLastExtracted([]);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: sourceToExtract.id,
          fileName: sourceToExtract.fileName,
          rawContent: sourceToExtract.rawContent,
        }),
      });

      const data = await response.json();
      if (data.claims) {
        // Run deterministic TypeScript Rule Validator on candidate claims
        const validatedRecords = validateExtractedClaims(
          data.claims,
          sourceToExtract.id,
          sourceToExtract.fileName,
          sourceToExtract.accessScope,
          evidence
        );

        // Save into Project Memory (Evidence Ledger)
        setEvidence((prev) => [...validatedRecords, ...prev]);
        setLastExtracted(validatedRecords);
        setExtractionEngine(data.engine || 'Structured Extractor');
      }
    } catch (err) {
      console.error('Failed to extract claims:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
      {/* Left Column: Upload & Authorise New Source (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Step 01 & 02 • Connect & Parse
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Source Vault Intake
            </h2>
          </div>
          <button
            type="button"
            onClick={loadSampleHandoverFile}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Demo File
          </button>
        </div>

        <form onSubmit={handleAddAuthorisedSource} className="space-y-4">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
              1. Select Authorised File (PDF, DOCX, TXT, MD, CSV)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-5 hover:border-blue-600 hover:bg-blue-50/30 transition cursor-pointer">
              <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
              <span className="text-sm font-semibold text-slate-900">
                Click to upload a file from your PC
              </span>
              <span className="text-xs text-slate-600 mt-0.5 text-center">
                Automatically parses text and attaches [Page / Row / Section] locators
              </span>
              <input
                type="file"
                accept=".txt,.md,.csv,.pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* File Name & Detected Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Document Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Power_Subsystem_Handover.md"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Format
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="MARKDOWN" className="text-slate-900 bg-white">MARKDOWN</option>
                <option value="PDF" className="text-slate-900 bg-white">PDF</option>
                <option value="CSV" className="text-slate-900 bg-white">CSV</option>
                <option value="TXT" className="text-slate-900 bg-white">TXT</option>
                <option value="DOCX" className="text-slate-900 bg-white">DOCX</option>
              </select>
            </div>
          </div>

          {/* Access Scope Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              2. Set Permission & Access Scope
            </label>
            <select
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as AccessScope)}
              className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              {currentUser.allowedScopes.map((scope) => (
                <option key={scope} value={scope} className="text-slate-900 bg-white">
                  {scope === 'PUBLIC_TEAM' &&
                    'PUBLIC_TEAM (Visible to All Project Members)'}
                  {scope === 'CORE_LEAD_ONLY' &&
                    'CORE_LEAD_ONLY (Restricted to Leads & Contributors)'}
                  {scope === 'ADMIN_CONFIDENTIAL' &&
                    'ADMIN_CONFIDENTIAL (Restricted to Reviewer & Org Admin)'}
                </option>
              ))}
            </select>
          </div>

          {/* Parsed Content & Source Locators Preview/Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700">
                3. Parsed Content with Source Locators
              </label>
              <span className="text-xs text-slate-500">Editable before ingest</span>
            </div>
            <textarea
              rows={6}
              required
              placeholder="Upload a file or click 'Load Demo File' to see parsed chunks with [p. X] or [item X] locators..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Authorise & Add to Source Vault
          </button>

          {uploadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Source parsed and added! Now click &ldquo;Run AI Extraction &amp; Rule Validator&rdquo; on the right.
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Vault Repository, Chunker Inspector & Part 3 AI Extractor (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Authorised Files List */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Authorised Project Sources ({visibleSources.length})
              </h3>
              <p className="text-xs text-slate-600">
                Click any file below to inspect its chunks and extract structured project memory
              </p>
            </div>
            {sources.length > visibleSources.length && (
              <span className="text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                {sources.length - visibleSources.length} restricted file(s) hidden
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {visibleSources.map((src) => {
              const isSelected = selectedSource?.id === src.id;
              return (
                <div
                  key={src.id}
                  onClick={() => {
                    setSelectedSource(src);
                    setLastExtracted([]);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {src.fileName}
                        </p>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {src.fileType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Owner: {src.owner} • Uploaded: {src.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-600" />
                      {src.accessScope}
                    </span>
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Chunker Inspector + PART 3 AI EXTRACTION TRIGGER */}
        {selectedSource && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600">
                  Step 03 & 04 • AI Structured Extraction & Rule Validator
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Inspecting: {selectedSource.fileName}
                </h4>
              </div>

              <button
                type="button"
                disabled={isExtracting}
                onClick={() => handleRunExtraction(selectedSource)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
              >
                <Cpu className="w-4 h-4" />
                {isExtracting
                  ? 'Extracting & Validating...'
                  : 'Run AI Extraction & Rule Validator'}
              </button>
            </div>

            {/* High-Contrast Light Gray Chunk Box (Fixed visibility!) */}
            <div className="bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
              {selectedSource.rawContent.split('\n').map((line, i) => (
                <div
                  key={i}
                  className="py-1.5 border-b border-slate-200 last:border-none"
                >
                  <span className="text-blue-700 font-bold mr-2">
                    Chunk #{i + 1}:
                  </span>
                  <span className="text-slate-900">{line}</span>
                </div>
              ))}
            </div>

            {/* Validation Results Display */}
            {lastExtracted.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Extracted & Validated {lastExtracted.length} Claims into Project Memory
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Engine: {extractionEngine}
                  </span>
                </div>

                <div className="space-y-2">
                  {lastExtracted.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-700">
                            {item.category}
                          </span>
                          {/* Traffic Light Status Badge */}
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                              item.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status === 'VERIFIED' && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {item.status === 'IN_PROGRESS' && (
                              <Clock className="w-3 h-3" />
                            )}
                            {item.status === 'UNVERIFIED' && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">
                          SOURCE: {item.sourceName} / {item.locator}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {item.claim}
                      </p>
                      <p className="text-xs text-slate-600">
                        Owner: <span className="font-semibold text-slate-800">{item.owner}</span>
                      </p>

                      {item.conflictNote && (
                        <div className="mt-1 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-800 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          Rule Validator Flag: {item.conflictNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}