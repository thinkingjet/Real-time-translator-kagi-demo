//@ts-nocheck
/**
 * Language Utilities
 * 
 * This module provides functions for language detection and management.
 * It supports detecting language mid-conversation for multilingual speakers.
 */

// Language detection cache to improve performance
const languageCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

// Common language codes mapping
export const LANGUAGE_CODES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'cs': 'Czech',
  'sv': 'Swedish',
  'hu': 'Hungarian',
  'fi': 'Finnish',
  'no': 'Norwegian',
  'da': 'Danish',
  'he': 'Hebrew',
  'el': 'Greek',
  'id': 'Indonesian',
  'ms': 'Malay',
  'ro': 'Romanian',
};

/**
 * Detects the language of a text string
 * Uses a simple heuristic approach combined with API calls
 * 
 * @param text The text to detect language for
 * @returns Language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length < 5) {
    return 'unknown';
  }

  // Normalize text for better matching
  const normalizedText = text.trim().toLowerCase();
  
  // Check cache first for performance
  const cachedLanguage = languageCache.get(normalizedText);
  if (cachedLanguage) {
    return cachedLanguage;
  }
  
  try {
    // Call our internal API for language detection
    const response = await fetch('/api/detect-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: normalizedText }),
    });

    if (!response.ok) {
      throw new Error(`Language detection failed with status: ${response.status}`);
    }

    const { language } = await response.json();
    
    // Update cache (with simple LRU-like behavior)
    if (languageCache.size >= MAX_CACHE_SIZE) {
      // Remove first entry when cache is full
      const firstKey = languageCache.keys().next().value;
      languageCache.delete(firstKey);
    }
    
    languageCache.set(normalizedText, language);
    return language;
  } catch (error) {
    console.error('Language detection error:', error);
    
    // Fallback to simple heuristics if API fails
    return detectLanguageHeuristic(normalizedText);
  }
}

/**
 * Simple heuristic language detection as fallback
 * This is not as accurate as the API but can work in a pinch
 * 
 * @param text Text to analyze
 * @returns Best guess at language code
 */
function detectLanguageHeuristic(text: string): string {
  // Very simplified detection based on character frequency
  const hasLatinChars = /[a-zA-Z]/.test(text);
  const hasCyrillicChars = /[а-яА-Я]/.test(text);
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(text);
  const hasJapaneseChars = /[\u3040-\u30ff]/.test(text);
  const hasKoreanChars = /[\uAC00-\uD7A3]/.test(text);
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  
  // Simple language guessing based on specific characters
  if (hasChineseChars) return 'zh';
  if (hasJapaneseChars) return 'ja';
  if (hasKoreanChars) return 'ko';
  if (hasCyrillicChars) return 'ru'; // Could be many Cyrillic languages
  if (hasArabicChars) return 'ar';
  if (hasLatinChars) return 'en'; // Default to English for Latin script
  
  return 'unknown';
}

/**
 * Gets the full language name from a code
 * 
 * @param code Language code
 * @returns Language name or the code itself if not found
 */
export function getLanguageName(code: string): string {
  // Handle regional variants (e.g., 'en-US' -> 'en')
  const baseCode = code.split('-')[0].toLowerCase();
  return LANGUAGE_CODES[baseCode] || code;
}

/**
 * Gets all supported languages as an array of objects
 * 
 * @returns Array of language objects with code and name
 */
export function getSupportedLanguages(): Array<{code: string, name: string}> {
  return Object.entries(LANGUAGE_CODES).map(([code, name]) => ({ code, name }));
}

/**
 * Normalizes language code (e.g., 'en-US' -> 'en')
 * 
 * @param languageCode Language code to normalize
 * @returns Normalized language code
 */
export function normalizeLanguageCode(languageCode: string): string {
  return languageCode.split('-')[0].toLowerCase();
} 