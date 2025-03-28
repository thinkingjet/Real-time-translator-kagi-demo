/**
 * Translation Utilities
 * 
 * This module provides functions for:
 * 1. Text translation using Google Translate API
 * 2. Text-to-speech conversion using Cartesia API
 * 3. Speech caching to avoid duplicates
 */

// Cache for already spoken texts to avoid repeating
const spokenTexts = new Set<string>();

/**
 * Translates text from source language to target language
 * 
 * @param text Text to translate
 * @param sourceLanguage Source language code
 * @param targetLanguage Target language code
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  // Skip translation if languages are the same
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    // Use the Google Translate API via our internal API route
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text');
  }
}

/**
 * Converts text to speech using Cartesia voice cloning API
 * 
 * @param text Text to convert to speech
 * @param language Language code for the speech
 * @param skipCache Whether to skip the cache check (force speak)
 * @returns Promise that resolves when speech is completed
 */
export async function speakText(
  text: string,
  language: string,
  skipCache = false
): Promise<void> {
  // Skip if text has already been spoken (unless forced)
  const cacheKey = `${text}_${language}`;
  if (!skipCache && spokenTexts.has(cacheKey)) {
    console.log('Skipping already spoken text:', text.substring(0, 30));
    return;
  }

  try {
    // Use our internal TTS API that connects to Cartesia
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed with status: ${response.status}`);
    }

    // Process server-sent events (SSE) from Cartesia API
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Could not get response reader');

    const decoder = new TextDecoder();
    let audioData = '';

    // Read streaming response
    const processStream = async () => {
      const { done, value } = await reader.read();
      if (done) return;

      const chunk = decoder.decode(value);
      audioData += chunk;

      // Check if we've received a complete audio chunk
      if (chunk.includes('data:')) {
        try {
          // Extract and play the audio data
          const dataMatches = audioData.match(/data:(.*)/g);
          if (dataMatches && dataMatches.length > 0) {
            const jsonStr = dataMatches[dataMatches.length - 1].replace('data:', '');
            const audioChunk = JSON.parse(jsonStr);
            
            if (audioChunk.binary) {
              // Play the audio using Audio API
              const audio = new Audio(`data:audio/wav;base64,${audioChunk.binary}`);
              await new Promise<void>((resolve) => {
                audio.onended = () => resolve();
                audio.play();
              });
            }
          }
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
      }

      // Continue reading
      return processStream();
    };

    await processStream();

    // Add to spoken cache after successful playback
    if (!skipCache) {
      spokenTexts.add(cacheKey);
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw new Error('Failed to convert text to speech');
  }
}

/**
 * Force speaking text even if it has been spoken before
 * 
 * @param text Text to speak
 * @param language Language code
 * @returns Promise that resolves when speech is completed
 */
export function speakTextForced(text: string, language: string): Promise<void> {
  return speakText(text, language, true);
}

/**
 * Clear the cache of spoken texts
 */
export function clearSpokenTexts(): void {
  spokenTexts.clear();
} 