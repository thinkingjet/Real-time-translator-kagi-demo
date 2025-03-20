//@ts-nocheck

/**
 * Translation API Route
 * 
 * This route handles text translation using Google Translate's API.
 * I implemented some cool features:
 * - Language code normalization (removing region codes)
 * - Error handling for missing parameters
 * - Response formatting for clean integration
 * - Proper URL encoding for special characters
 * 
 * @route POST /api/translate
 * @param {Object} request.body
 * @param {string} request.body.text - Text to translate
 * @param {string} request.body.sourceLanguage - Source language code
 * @param {string} request.body.targetLanguage - Target language code
 * @returns {Object} Response containing translated text or error message
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json();
    
    // Validate required parameters
    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Extract base language codes (removing region codes)
    // This ensures better compatibility with the translation API
    const sourceLang = sourceLanguage.split('-')[0];
    const targetLang = targetLanguage.split('-')[0];

    // Use Google Translate's API with proper URL encoding
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    // Process the translation response
    // Google's response format: [[["translated text","original text",""],...],...]
    const translatedText = data[0]
      ?.map((item: any[]) => item[0])
      .filter(Boolean)
      .join(' ');

    if (!translatedText) {
      throw new Error('Translation failed');
    }

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate text' },
      { status: 500 }
    );
  }
} 