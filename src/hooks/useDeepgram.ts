//@ts-nocheck

/**
 * useDeepgram Custom Hook
 * 
 * This is a custom React hook I built to handle real-time speech recognition
 * using Deepgram's WebSocket API. I learned a lot implementing this:
 * - WebSocket management
 * - MediaRecorder API for audio capture
 * - Real-time data streaming
 * - React hooks and cleanup patterns
 * - TypeScript interfaces
 * 
 * Key Features:
 * - Real-time transcription with interim results
 * - Automatic cleanup on unmount
 * - Error handling and loading states
 * - Language selection support
 * - Secure API key management
 * 
 * @example
 * ```tsx
 * const {
 *   isListening,
 *   transcript,
 *   startListening,
 *   stopListening
 * } = useDeepgram({
 *   language: 'en',
 *   onTranscriptUpdate: (text, isFinal) => console.log(text)
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createDeepgramSocket, startRecording, stopRecording } from '@/utils/deepgramUtils';

/**
 * Configuration options for the useDeepgram hook
 */
interface UseDeepgramOptions {
  language?: string;                                           // Target language for transcription
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;  // Callback for updates
}

export const useDeepgram = (options: UseDeepgramOptions = {}) => {
  const { language = 'en', onTranscriptUpdate } = options;
  
  // State management for the transcription process
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  
  // Using refs to maintain WebSocket and MediaRecorder instances
  // This prevents issues with stale closures in callbacks
  const socket = useRef<WebSocket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const apiKey = useRef<string | null>(null);
  
  // Setup and cleanup effect
  useEffect(() => {
    // Fetch the API key securely from our backend
    const getApiKey = async () => {
      try {
        let response = await fetch('/api/deepgram');
        let data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        apiKey.current = data.apiKey;
      } catch (err) {
        setError('Failed to initialize speech recognition');
        console.error('API key error:', err);
      }
    };
    
    getApiKey();

    // Cleanup function to handle component unmount
    return () => {
      if (socket.current) {
        socket.current.close();
      }
      
      if (recorder.current?.state !== 'inactive') {
        recorder.current.stop();
      }
    };
  }, []);

  /**
   * Handle incoming transcription updates
   * Uses useCallback to maintain consistent reference
   */
  const handleTranscriptUpdate = useCallback((newTranscript: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(newTranscript);
      if (onTranscriptUpdate) {
        onTranscriptUpdate(newTranscript, true);
      }
    } else {
      if (onTranscriptUpdate) {
        onTranscriptUpdate(newTranscript, false);
      }
    }
  }, [onTranscriptUpdate]);
  
  /**
   * Start the speech recognition process
   * Handles WebSocket connection and audio recording setup
   */
  const startListening = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!apiKey.current) {
        throw new Error('Speech recognition not initialized');
      }

      // Initialize WebSocket connection
      let ws = createDeepgramSocket(apiKey.current, language);
      socket.current = ws;
      
      // Wait for WebSocket connection to establish
      await new Promise<void>((resolve, reject) => {
        let originalOpen = ws.onopen;
        
        ws.onopen = (event) => {
          if (originalOpen) {
            originalOpen.call(ws, event);
          }
          resolve();
        };
        
        ws.onerror = (error) => {
          reject(error);
        };
      });
      
      // Start recording audio once connected
      let rec = await startRecording(ws, handleTranscriptUpdate);
      recorder.current = rec;
      
      setIsListening(true);
    } catch (err: any) {
      console.error('Recording error:', err);
      setError(err.message || 'Failed to start speech recognition');
    } finally {
      setIsLoading(false);
    }
  }, [handleTranscriptUpdate, language]);
  
  /**
   * Stop speech recognition and cleanup resources
   */
  const stopListening = useCallback(() => {
    stopRecording(recorder.current, socket.current);
    setIsListening(false);
  }, []);

  /**
   * Reset the transcript state
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  return {
    isListening,
    transcript,
    error,
    isLoading,
    startListening,
    stopListening,
    clearTranscript
  };
}; 