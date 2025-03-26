# VoiceFlow Translator | Real-time Multi-User Audio Translation

A real-time language translation application that enables users to join a shared translation room where everyone can speak in their preferred language and hear others translated to their target language.

## Key Features

- **Multi-User Translation Room**: Join a shared space where users can communicate in different languages
- **Real-time Speech Recognition**: Uses Deepgram for high-quality speech-to-text
- **Automatic Translation**: Translates between multiple languages using Google Translate
- **Text-to-Speech Output**: High-quality voice synthesis using Cartesia TTS API
- **Real-time WebSocket Communication**: Uses Socket.io for instant messaging and translation
- **User Presence**: See who's in the room and what languages they're using
- **Speaking Indicators**: Visual cues show who is currently speaking
- **Language Selection**: Choose your source and target languages
- **Responsive UI**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: React, Next.js, TypeScript, TailwindCSS
- **Real-time Communication**: Socket.io
- **Speech Recognition**: Deepgram
- **Translation**: Google Translate API
- **Text-to-Speech**: Cartesia API

## Architecture Overview

The application uses a WebSocket-based architecture to enable real-time multi-user communication:

1. **User Session Management**: Handles user identification and language preferences
2. **WebSocket Server**: Manages real-time communication between clients
3. **Speech Processing Pipeline**: Captures and processes audio through Deepgram
4. **Translation Coordinator**: Routes speech to translation services based on user preferences
5. **Real-time UI Updates**: Shows active users and their speaking status

## How It Works

1. Users join the translation room by entering their name and selecting language preferences
2. When a user speaks, their speech is transcribed locally using Deepgram
3. The transcribed text is sent to the server via WebSocket
4. The server translates the text to each recipient's preferred language
5. Each recipient receives a personalized translation
6. Translations can be automatically spoken using text-to-speech

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API keys for:
  - Deepgram (speech recognition)
  - Cartesia (text-to-speech)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/voiceflow-translator.git
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with your API keys
   ```
   DEEPGRAM_API_KEY=your_deepgram_key
   CARTESIA_API_KEY=your_cartesia_key
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

## Usage

1. Enter your name and select your language preferences
2. Click "Join Room" to enter the translation room
3. Click "Start Listening" to begin speech recognition
4. Speak clearly into your microphone
5. Your speech will be translated and sent to other users
6. Incoming translations will appear in the "Incoming Translations" section

## Technical Challenges and Solutions

### Challenge: Real-time Coordination
- **Solution**: WebSocket-based architecture with Socket.io that provides reliable bidirectional communication and automatic reconnection.

### Challenge: Multi-language Translation
- **Solution**: Server-side coordination of translations, translating only to languages needed by active users.

### Challenge: Audio Processing
- **Solution**: Client-side speech recognition with optimized settings for real-time performance.

### Challenge: User Experience
- **Solution**: Visual speaking indicators, message grouping, and automatic text-to-speech for a seamless experience.

## Limitations and Future Improvements

- Currently limited to a single global room
- No persistent history of conversations
- Audio quality depends on user's microphone and environment
- Adding multiple rooms and direct messaging
- Implementing end-to-end encryption
- Adding support for more languages and dialects
- Improving translation quality with custom models

## License

This project is licensed under the MIT License - see the LICENSE file for details. 