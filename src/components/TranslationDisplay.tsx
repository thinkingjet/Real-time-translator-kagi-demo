
import React from 'react';

interface TranslationDisplayProps {
  translatedText: string;
  isTranslating: boolean;
  targetLanguage: string;
  onSpeak: () => void;
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  translatedText,
  isTranslating,
  targetLanguage,
  onSpeak,
}) => {
  return (
    <div className="glass-card p-6 w-full max-w-3xl min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isTranslating ? 'bg-yellow-500 pulse-animation' : 'bg-gray-500'}`}></div>
          <span className="text-sm font-medium">
            {isTranslating ? 'Translating...' : 'Translation'}
          </span>
        </div>
        
        {translatedText && (
          <button
            onClick={onSpeak}
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <SpeakerIcon />
            Speak
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {translatedText ? (
          <p className="text-lg">{translatedText}</p>
        ) : (
          <p className="text-gray-400 italic">
            {isTranslating 
              ? "Translating your speech..." 
              : "Translated text will appear here"}
          </p>
        )}
      </div>
    </div>
  );
};

// Speaker icon component
const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);

export default TranslationDisplay; 