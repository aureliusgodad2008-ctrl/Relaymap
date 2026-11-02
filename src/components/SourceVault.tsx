// src/components/SourceVault.tsx
'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { AccessScope, SourceDocument } from '@/types/relaymap';
import { parseFileWithLocators } from '@/utils/fileParser';
import {
  Upload,
  FileText,
  Lock,
  CheckCircle2,
  Eye,
  PlusCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function SourceVault() {
  const { currentUser, sources, addSource } = useRelay();

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('MARKDOWN');
  const [accessScope, setAccessScope] = useState<AccessScope>('PUBLIC_TEAM');
  const [rawContent, setRawContent] = useState('');
  const [selectedSource, setSelectedSource] = useState<SourceDocument | null>(
    sources[0] || null
  );
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  // 1-Click Synthetic Sample Loader for fast testing
  const loadSampleHandoverFile = () => {
    setFileName('Power_Subsystem_Handover.md');
    setFileType('MARKDOWN');
    setAccessScope('PUBLIC_TEAM');
    setRawContent(
      `[Section: Power Architecture / L1] Decision: Switched voltage regulator to buck converter LM2596 for stable 5V rail.\n` +
        `[Section: Open Blockers / L4] Active work: Solar charging PCB layout is 80% complete. Owner: Vihaan Kunder.\n` +
        `[Section: Critical Risks / L8] WARNING: Thermal dissipation on LM2596 has not been tested under full motor stall current. Next action: Run thermal stress test for 15 minutes.`
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Upload & Authorise New Source (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
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
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Demo File
          </button>
        </div>

        <form onSubmit={handleAddAuthorisedSource} className="space-y-4">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              1. Select Authorised File (PDF, DOCX, TXT, MD, CSV)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-5 hover:border-blue-600 hover:bg-blue-50/20 transition cursor-pointer">
              <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
              <span className="text-sm font-semibold text-slate-800">
                Click to upload a file from your PC
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
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
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Document Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Firmware_Handover_Notes.md"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Format
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="MARKDOWN">MARKDOWN</option>
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="TXT">TXT</option>
                <option value="DOCX">DOCX</option>
              </select>
            </div>
          </div>

          {/* Access Scope Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              2. Set Permission & Access Scope
            </label>
            <select
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as AccessScope)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
            >
              {currentUser.allowedScopes.map((scope) => (
                <option key={scope} value={scope}>
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
              <label className="block text-xs font-bold uppercase text-slate-600">
                3. Parsed Content with Source Locators
              </label>
              <span className="text-xs text-slate-400">Editable before ingest</span>
            </div>
            <textarea
              rows={6}
              required
              placeholder="Upload a file or click 'Load Demo File' to see parsed chunks with [p. X] or [item X] locators..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
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
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Source parsed and stored in Vault with locators! Ready for AI Extraction.
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Vault Repository & Source Locator Inspector (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Authorised Files List */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Authorised Project Sources ({visibleSources.length})
              </h3>
              <p className="text-xs text-slate-500">
                Filtered by {currentUser.name}&apos;s role permissions ({currentUser.role})
              </p>
            </div>
            {sources.length > visibleSources.length && (
              <span className="text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
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
                  onClick={() => setSelectedSource(src)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {src.fileName}
                        </p>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {src.fileType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Owner: {src.owner} • Uploaded: {src.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      {src.accessScope}
                    </span>
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Chunker & Locator Inspector */}
        {selectedSource && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600">
                  Parser + Chunker Output
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Inspecting: {selectedSource.fileName}
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                LOCATORS VERIFIED
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
              {selectedSource.rawContent.split('\n').map((line, i) => (
                <div
                  key={i}
                  className="py-1 border-b border-slate-800 last:border-none"
                >
                  <span className="text-blue-400 font-bold mr-2">
                    Chunk #{i + 1}:
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}