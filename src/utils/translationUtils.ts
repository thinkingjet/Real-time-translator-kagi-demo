//@ts-nocheck

/**
 * Translation and Text-to-Speech Utilities
 * 
 * This module handles text translation and speech synthesis.
 * I implemented some advanced features:
 * - Real-time translation using Google Translate
 * - High-quality TTS using Cartesia's API
 * - Smart caching to prevent duplicate speech
 * - Language-specific voice selection
 * - Streaming audio playback
 * 
 * The implementation focuses on:
 * - Low latency for real-time use
 * - High-quality voice output
 * - Efficient resource usage
 * - Robust error handling
 */

/**
 * Cache to prevent speaking the same text multiple times
 * This improves the user experience by avoiding repetition
 */
let spokenTexts = new Set<string>();

/**
 * Voice ID mapping for different languages
 * I carefully selected these voices for their quality and natural sound
 */
const VOICE_IDS: Record<string, string> = {
  'en': 'bf0a246a-8642-498a-9950-80c35e9276b5', // English
  'de': '38aabb6a-f52b-4fb0-a3d1-988518f4dc06', // German
  'pt': 'a37639f0-2f0a-4de4-9942-875a187af878', // Portuguese
  'zh': '3a63e2d1-1c1e-425d-8e79-5100bc910e90', // Chinese
  'ja': '6b92f628-be90-497c-8f4c-3b035002df71', // Japanese
  'fr': 'a8a1eb38-5f15-4c1d-8722-7ac0f329727d', // French
  'es': '79743797-2087-422f-8dc7-86f9efca85f1', // Spanish
  'hi': 'c1abd502-9231-4558-a054-10ac950c356d', // Hindi
  'it': 'e5923af7-a329-4e9b-b95a-5ace4a083535', // Italian
  'ko': '304fdbd8-65e6-40d6-ab78-f9d18b9efdf9', // Korean
  'nl': 'af482421-80f4-4379-b00c-a118def29cde', // Dutch
  'pl': '2a3503b2-b6b6-4534-a224-e8c0679cec4a', // Polish
  'ru': 'f07163ac-559f-43b1-97cc-c6c6504bbb48', // Russian
  'sv': '0caedb75-417f-4e36-9b64-c21354cb94c8', // Swedish
  'tr': 'bb2347fe-69e9-4810-873f-ffd759fe8420', // Turkish
};

// Fallback to English voice if language not supported
const DEFAULT_VOICE_ID = 'bf0a246a-8642-498a-9950-80c35e9276b5';

/**
 * Translates text between languages using Google Translate
 * 
 * I chose Google's API for its:
 * - High accuracy
 * - Wide language support
 * - Fast response times
 * - Free tier availability
 * 
 * @param text - Text to translate
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @returns Promise<string> - Translated text
 */
