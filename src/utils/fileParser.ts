// src/utils/fileParser.ts

export async function parseFileWithLocators(file: File): Promise<{
  fileType: string;
  formattedContent: string;
  fileUrl: string;
  base64Data?: string;
  mimeType?: string;
}> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  // Create a live local URL so clicking "Open Original File" opens the PDF/doc in the browser!
  const fileUrl = URL.createObjectURL(file);

  // 1. Handle PDF Files -> Convert to Base64 for Gemini 3.5 Flash-Lite + keep fileUrl for viewing
  if (extension === 'pdf') {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize))
      );
    }
    const base64Data = btoa(binary);

    return {
      fileType: 'PDF',
      mimeType: 'application/pdf',
      fileUrl,
      base64Data,
      formattedContent: `[PDF Stored in Browser Memory: "${file.name}" (${(
        file.size / 1024
      ).toFixed(
        1
      )} KB)]\nYou can click "Open Original File" anytime to view this PDF, and click "Run Gemini AI Extraction" to summarize it into sections.`,
    };
  }

  // 2. Handle CSV Files
  if (extension === 'csv') {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const formatted = lines
      .map((line, idx) =>
        idx === 0 ? `[Header] ${line}` : `[Row ${idx}] ${line}`
      )
      .join('\n');

    return {
      fileType: 'CSV',
      mimeType: 'text/csv',
      fileUrl,
      formattedContent: formatted || '[Row 1] Empty CSV file.',
    };
  }

  // 3. Handle TXT / Markdown / Other Files
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const formatted = lines
    .map((line, idx) => `[Line ${idx + 1}] ${line}`)
    .join('\n');

  return {
    fileType: extension.toUpperCase() || 'TXT',
    mimeType: file.type || 'text/plain',
    fileUrl,
    formattedContent: formatted || '[Line 1] Document uploaded.',
  };
}