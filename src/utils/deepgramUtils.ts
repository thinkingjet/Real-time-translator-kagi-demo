/**
 * Deepgram Utilities
 * 
 * This module contains utilities for working with Deepgram's WebSocket API.
 * I implemented real-time speech recognition with these features:
 * - WebSocket connection management
 * - Audio streaming from microphone
 * - Response parsing and handling
 * - Proper cleanup and resource management
 * 
 * The implementation follows best practices for:
 * - TypeScript type safety
 * - Error handling
 * - Resource cleanup
 * - Real-time data streaming
 */

/**
 * Interface for Deepgram's WebSocket response
 * I mapped out their API response structure for better type safety
 */
export interface DeepgramResponse {
  type?: string;                 // Message type (e.g., 'Results')
  channel?: {                    // Audio channel info
    alternatives?: Array<{       // Possible transcriptions
      transcript?: string;       // The transcribed text
      confidence?: number;       // Confidence score
      words?: Array<{           // Individual word details
        word?: string;          // The word
        start?: number;         // Start time
        end?: number;           // End time
        confidence?: number;     // Word confidence
        punctuated_word?: string; // Word with punctuation
      }>;
    }>;
  };
  is_final?: boolean;           // Whether this is a final result
  speech_final?: boolean;       // Whether speech has ended
}

/**
 * Creates a WebSocket connection to Deepgram's API
 * 
 * I configured it with optimal settings for real-time transcription:
 * - Nova-2 model for better accuracy
 * - Automatic punctuation
 * - Interim results for real-time feedback
 * - Voice activity detection
 * 
 * @param apiKey - Deepgram API key
 * @param language - Target language (default: 'en')
 * @param options - Additional WebSocket options
 * @returns WebSocket connection
 */
export const createDeepgramSocket = (
  apiKey: string, 
  language: string = 'en',
  options: Record<string, string> = {}
): WebSocket => {
  // Configure WebSocket parameters for optimal performance
  const queryParams = new URLSearchParams({
    model: 'nova-2',            // Latest model for better accuracy
    punctuate: 'true',          // Add punctuation automatically
    interim_results: 'true',     // Get real-time partial results
    endpointing: '500',         // Smart silence detection
    vad_events: 'true',         // Voice activity detection
    language,
    ...options
  }).toString();

  // Create secure WebSocket connection
  const socket = new WebSocket(
    `wss://api.deepgram.com/v1/listen?${queryParams}`,
    ['token', apiKey]           // Auth via WebSocket protocol
  );
  
  // Set up logging for connection status
  socket.onopen = () => {
    console.log('Deepgram WebSocket connection established');
  };

  socket.onerror = (error) => {
    console.error('Deepgram WebSocket error:', error);
  };

  return socket;
};

/**
 * Starts recording audio and streaming to Deepgram
 * 
 * This function handles:
 * - Microphone access permission
 * - Audio recording setup
 * - Real-time streaming to Deepgram
 * - Response processing
 * 
 * @param socket - WebSocket connection to Deepgram
 * @param onTranscriptUpdate - Callback for transcription updates
 * @returns MediaRecorder instance
 */
export const startRecording = async (
  socket: WebSocket,
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void
): Promise<MediaRecorder> => {
  try {
    // Get microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Setup audio recording
    const mediaRecorder = new MediaRecorder(stream);
    
    // Configure event handlers for recording states
    mediaRecorder.onstart = () => {
      console.log('Recording started');
    };
    
    mediaRecorder.onstop = () => {
      console.log('Recording stopped');
      stream.getTracks().forEach(track => track.stop());  // Clean up audio tracks
    };
    
    // Stream audio data to Deepgram in real-time
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };
    
    // Process incoming transcription results
    socket.onmessage = (message) => {
      try {
        const response = JSON.parse(message.data) as DeepgramResponse;
        
        // Handle transcription results
        if (response.type === 'Results' && response.channel?.alternatives?.[0]) {
          const transcript = response.channel.alternatives[0].transcript || '';
          const isFinal = response.is_final || false;
          
          if (transcript.trim()) {
            onTranscriptUpdate(transcript, isFinal);
          }
        }
      } catch (error) {
        console.error('Error parsing Deepgram response:', error);
      }
    };
    
    // Start recording with 250ms chunks for smooth streaming
    mediaRecorder.start(250);
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

/**
 * Stops recording and closes connections
 * 
 * Handles cleanup of:
 * - MediaRecorder instance
 * - WebSocket connection
 * - Audio stream
 * 
 * @param mediaRecorder - MediaRecorder to stop
 * @param socket - WebSocket to close
 */
export const stopRecording = (mediaRecorder: MediaRecorder | null, socket: WebSocket | null) => {
  // Stop recording if active
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  // Close WebSocket connection gracefully
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Notify Deepgram we're done
    socket.send(JSON.stringify({ type: 'CloseStream' }));
    
    // Close socket after ensuring message is sent
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    }, 300);
  }
}; 