export const translateText = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> => {
  try {
    if (!text.trim()) {
      return '';
    }
    
    // Normalize language codes for better compatibility
    let sourceLang = sourceLanguage.split('-')[0];
    let targetLang = targetLanguage.split('-')[0];

    // Call Google Translate API with proper encoding
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    let response = await fetch(url);
    let data = await response.json();

    // Process the translation response
    let translatedText = data[0]
      ?.map((item: any[]) => item[0])
      .filter(Boolean)
      .join(' ');

    if (!translatedText) {
      throw new Error('Translation failed');
    }

    return translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
};

/**
 * Converts text to speech using Cartesia's TTS API
 * 
 * I implemented advanced features:
 * - WebSocket streaming for low latency
 * - Audio queue management
 * - Automatic voice selection
 * - Duplicate prevention
 * - High-quality audio output
 * 
 * @param text - Text to convert to speech
 * @param language - Target language code
 * @returns Promise<void>
 */
export const speakText = async (text: string, language: string): Promise<void> => {
  try {
    if (!text.trim()) {
      return;
    }

    // Skip if we've already spoken this text
    if (spokenTexts.has(text)) {
      console.log('Text already spoken, skipping:', text);
      return;
    }

    // Track spoken text to avoid duplicates
    spokenTexts.add(text);

    let lang = language.split('-')[0];

    // Get API key securely from backend
    let response = await fetch('/api/tts');
    let { apiKey } = await response.json();

    if (!apiKey) {
      throw new Error('TTS API key not found');
    }

    // Initialize WebSocket connection
    let ws = new WebSocket(`wss://api.cartesia.ai/tts/websocket?cartesia_version=2024-06-10&api_key=${apiKey}`);

    return new Promise((resolve, reject) => {
      let audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let contextId = `tts-${Date.now()}`;
      let audioQueue: Float32Array[] = [];
      let isPlaying = false;
      let hasStartedPlaying = false;

      /**
       * Plays the next chunk of audio from the queue
       * I implemented this for smooth streaming playback
       */
      const playNextChunk = () => {
        if (audioQueue.length === 0 || isPlaying) return;

        isPlaying = true;
        hasStartedPlaying = true;
        let chunk = audioQueue.shift()!;
        
        // Create and configure audio buffer
        let buffer = audioCtx.createBuffer(1, chunk.length, 44100);
        buffer.copyToChannel(chunk, 0);

        let source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        
        // Setup completion handler for continuous playback
        source.onended = () => {
          isPlaying = false;
          playNextChunk();
        };

        source.start();
      };

      // Handle WebSocket connection open
      ws.onopen = () => {
        // Select appropriate voice for language
        let voiceId = VOICE_IDS[lang] || DEFAULT_VOICE_ID;

        // Configure TTS request with optimal settings
        ws.send(JSON.stringify({
          model_id: 'sonic-2',  // Latest model for best quality
          transcript: text,
          voice: {
            mode: 'id',
            id: voiceId,
            __experimental_controls: {
              speed: 'normal',
              emotion: ['positivity']  // Add friendly tone
            }
          },
          language: lang,
          context_id: contextId,
          output_format: {
            container: 'raw',
            encoding: 'pcm_s16le',  // High-quality audio format
            sample_rate: 44100      // CD-quality sampling
          },
          continue: false
        }));
      };

      // Process incoming audio chunks
      ws.onmessage = async (event) => {
        try {
          let msg = JSON.parse(event.data);

          if (msg.type === 'chunk' && msg.data) {
            // Convert base64 audio data to raw format
            let raw = atob(msg.data);
            let audio = new Int16Array(raw.length / 2);
            
            // Process binary audio data
            for (let i = 0; i < raw.length; i += 2) {
              let byte1 = raw.charCodeAt(i);
              let byte2 = raw.charCodeAt(i + 1);
              audio[i / 2] = (byte2 << 8) | byte1;
            }

            // Normalize audio data to floating point
            let float = new Float32Array(audio.length);
            for (let i = 0; i < audio.length; i++) {
              float[i] = audio[i] / 32768.0;
            }

            // Queue audio chunk and start playback
            audioQueue.push(float);
            playNextChunk();
          } else if (msg.type === 'error') {
            console.error('TTS error:', msg.error);
            reject(new Error(msg.error));
          } else if (msg.type === 'done') {
            // Ensure all audio finishes playing
            let checkQueue = setInterval(() => {
              if (audioQueue.length === 0 && !isPlaying) {
                clearInterval(checkQueue);
                if (hasStartedPlaying) {
                  spokenTexts.add(text);
                }
                ws.close();
                resolve();
              }
            }, 100);
          }
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
      };

      // Handle WebSocket errors
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      // Clean up on connection close
      ws.onclose = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error speaking text:', error);
    throw error;
  }
};

/**
 * Converts text to speech using Cartesia's TTS API, but forces playback
 * even if the text has been spoken before. Used for manual replay.
 * 
 * @param text - Text to convert to speech
 * @param language - Target language code
 * @returns Promise<void>
 */
export const speakTextForced = async (text: string, language: string): Promise<void> => {
  try {
    if (!text.trim()) {
      return;
    }

    let lang = language.split('-')[0];

    // Get API key securely from backend
    let response = await fetch('/api/tts');
    let { apiKey } = await response.json();

    if (!apiKey) {
      throw new Error('TTS API key not found');
    }

    // Initialize WebSocket connection
    let ws = new WebSocket(`wss://api.cartesia.ai/tts/websocket?cartesia_version=2024-06-10&api_key=${apiKey}`);

    return new Promise((resolve, reject) => {
      let audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let contextId = `tts-${Date.now()}`;
      let audioQueue: Float32Array[] = [];
      let isPlaying = false;
      let hasStartedPlaying = false;

      /**
       * Plays the next chunk of audio from the queue
       * I implemented this for smooth streaming playback
       */
      const playNextChunk = () => {
        if (audioQueue.length === 0 || isPlaying) return;

        isPlaying = true;
        hasStartedPlaying = true;
        let chunk = audioQueue.shift()!;
        
        // Create and configure audio buffer
        let buffer = audioCtx.createBuffer(1, chunk.length, 44100);
        buffer.copyToChannel(chunk, 0);

        let source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        
        // Setup completion handler for continuous playback
        source.onended = () => {
          isPlaying = false;
          playNextChunk();
        };

        source.start();
      };

      // Handle WebSocket connection open
      ws.onopen = () => {
        // Select appropriate voice for language
        let voiceId = VOICE_IDS[lang] || DEFAULT_VOICE_ID;

        // Configure TTS request with optimal settings
        ws.send(JSON.stringify({
          model_id: 'sonic-2',  // Latest model for best quality
          transcript: text,
          voice: {
            mode: 'id',
            id: voiceId,
            __experimental_controls: {
              speed: 'normal',
              emotion: ['positivity']  // Add friendly tone
            }
          },
          language: lang,
          context_id: contextId,
          output_format: {
            container: 'raw',
            encoding: 'pcm_s16le',  // High-quality audio format
            sample_rate: 44100      // CD-quality sampling
          },
          continue: false
        }));
      };

      // Process incoming audio chunks
      ws.onmessage = async (event) => {
        try {
          let msg = JSON.parse(event.data);

          if (msg.type === 'chunk' && msg.data) {
            // Convert base64 audio data to raw format
            let raw = atob(msg.data);
            let audio = new Int16Array(raw.length / 2);
            
            // Process binary audio data
            for (let i = 0; i < raw.length; i += 2) {
              let byte1 = raw.charCodeAt(i);
              let byte2 = raw.charCodeAt(i + 1);
              audio[i / 2] = (byte2 << 8) | byte1;
            }

            // Normalize audio data to floating point
            let float = new Float32Array(audio.length);
            for (let i = 0; i < audio.length; i++) {
              float[i] = audio[i] / 32768.0;
            }

            // Queue audio chunk and start playback
            audioQueue.push(float);
            playNextChunk();
          } else if (msg.type === 'error') {
            console.error('TTS error:', msg.error);
            reject(new Error(msg.error));
          } else if (msg.type === 'done') {
            // Ensure all audio finishes playing
            let checkQueue = setInterval(() => {
              if (audioQueue.length === 0 && !isPlaying) {
                clearInterval(checkQueue);
                ws.close();
                resolve();
              }
            }, 100);
          }
        } catch (error) {
          console.error('Error processing TTS message:', error);
          reject(error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        if (!hasStartedPlaying) {
          reject(new Error('WebSocket closed before audio started playing'));
        }
      };
    });
  } catch (error) {
    console.error('Error speaking text:', error);
    throw error;
  }
};

/**
 * Clears the cache of spoken texts
 * Useful when starting a new session or resetting state
 */
export const clearSpokenTexts = () => {
  spokenTexts.clear();
}; 