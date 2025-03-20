/* eslint-disable prefer-const */
'use client';

/**
 * Deepgram for speech recognition, and Google Translate API for translation
 * - React hooks and state management
 * - Real-time audio processing
 * - API integration
 * - Error handling
 * - Responsive UI design
 */

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import TranslationDisplay from '@/components/TranslationDisplay';
import ControlButton from '@/components/ControlButton';
import LanguageSelector from '@/components/LanguageSelector';
import { useDeepgram } from '@/hooks/useDeepgram';
import { translateText, speakText, clearSpokenTexts } from '@/utils/translationUtils';

// Known Issues:
// - Chrome occasionally has audio initialization issues
// - Safari compatibility needs improvement
export default function Home() {
  // State management for language selection and translation
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  /**
   * Handles real-time translation of transcribed text
   * I implemented this using useCallback to optimize performance and prevent
   * unnecessary re-renders
   */
  const handleTranscriptUpdate = useCallback(async (newTranscript: string, isFinal: boolean) => {
    if (!newTranscript.trim() || sourceLanguage === targetLanguage) return;

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      // Using Google Translate API for translation
      let result = await translateText(
        newTranscript,
        sourceLanguage,
        targetLanguage
      );

      if (isFinal) {
        setTranslatedText(result);

        // Auto-speak feature for better user experience
        if (autoSpeak && result) {
          try {
            await speakText(result, targetLanguage);
          } catch (err) {
            // Speech synthesis errors are non-critical
            console.log('Speech synthesis error:', err);
          }
        }
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setTranslationError(err.message || 'Translation service unavailable');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, autoSpeak]);

  // Initialize Deepgram for speech recognition
  const {
    isListening,
    transcript,
    error,
    isLoading,
    startListening,
    stopListening,
    clearTranscript
  } = useDeepgram({ 
    language: sourceLanguage,
    onTranscriptUpdate: handleTranscriptUpdate
  });

  /**
   * Toggles the speech recognition on/off
   * I made sure to clean up previous state when starting new sessions
   */
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      clearSpokenTexts();
    } else {
      startListening();
      setTranslatedText('');
    }
  };

  // Language selection handlers with smart language swapping
  const handleSourceLanguageChange = (language: string) => {
    if (isListening) return;

    if (language === targetLanguage) {
      setTargetLanguage(language === 'en' ? 'es' : 'en');
    }
    setSourceLanguage(language);
  };

  const handleTargetLanguageChange = (language: string) => {
    if (language === sourceLanguage) {
      setSourceLanguage(language === 'en' ? 'es' : 'en');
    }
    setTargetLanguage(language);
  };
  
  /**
   * Manual text-to-speech trigger
   * Added error handling for robustness
   */
  const handleSpeak = useCallback(() => {
    if (!translatedText || isTranslating) return;
    
    speakText(translatedText, targetLanguage)
      .catch(err => console.error('Speech synthesis error:', err));
  }, [translatedText, targetLanguage, isTranslating]);
  
  /**
   * Resets all state for a fresh start
   * Using useCallback to maintain consistent reference
   */
  const handleClearAll = useCallback(() => {
    clearTranscript();
    setTranslatedText('');
    setTranslationError(null);
    clearSpokenTexts();
  }, [clearTranscript]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-[#0f0f0f]">
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center">
        <Header />
        
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 mt-8">
          {/* language stuff */}
          <div className="w-full glass-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Language Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LanguageSelector
                selectedLanguage={sourceLanguage}
                onChange={handleSourceLanguageChange}
                label="Source Language"
                disabled={isListening}
                otherLanguage={targetLanguage}
              />
              <LanguageSelector
                selectedLanguage={targetLanguage}
                onChange={handleTargetLanguageChange}
                label="Target Language"
                disabled={isListening}
                otherLanguage={sourceLanguage}
              />
            </div>
            <div className="mt-4 flex items-center">
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={e => setAutoSpeak(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-700 bg-gray-800 focus:ring-purple-500"
                />
                <span>Auto-speak translations</span>
              </label>
            </div>
          </div>
          
          <TranscriptionDisplay 
            transcript={transcript} 
            isListening={isListening} 
          />
          
          <TranslationDisplay
            translatedText={translatedText}
            isTranslating={isTranslating}
            targetLanguage={targetLanguage}
            onSpeak={handleSpeak}
          />
          
          {/* buttons and stuff */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <ControlButton 
              isListening={isListening} 
              onClick={handleToggleListening}
              disabled={isLoading}
            />
            
            {(transcript || translatedText) && (
              <button
                onClick={handleClearAll}
                className="px-6 py-3 rounded-full font-medium text-white bg-gray-600 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* show errors if stuff breaks */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200">
              {error}
            </div>
          )}
          
          {translationError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200">
              Translation Error: {translationError}
            </div>
          )}
          
          {/* instructions for users */}
          <div className="mt-8 p-6 glass-card w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">How to use:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Select your source and target languages</li>
              <li>Click the <strong>Start Listening</strong> button to begin recording audio</li>
              <li>Speak clearly into your microphone</li>
              <li>Your speech will be transcribed in real-time</li>
              <li>Click the <strong>Speak</strong> button to hear the translation</li>
              <li>Use the <strong>Clear All</strong> button to start fresh</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
