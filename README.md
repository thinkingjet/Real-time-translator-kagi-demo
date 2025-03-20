- AI generated README

# Real-Time Translator Demo

A powerful real-time speech translation application that combines cutting-edge speech recognition, translation, and text-to-speech technologies. This project demonstrates advanced audio processing, WebSocket streaming, and React hooks implementation.

## Features

- **Real-Time Speech Recognition**: Using Deepgram's Nova-2 model for high-accuracy transcription
- **Instant Translation**: Powered by Google Translate's API for fast and accurate translations
- **Natural Text-to-Speech**: High-quality voice synthesis using Cartesia's TTS API
- **Multiple Language Support**: Works with numerous languages including:
  - English
  - German
  - Portuguese
  - Chinese
  - Japanese
  - French
  - Spanish
  - Hindi
  - Italian
  - Korean
  - Dutch
  - Polish
  - Russian
  - Swedish
  - Turkish

## Technical Implementation

### Core Components

1. **Speech Recognition (`useDeepgram` Hook)**
   - WebSocket-based real-time audio streaming
   - Automatic punctuation and voice activity detection
   - Interim results for responsive feedback
   - Smart cleanup and resource management

2. **Translation System**
   - Low-latency translation pipeline
   - Language code normalization
   - Error handling and retry logic
   - Efficient caching system

3. **Text-to-Speech Engine**
   - WebSocket streaming for minimal latency
   - CD-quality audio output (44.1kHz)
   - Language-specific voice selection
   - Smart audio queue management
   - Duplicate speech prevention

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with WebSocket support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/real-time-translator-kagi-demo.git
cd real-time-translator-kagi-demo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:3000`

## API Keys

You'll need API keys from:
- [Deepgram](https://deepgram.com) for speech recognition
- [Cartesia](https://cartesia.ai) for text-to-speech

Store these securely in your environment variables.

## Architecture

The project uses a modern React architecture with:
- Custom hooks for state management
- WebSocket connections for real-time communication
- Utility modules for core functionality
- TypeScript for type safety
- Next.js for the framework

### Key Files

- `src/hooks/useDeepgram.ts`: Speech recognition hook
- `src/utils/deepgramUtils.ts`: Deepgram integration utilities
- `src/utils/translationUtils.ts`: Translation and TTS utilities

## Performance Optimizations

- Audio streaming in chunks for low latency
- Smart caching to prevent duplicate speech
- Efficient audio queue management
- Resource cleanup on unmount
- Optimized WebSocket connections

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Deepgram for speech recognition API
- Google Translate for translation services
- Cartesia for text-to-speech capabilities 
