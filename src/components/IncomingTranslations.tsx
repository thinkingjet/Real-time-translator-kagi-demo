/**
 * IncomingTranslations Component
 * 
 * Displays incoming translations from other users in the room.
 * Messages are grouped by user and show both the original and translated text.
 * 
 * Features I added:
 * - Message grouping by user
 * - Original text display with translation
 * - Auto-scrolling to latest messages
 * - Visual indication of which language is being spoken
 * - Text-to-speech button for translations
 */

import { useEffect, useRef, useState } from 'react';
import { TranslationMessage } from '@/hooks/useSocket';
import { speakText, speakTextForced } from '@/utils/translationUtils';

interface IncomingTranslationsProps {
  messages: TranslationMessage[];
  autoSpeak: boolean;
  currentUserId: string; // Add current user ID to identify own messages
}

export default function IncomingTranslations({ messages, autoSpeak, currentUserId }: IncomingTranslationsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spokenMessages, setSpokenMessages] = useState<Set<string>>(new Set());
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-speak incoming final translations if enabled
  useEffect(() => {
    if (!autoSpeak || messages.length === 0) return;
    
    const latestMessage = messages[messages.length - 1];
    
    // Skip auto-speak for own messages
    if (latestMessage.userId === currentUserId) {
      return;
    }
    
    // Only speak final messages that haven't been spoken yet
    if (
      latestMessage.isFinal && 
      latestMessage.translatedText.trim() && 
      !spokenMessages.has(latestMessage.translatedText)
    ) {
      speakText(latestMessage.translatedText, latestMessage.targetLanguage)
        .then(() => {
          // Mark as spoken
          setSpokenMessages(prev => new Set(prev).add(latestMessage.translatedText));
        })
        .catch(err => console.error('Error speaking translation:', err));
    }
  }, [messages, autoSpeak, currentUserId]);

  // Handle manual speak button click
  const handleSpeak = (messageId: string, text: string, language: string) => {
    if (text.trim()) {
      // Set the currently speaking message
      setSpeakingMessageId(messageId);
      
      // Use speakTextForced to allow replaying already spoken messages
      speakTextForced(text, language)
        .then(() => {
          // Clear speaking state when done
          setSpeakingMessageId(null);
        })
        .catch(err => {
          console.error('Error speaking translation:', err);
          setSpeakingMessageId(null);
        });
    }
  };

  // Generate a unique ID for each message for tracking speaking state
  const getMessageId = (message: TranslationMessage): string => {
    return `${message.userId}-${message.timestamp}-${message.translatedText.substring(0, 10)}`;
  };

  // Group messages by user for better display
  const groupedMessages = messages.reduce((groups, message) => {
    const userId = message.userId;
    if (!groups[userId]) {
      groups[userId] = [];
    }
    groups[userId].push(message);
    return groups;
  }, {} as Record<string, TranslationMessage[]>);

  return (
    <div className="glass-card p-6 w-full mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Incoming Translations</h2>
      
      <div 
        ref={containerRef}
        className="max-h-[300px] overflow-y-auto pr-2 space-y-6"
      >
        {Object.entries(groupedMessages).length === 0 ? (
          <p className="text-gray-400 italic">No incoming translations yet</p>
        ) : (
          Object.entries(groupedMessages).map(([userId, userMessages]) => {
            // Get the latest message for this user
            const latestMessage = userMessages[userMessages.length - 1];
            const messageId = getMessageId(latestMessage);
            const isSpeaking = speakingMessageId === messageId;
            const isOwnMessage = userId === currentUserId;
            
            return (
              <div key={userId} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg text-gray-200">
                    {latestMessage.userName} {isOwnMessage && "(You)"}
                  </h3>
                  
                  {/* Language indicator */}
                  <div className="text-sm text-gray-400">
                    {(latestMessage.sourceLanguage || 'EN').toUpperCase()} → {latestMessage.targetLanguage?.toUpperCase() || 'EN'}
                  </div>
                </div>
                
                {/* Original text */}
                <div className="mb-2">
                  <p className="text-sm text-gray-400 mb-1">Original:</p>
                  <p className="text-gray-300 bg-gray-800/50 p-2 rounded">
                    {latestMessage.originalText}
                  </p>
                </div>
                
                {/* Translated text */}
                <div className="mb-2">
                  <p className="text-sm text-gray-400 mb-1">Translated:</p>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-white bg-gray-700/50 p-2 rounded">
                      {latestMessage.translatedText}
                    </p>
                    
                    {/* Text-to-speech button - only show for others' messages */}
                    {!isOwnMessage && (
                      <button
                        onClick={() => handleSpeak(messageId, latestMessage.translatedText, latestMessage.targetLanguage || 'en')}
                        className={`p-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                          isSpeaking 
                            ? 'bg-purple-800 animate-pulse' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        aria-label="Speak translation"
                        title="Speak translation"
                        disabled={isSpeaking}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          className="w-5 h-5"
                        >
                          <path 
                            d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zm5.084 1.046a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 