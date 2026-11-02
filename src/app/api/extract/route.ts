// src/app/api/extract/route.ts
import { NextResponse } from 'next/server';
import { CandidateClaim } from '@/utils/ruleValidator';

export async function POST(request: Request) {
  try {
    const { fileName, rawContent } = await request.json();

    if (!rawContent) {
      return NextResponse.json(
        { error: 'No source content provided for extraction.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. IF GEMINI_API_KEY IS PRESENT: Call Gemini Structured JSON Extraction
    if (apiKey) {
      const prompt = `You are RelayMap's AI Structured Extraction engine.
Extract project handover claims from the following authorised document (${fileName}).
Return ONLY a valid JSON array of objects with these exact keys:
- "category": one of "Decision", "Active work", "Risk", or "Next Action"
- "claim": a concise 1-sentence statement of the finding
- "owner": the person or role responsible (or "Unassigned" if not stated)
- "locator": the exact bracketed locator from the text (e.g. "p. 1", "item 2", "Section: Power Architecture / L1")
- "excerpt": the exact supporting quote from the source text

Document Content:
${rawContent}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const parsedClaims: CandidateClaim[] = JSON.parse(textOutput);
          return NextResponse.json({
            engine: 'Gemini 2.5 Flash Structured JSON API',
            claims: parsedClaims,
          });
        }
      }
    }

    // 2. BUILT-IN DETERMINISTIC AI PARSER (Works immediately with zero config)
    const lines = rawContent
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    const extractedClaims: CandidateClaim[] = [];

    lines.forEach((line: string, idx: number) => {
      // Skip pure section headers without content
      if (/^\[Section:[^\]]+\]$/.test(line) || line.startsWith('[Header]')) {
        return;
      }

      // Extract bracketed locator like [p. 1] or [Section: Power / L1]
      const locatorMatch = line.match(/^\[([^\]]+)\]\s*(.*)$/);
      const locator = locatorMatch ? locatorMatch[1] : `sec. ${idx + 1}`;
      const bodyText = locatorMatch ? locatorMatch[2] : line;

      if (bodyText.length < 10) return;

      // Determine Category
      let category: CandidateClaim['category'] = 'Decision';
      const lower = bodyText.toLowerCase();
      if (
        lower.includes('warning') ||
        lower.includes('risk') ||
        lower.includes('not been tested') ||
        lower.includes('not been validated') ||
        lower.includes('blocked')
      ) {
        category = 'Risk';
      } else if (
        lower.includes('active work') ||
        lower.includes('in_progress') ||
        lower.includes('in progress') ||
        lower.includes('complete') ||
        lower.includes('open')
      ) {
        category = 'Active work';
      } else if (
        lower.includes('next action') ||
        lower.includes('must run') ||
        lower.includes('confirm')
      ) {
        category = 'Next Action';
      }

      // Extract Owner if mentioned (e.g., "Owner: Vihaan Kunder")
      const ownerMatch = bodyText.match(/Owner:\s*([^.,;\n]+)/i);
      const owner = ownerMatch ? ownerMatch[1].trim() : 'Unassigned';

      // Clean up claim summary
      const cleanClaim = bodyText
        .replace(/^(Decision:|Active work:|WARNING:|Risk:)\s*/i, '')
        .trim();

      extractedClaims.push({
        category,
        claim: cleanClaim,
        owner,
        locator,
        excerpt: bodyText,
      });
    });

    return NextResponse.json({
      engine: 'RelayMap Structured Schema Extractor',
      claims: extractedClaims,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract structured claims.' },
      { status: 500 }
    );
  }
}