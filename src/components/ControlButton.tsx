import React from 'react';

/**
 * Props interface for the ControlButton component
 * I kept it minimal but made sure it handles all states we need
 */
interface ControlButtonProps {
  isListening: boolean;   // Current recording state
  onClick: () => void;    // Click handler for toggling recording
  disabled?: boolean;     // Optional disabled state
}

/**
 * ControlButton Component
 * A dynamic button that controls the speech recording state.
 * I added some cool features:
 * - Color changes based on state (purple/indigo gradient for start, red for stop)
 * - Smooth transitions and hover effects
 * - Icons that change with state
 * - Disabled state handling
 * - Responsive design
 * 
 * @param props - See ControlButtonProps interface
 */
const ControlButton: React.FC<ControlButtonProps> = ({ 
  isListening, 
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-full font-medium text-white transition-all
        flex items-center justify-center gap-2
        ${isListening 
          ? 'bg-red-500 hover:bg-red-600' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Dynamic content based on listening state */}
      {isListening ? (
        <>
          <StopIcon />
          Stop Listening
        </>
      ) : (
        <>
          <MicIcon />
          Start Listening
        </>
      )}
    </button>
  );
};

/**
 * Microphone Icon Component
 * 
 * A clean, minimal microphone SVG icon.
 * I used Feather icons for their modern look!
 */
const MicIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
);

/**
 * Stop Icon Component
 * A simple stop button SVG icon.
 * Matches the style of the mic icon for consistency.
 */
const StopIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="5" y="5" rx="2"></rect>
  </svg>
);

export default ControlButton; 