//@ts-nocheck

// Utility functions for translation and TTS

// shoutout to google translate api for being free lol
// had to use this cuz the paid ones were too expensive


// keeps track of what we already said (dont wanna repeat stuff)
let spokenTexts = new Set<string>();

// Voice ID mapping for different languages
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

// Default voice ID if language not found
const DEFAULT_VOICE_ID = 'bf0a246a-8642-498a-9950-80c35e9276b5'; // English voice as default

// translate stuff using google api

export const translateText = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> => {
  try {
    if (!text.trim()) {
      return '';
    }
    
    // Extract base language codes (removing region codes)
    let sourceLang = sourceLanguage.split('-')[0];
    let targetLang = targetLanguage.split('-')[0];

    // Use Google Translate's unofficial API
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    let response = await fetch(url);
    let data = await response.json();

    // Extract translated text from Google's response
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
 * Speaks the provided text using Cartesia's TTS API via WebSocket
 */
export const speakText = async (text: string, language: string): Promise<void> => {
  try {
    if (!text.trim()) {
      return;
    }

  // dont say stuff we already said
    if (spokenTexts.has(text)) {
      console.log('Text already spoken, skipping:', text);
      return;
    }

    // add text to set of already spoken texts
    spokenTexts.add(text);

    let lang = language.split('-')[0];

    // Get the API key
    let response = await fetch('/api/tts');
    let { apiKey } = await response.json();

    if (!apiKey) {
      throw new Error('TTS API key not found');
    }

    // Create WebSocket connection
    let ws = new WebSocket(`wss://api.cartesia.ai/tts/websocket?cartesia_version=2024-06-10&api_key=${apiKey}`);

    return new Promise((resolve, reject) => {
      let audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let contextId = `tts-${Date.now()}`;
      let audioQueue: Float32Array[] = [];
      let isPlaying = false;
      let hasStartedPlaying = false;

      // Function to play the next audio chunk
      const playNextChunk = () => {
        if (audioQueue.length === 0 || isPlaying) return;

        isPlaying = true;
        hasStartedPlaying = true;
        let chunk = audioQueue.shift()!;
        
        let buffer = audioCtx.createBuffer(1, chunk.length, 44100);
        buffer.copyToChannel(chunk, 0);

        let source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          isPlaying = false;
          playNextChunk();
        };

        source.start();
      };

      ws.onopen = () => {
        // Get the appropriate voice ID for the language
        let voiceId = VOICE_IDS[lang] || DEFAULT_VOICE_ID;

        // Send the TTS request
        ws.send(JSON.stringify({
          model_id: 'sonic-2',
          transcript: text,
          voice: {
            mode: 'id',
            id: voiceId,
            __experimental_controls: {
              speed: 'normal',
              emotion: ['positivity']
            }
          },
          language: lang,
          context_id: contextId,
          output_format: {
            container: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: 44100
          },
          continue: false
        }));
      };

      ws.onmessage = async (event) => {
        try {
          let msg = JSON.parse(event.data);

          if (msg.type === 'chunk' && msg.data) {
            // Convert base64 to audio data
            let raw = atob(msg.data);
            let audio = new Int16Array(raw.length / 2);
            
            // Process the raw binary data into Int16Array
            for (let i = 0; i < raw.length; i += 2) {
              let byte1 = raw.charCodeAt(i);
              let byte2 = raw.charCodeAt(i + 1);
              // Combine two bytes into one 16-bit integer
              audio[i / 2] = (byte2 << 8) | byte1;
            }

            // Convert Int16Array to Float32Array (normalize to [-1, 1])
            let float = new Float32Array(audio.length);
            for (let i = 0; i < audio.length; i++) {
              float[i] = audio[i] / 32768.0; // Normalize 16-bit integer to float
            }

            // Add to queue and try to play
            audioQueue.push(float);
            playNextChunk();
          } else if (msg.type === 'error') {
            console.error('TTS error:', msg.error);
            reject(new Error(msg.error));
          } else if (msg.type === 'done') {
            // Wait for all audio to finish playing before resolving
            let checkQueue = setInterval(() => {
              if (audioQueue.length === 0 && !isPlaying) {
                clearInterval(checkQueue);
                // Only mark as spoken if we actually played something
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

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        // Clean up if not already resolved
        resolve();
      };
    });
  } catch (error) {
    console.error('Error speaking text:', error);
    throw error;
  }
};

// Function to clear the spoken text cache
export const clearSpokenTexts = () => {
  spokenTexts.clear();
}; 