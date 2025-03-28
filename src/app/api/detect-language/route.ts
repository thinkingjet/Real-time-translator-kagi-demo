//@ts-nocheck
/**
 * Language Detection API Route
 * 
 * This route handles detecting the language of text input.
 * It uses script detection heuristics for basic language identification.
 * 
 * @route POST /api/detect-language
 * @param {Object} request.body
 * @param {string} request.body.text - Text to detect language for
 * @returns {Object} Response containing detected language code or error message
 */

import { NextRequest, NextResponse } from 'next/server';

// Common character patterns for script detection
const SCRIPTS = {
  LATIN: /[a-zA-Z]/,
  CYRILLIC: /[а-яА-Я]/,
  CHINESE: /[\u4e00-\u9fa5]/,
  JAPANESE: /[\u3040-\u30ff\u31f0-\u31ff]/,
  KOREAN: /[\uAC00-\uD7A3]/,
  ARABIC: /[\u0600-\u06FF]/,
  THAI: /[\u0E00-\u0E7F]/,
  DEVANAGARI: /[\u0900-\u097F]/,
};

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    // Validate required parameters
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text parameter' },
        { status: 400 }
      );
    }

    // Skip detection for very short text
    if (text.trim().length < 5) {
      return NextResponse.json({ language: 'unknown' });
    }

    // Use script detection
    const language = detectScriptBasedLanguage(text);
    return NextResponse.json({ language, confidence: 0.6 });
    
  } catch (error: any) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect language' },
      { status: 500 }
    );
  }
}

/**
 * Detect language based on script/character set
 */
function detectScriptBasedLanguage(text: string): string {
  // Check which scripts are present in the text
  if (SCRIPTS.CHINESE.test(text)) return 'zh';
  if (SCRIPTS.JAPANESE.test(text)) return 'ja';
  if (SCRIPTS.KOREAN.test(text)) return 'ko';
  if (SCRIPTS.CYRILLIC.test(text)) return 'ru'; // Default Cyrillic to Russian
  if (SCRIPTS.ARABIC.test(text)) return 'ar';
  if (SCRIPTS.THAI.test(text)) return 'th';
  if (SCRIPTS.DEVANAGARI.test(text)) return 'hi'; // Default Devanagari to Hindi
  
  // Default to English for Latin script
  if (SCRIPTS.LATIN.test(text)) return 'en';
  
  return 'unknown';
} 