import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json();
    
    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Extract base language codes (removing region codes)
    const sourceLang = sourceLanguage.split('-')[0];
    const targetLang = targetLanguage.split('-')[0];

    // Use Google Translate's unofficial API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    // Extract translated text from Google's response
    // The response format is: [[["translated text","original text",""],...],...]
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