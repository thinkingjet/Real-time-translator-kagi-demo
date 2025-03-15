import { useState, useEffect, useCallback, useRef } from 'react';
import { createDeepgramSocket, startRecording, stopRecording } from '@/utils/deepgramUtils';

interface UseDeepgramOptions {
  language?: string;
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
}

// found this hook pattern on stackoverflow, pretty neat
export const useDeepgram = (options: UseDeepgramOptions = {}) => {
  const { language = 'en', onTranscriptUpdate } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  
   // refs so stuff doesnt break (learned this the hard way lol) 
  const socket = useRef<WebSocket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const apiKey = useRef<string | null>(null);
  
  useEffect(() => {
        // grab the api key when component loads
    const getApiKey = async () => {
      try {
        let response = await fetch('/api/deepgram');
        let data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        apiKey.current = data.apiKey;
      } catch (err) {
        setError('couldnt get api key :( try again later');
        console.log('api key error:', err);
      }
    };
    
    getApiKey();
        // cleanup stuff when component dies

    return () => {
      if (socket.current) {
        socket.current.close();
      }
      
      if (recorder.current?.state !== 'inactive') {
        recorder.current.stop();
      }
    };
  }, []);

    // handle new transcripts coming in
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
  
    // start listening to mic input
  const startListening = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!apiKey.current) {
        throw new Error('no api key :(');
      }
            // connect to deepgram websocket
      let ws = createDeepgramSocket(apiKey.current, language);
      socket.current = ws;
      
            // wait for connection (this is kinda crazy but somehow works)
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
      
            // start recording audio
      let rec = await startRecording(ws, handleTranscriptUpdate);
      recorder.current = rec;
      
      setIsListening(true);
    } catch (err: any) {
      console.log('listening error:', err);
      setError(err.message || 'failed to start listening');
    } finally {
      setIsLoading(false);
    }
  }, [handleTranscriptUpdate, language]);
  
    // stop listening and cleanup
  const stopListening = useCallback(() => {
    stopRecording(recorder.current, socket.current);
    setIsListening(false);
  }, []);
    // reset everything
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