
export interface DeepgramResponse {
  type?: string;
  channel?: {
    alternatives?: Array<{
      transcript?: string;
      confidence?: number;
      words?: Array<{
        word?: string;
        start?: number;
        end?: number;
        confidence?: number;
        punctuated_word?: string;
      }>;
    }>;
  };
  is_final?: boolean;
  speech_final?: boolean;
}

// Function to create WebSocket connection to Deepgram
export const createDeepgramSocket = (
  apiKey: string, 
  language: string = 'en',
  options: Record<string, string> = {}
): WebSocket => {
  // Construct query parameters
  const queryParams = new URLSearchParams({
    model: 'nova-2',
    punctuate: 'true',
    interim_results: 'true',
    endpointing: '500',
    vad_events: 'true',
    language,
    ...options
  }).toString();

  // Create WebSocket connection with authorization header
  const socket = new WebSocket(
    `wss://api.deepgram.com/v1/listen?${queryParams}`,
    ['token', apiKey] // Add authorization as WebSocket protocol
  );
  
  // Set up event handlers
  socket.onopen = () => {
    console.log('Deepgram WebSocket connection established');
  };

  socket.onerror = (error) => {
    console.error('Deepgram WebSocket error:', error);
  };

  return socket;
};

// Function to start recording audio and streaming to Deepgram
export const startRecording = async (
  socket: WebSocket,
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void
): Promise<MediaRecorder> => {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create media recorder
    const mediaRecorder = new MediaRecorder(stream);
    
    // Set up event handlers
    mediaRecorder.onstart = () => {
      console.log('Recording started');
    };
    
    mediaRecorder.onstop = () => {
      console.log('Recording stopped');
      stream.getTracks().forEach(track => track.stop());
    };
    
    // Handle audio data
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };
    
    // Handle incoming messages from Deepgram
    socket.onmessage = (message) => {
      try {
        const response = JSON.parse(message.data) as DeepgramResponse;
        
        // Check if it's a transcription result
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
    
    // Start recording
    mediaRecorder.start(250); // Send data every 250ms
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

// Function to stop recording
export const stopRecording = (mediaRecorder: MediaRecorder | null, socket: WebSocket | null) => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Send close stream message
    socket.send(JSON.stringify({ type: 'CloseStream' }));
    
    // Close the socket after a short delay to ensure the message is sent
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    }, 300);
  }
}; 