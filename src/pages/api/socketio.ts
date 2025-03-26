/**
 * Socket.io Server Implementation
 * 
 * This implements our WebSocket server for the English-speaking hub.
 * All speech input is in English, and translations are provided to
 * users based on their preferred language.
 */

import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { translateText } from '@/utils/translationUtils';

// Types for our user management
interface User {
  id: string;
  name: string;
  targetLanguage: string;
  joinedAt: Date;
}

// Types for our message structure
interface TranslationMessage {
  userId: string;
  userName: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isFinal: boolean;
}

// Global store for active users in our single room
const users = new Map<string, User>();

// Fix Socket.io types for Next.js
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: any;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    console.log('Socket.io server already running');
    res.end();
    return;
  }

  console.log('Starting Socket.io server...');

  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining the room
    socket.on('join', ({ name, targetLanguage }) => {
      const user: User = {
        id: socket.id,
        name: name || `User-${socket.id.substring(0, 4)}`,
        targetLanguage,
        joinedAt: new Date(),
      };

      users.set(socket.id, user);
      socket.join('translation-room');

      // Send the new user to everyone in the room
      io.to('translation-room').emit('user-joined', {
        user,
        users: Array.from(users.values()),
      });

      // Send the current users list to the new user
      io.to(socket.id).emit('users-list', Array.from(users.values()));
      
      console.log(`User ${user.name} joined with target language: ${targetLanguage}`);
      console.log(`Current users: ${users.size}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        console.log(`User ${user.name} disconnected`);
        users.delete(socket.id);
        io.to('translation-room').emit('user-left', {
          userId: socket.id,
          users: Array.from(users.values()),
        });
        console.log(`Remaining users: ${users.size}`);
      }
    });

    // Handle language preference updates
    socket.on('update-languages', ({ targetLanguage }) => {
      const user = users.get(socket.id);
      if (user) {
        user.targetLanguage = targetLanguage;
        users.set(socket.id, user);
        io.to('translation-room').emit('users-list', Array.from(users.values()));
      }
    });

    // Handle English speech messages and translate for each user
    socket.on('speech', async (message: { originalText: string; isFinal: boolean }) => {
      const sender = users.get(socket.id);
      if (!sender || !message.originalText.trim()) return;

      console.log(`Received speech from ${sender.name}: ${message.originalText.substring(0, 30)}${message.originalText.length > 30 ? '...' : ''}`);
      console.log(`Is final: ${message.isFinal}, Recipients: ${users.size - 1}`);

      // Get unique target languages needed
      const targetLanguages = new Set<string>();
      users.forEach(user => {
        if (user.id !== socket.id && user.targetLanguage !== 'en') {
          targetLanguages.add(user.targetLanguage);
        }
      });

      // Translate to each needed language (only for final messages)
      const translations = new Map<string, string>();
      if (message.isFinal) {
        for (const targetLang of targetLanguages) {
          try {
            const translatedText = await translateText(
              message.originalText,
              'en',
              targetLang
            );
            translations.set(targetLang, translatedText);
          } catch (error) {
            console.error(`Translation error for ${targetLang}:`, error);
          }
        }
      }

      // Send personalized messages to each recipient
      users.forEach(user => {
        if (user.id === socket.id) return; // Skip sender
        
        let textForUser = message.originalText;
        
        // If user wants a different language than English and this is final
        if (user.targetLanguage !== 'en' && message.isFinal) {
          textForUser = translations.get(user.targetLanguage) || message.originalText;
        }
        
        io.to(user.id).emit('translation', {
          userId: sender.id,
          userName: sender.name,
          originalText: message.originalText,
          translatedText: textForUser,
          sourceLanguage: 'en', // Always English as source
          targetLanguage: user.targetLanguage,
          isFinal: message.isFinal
        });
      });
    });
  });

  console.log('Socket.io server initialized');
  res.end();
} 