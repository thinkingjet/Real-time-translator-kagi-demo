import React from 'react';

interface TranscriptionDisplayProps {
  transcript: string;
  isListening: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  transcript, 
  isListening 
}) => {
  return (
    <div className="glass-card p-6 w-full max-w-3xl min-h-[200px] flex flex-col">
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full mr-2 ${isListening ? 'bg-green-500 pulse-animation' : 'bg-gray-500'}`}></div>
        <span className="text-sm font-medium">
          {isListening ? 'Listening...' : 'Not listening'}
        </span>
      </div>
      
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