import React from 'react';

/**
 * Props interface for the TranscriptionDisplay component
 * Keeping it simple with just what we need!
 */
interface TranscriptionDisplayProps {
  transcript: string;     // The current transcribed text
  isListening: boolean;   // Whether we're actively listening for speech
}

/**
 * TranscriptionDisplay Component
 * This component shows the real-time transcription of speech.
 * I implemented some cool features using v0 here:
 * - A pulsing indicator to show listening status
 * - Scrollable container for long transcriptions
 * - Helpful placeholder text for better UX
 * - Glass-card design for modern look
 * @param props - See TranscriptionDisplayProps interface
 */
const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  transcript, 
  isListening 
}) => {
  return (
    <div className="glass-card p-6 w-full max-w-3xl min-h-[200px] flex flex-col">
      {/* Status indicator with pulsing animation when listening */}
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          isListening ? 'bg-green-500 pulse-animation' : 'bg-gray-500'
        }`}></div>
        <span className="text-sm font-medium">
          {isListening ? 'Listening...' : 'Not listening'}
        </span>
      </div>
      
      {/* Transcription display area with auto-scroll */}
      <div className="flex-1 overflow-y-auto">
        {transcript ? (
          <p className="text-lg">{transcript}</p>
        ) : (
          <p className="text-gray-400 italic">
            {isListening 
              ? "Speak now... I'm listening" 
              : "Click 'Start Listening' to begin transcription"}
          </p>
        )}
      </div>
    </div>
  );
};

export default TranscriptionDisplay; 