/* eslint-disable prefer-const */
'use client';

/**
 * Multi-User Real-Time Translation Room
 * 
 * This application enables real-time multilingual communication between users.
 * Key features:
 * - English-only speech input
 * - Real-time translation to users' preferred languages
 * - WebSocket-based communication
 * - Text-to-speech output for translations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import TranscriptionDisplay from '@/components/TranscriptionDisplay';
import TranslationDisplay from '@/components/TranslationDisplay';
import ControlButton from '@/components/ControlButton';
import UsersList from '@/components/UsersList';
import IncomingTranslations from '@/components/IncomingTranslations';
import UserProfileForm from '@/components/UserProfileForm';
import { useDeepgram } from '@/hooks/useDeepgram';
import { useSocket, TranslationMessage } from '@/hooks/useSocket';
import { translateText, speakText, clearSpokenTexts, speakTextForced } from '@/utils/translationUtils';

export default function Home() {
  // User profile and room state
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  
  // Language settings - source is fixed to English
  const sourceLanguage = 'en';
  const [targetLanguage, setTargetLanguage] = useState('es');
  
  // Translation and speech state
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // Multi-user state
  const [incomingTranslations, setIncomingTranslations] = useState<TranslationMessage[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  
  // Track speaking users with debounce
  const addSpeakingUser = useCallback((userId: string) => {
    setSpeakingUsers(prev => {
      const newSet = new Set(prev);
      newSet.add(userId);
      return newSet;
    });
  }, []);
  
  const removeSpeakingUser = useCallback((userId: string) => {
    setSpeakingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Socket.io integration for multi-user functionality
  const { 
    isConnected,
    users,
    joinRoom,
    updateLanguages,
    sendSpeech
  } = useSocket({
    onTranslation: (message) => {
      setIncomingTranslations(prev => [...prev, message]);
      
      // Update speaking indicator
      if (!message.isFinal) {
        addSpeakingUser(message.userId);
        
        // Remove speaking indicator after 2 seconds if no more updates
        const timerId = setTimeout(() => {
          removeSpeakingUser(message.userId);
        }, 2000);
        
        return () => clearTimeout(timerId);
      } else {
        // Clear speaking indicator after final message
        setTimeout(() => {
          removeSpeakingUser(message.userId);
        }, 500);
      }
    }
  });

  // Effect to join the room when the connection is established
  useEffect(() => {
    if (isJoined && isConnected && userName) {
      console.log('Connection established, joining room');
      joinRoom(userName, sourceLanguage, targetLanguage);
    }
  }, [isJoined, isConnected, userName, sourceLanguage, targetLanguage, joinRoom]);

  // Current socket ID (our user ID)
  const socketId = useMemo(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      return window.socket?.id;
    }
    return undefined;
  }, [isConnected]);

  // Deepgram integration for speech recognition (English only)
  const handleTranscriptUpdate = useCallback(async (newTranscript: string, isFinal: boolean) => {
    if (!newTranscript.trim()) return;

    try {
      // For our own display
      if (sourceLanguage !== targetLanguage) {
        setIsTranslating(true);
        setTranslationError(null);
        
        let result = await translateText(
          newTranscript,
          sourceLanguage,
          targetLanguage
        );

        if (isFinal) {
          setTranslatedText(result);

          // Removed auto-speak for own translations as requested
          // User can still manually play it if needed via the button
        }
      } else {
        if (isFinal) {
          setTranslatedText(newTranscript);
        }
      }
      
      // Send to other users via WebSocket
      if (isJoined && isConnected) {
        sendSpeech(newTranscript, isFinal);
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setTranslationError(err.message || 'Translation service unavailable');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, autoSpeak, isJoined, isConnected, sendSpeech]);

  // Initialize Deepgram for English speech recognition
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

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      clearSpokenTexts();
    } else {
      startListening();
      setTranslatedText('');
    }
  };

  const handleTargetLanguageChange = (language: string) => {
    setTargetLanguage(language);
    
    // Update preferences in the room if joined
    if (isJoined && isConnected) {
      updateLanguages(sourceLanguage, language);
    }
  };
  
  const handleSpeak = useCallback(() => {
    if (!translatedText || isTranslating) return;
    
    // Using speakTextForced to allow manual playback of own translations
    // This is for the manual "Speak" button only
    speakTextForced(translatedText, targetLanguage)
      .catch(err => console.error('Speech synthesis error:', err));
  }, [translatedText, targetLanguage, isTranslating]);
  
  const handleClearAll = useCallback(() => {
    clearTranscript();
    setTranslatedText('');
    setTranslationError(null);
    clearSpokenTexts();
  }, [clearTranscript]);
  
  const handleJoinRoom = useCallback((name: string, tgtLang: string) => {
    setUserName(name);
    setTargetLanguage(tgtLang);
    setIsJoined(true);
    
    // Join the room with Socket.io
    joinRoom(name, sourceLanguage, tgtLang);
  }, [joinRoom]);
  
  const handleClearIncoming = useCallback(() => {
    setIncomingTranslations([]);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-[#0f0f0f]">
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center">
        <Header />
        
        {!isJoined ? (
          <UserProfileForm 
            onJoin={handleJoinRoom}
            initialTargetLanguage={targetLanguage}
          />
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8 mt-8">
            {/* Connection status */}
            <div className="w-full flex justify-end">
              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            {/* Users list */}
            <UsersList 
              users={users} 
              currentUserId={socketId} 
              speakingUsers={speakingUsers}
            />
            
            {/* Language settings */}
            <div className="w-full glass-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">My Language Settings</h2>
              <div className="space-y-4">
                <div className="text-gray-300">
                  <span className="font-medium">Speaking Language:</span> English
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Translate To
                  </label>
                  <div className="max-w-xs">
                    <select
                      value={targetLanguage}
                      onChange={(e) => handleTargetLanguageChange(e.target.value)}
                      className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isListening}
                    >
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="nl">Dutch</option>
                      <option value="pl">Polish</option>
                      <option value="ru">Russian</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
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
            
            {/* My transcription section */}
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
            
            {/* Incoming translations section */}
            <IncomingTranslations 
              messages={incomingTranslations}
              autoSpeak={autoSpeak}
              currentUserId={socketId || ''}
            />
            
            {/* Control buttons */}
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
                  Clear My Speech
                </button>
              )}
              
              {incomingTranslations.length > 0 && (
                <button
                  onClick={handleClearIncoming}
                  className="px-6 py-3 rounded-full font-medium text-white bg-gray-600 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  Clear Incoming
                </button>
              )}
            </div>
            
            {/* Error messages */}
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
          </div>
        )}
      </main>
    </div>
  );
}
