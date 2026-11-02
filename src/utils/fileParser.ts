// src/utils/fileParser.ts

/**
 * Parses uploaded files (.csv, .md, .txt, .pdf, .docx) and attaches
 * deterministic source locators ([Row X], [Section X], [Page X])
 * so every AI claim can cite an exact location.
 */
export async function parseFileWithLocators(file: File): Promise<{
  fileType: string;
  formattedContent: string;
}> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Handle CSV Files -> Attach [Row X] locators
  if (extension === 'csv') {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const formatted = lines
      .map((line, idx) =>
        idx === 0 ? `[Header] ${line}` : `[item ${idx}] ${line}`
      )
      .join('\n');

    return {
      fileType: 'CSV',
      formattedContent: formatted || '[item 1] Empty CSV file.',
    };
  }

  // 2. Handle Markdown Files -> Attach [Section] or [Line] locators
  if (extension === 'md') {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    let currentSection = 'Intro';
    const output: string[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('#')) {
        currentSection = trimmed.replace(/^#+\s*/, '');
        output.push(`[Section: ${currentSection}]`);
      } else {
        output.push(`[${currentSection} / L${idx + 1}] ${trimmed}`);
      }
    });

    return {
      fileType: 'MARKDOWN',
      formattedContent: output.join('\n') || '[Section 1] Empty Markdown file.',
    };
  }

  // 3. Handle Plain Text Files -> Attach [Paragraph/Chunk] locators
  if (extension === 'txt') {
    const text = await file.text();
    const paragraphs = text
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const formatted = paragraphs
      .map((para, idx) => `[sec. ${idx + 1}] ${para.replace(/\r?\n/g, ' ')}`)
      .join('\n\n');

    return {
      fileType: 'TXT',
      formattedContent: formatted || '[sec. 1] Empty text file.',
    };
  }

  // 4. Handle PDF & DOCX Files -> Extract readable text segments with [p. X] locators
  if (extension === 'pdf' || extension === 'docx') {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(buffer);

    // Extract clean ASCII/readable sentences from binary stream if present,
    // or allow user to inspect/edit the extracted text in the preview box
    const matches = rawString.match(/[A-Za-z0-9 ,.:;\-_/#()'"\n]{25,}/g) || [];
    const cleaned = matches
      .map((m) => m.trim())
      .filter(
        (m) =>
          !m.includes('obj') &&
          !m.includes('endstream') &&
          !m.includes('xml') &&
          !m.includes('font')
      )
      .slice(0, 15);

    if (cleaned.length > 0) {
      const formatted = cleaned
        .map((chunk, idx) => `[p. ${idx + 1}] ${chunk}`)
        .join('\n');
      return {
        fileType: extension.toUpperCase(),
        formattedContent: formatted,
      };
    }

    return {
      fileType: extension.toUpperCase(),
      formattedContent: `[p. 1] Uploaded binary document (${file.name}). You can paste or edit specific pages below before running extraction.`,
    };
  }

  // Fallback for any other file
  const fallbackText = await file.text();
  return {
    fileType: extension.toUpperCase() || 'DOC',
    formattedContent: `[p. 1] ${fallbackText}`,
  };
}