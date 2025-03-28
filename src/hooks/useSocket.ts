//@ts-nocheck
/**
 * Custom hook for Socket.io client integration
 * 
 * This hook manages the Socket.io connection and provides methods to:
 * - Connect to the WebSocket server
 * - Join the translation room
 * - Send and receive messages
 * - Handle user list updates
 * 
 * I implemented features like automatic reconnection and event handlers
 * to create a smooth real-time experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  targetLanguage: string;
  joinedAt: Date;
}

export interface TranslationMessage {
  userId: string;
  userName: string;
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  isFinal: boolean;
}

// Type for socket event listeners
interface UseSocketOptions {
  onUsersUpdate?: (users: User[]) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onTranslation?: (message: TranslationMessage) => void;
}

// Add the socket to the window for debugging and accessing the socket ID
declare global {
  interface Window {
    socket?: Socket;
  }
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Initialize Socket.io connection
  const initializeSocket = useCallback(async () => {
    if (initializedRef.current) return;
    
    initializedRef.current = true;

    // Ensure server-side Socket.io is initialized first
    try {
      await fetch('/api/socketio');
    } catch (error) {
      console.error('Error initializing Socket.io server:', error);
    }

    // Create Socket.io client
    const socketIo = io({
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    socketRef.current = socketIo;
    
    // Expose socket to window for debugging
    if (typeof window !== 'undefined') {
      window.socket = socketIo;
    }

    // Set up event listeners
    socketIo.on('connect', () => {
      console.log('Connected to Socket.io server with ID:', socketIo.id);
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socketIo.on('users-list', (usersList: User[]) => {
      console.log('Received users list:', usersList);
      setUsers(usersList);
      options.onUsersUpdate?.(usersList);
    });

    socketIo.on('user-joined', ({ user, users: usersList }: { user: User, users: User[] }) => {
      console.log(`User joined: ${user.name}`);
      setUsers(usersList);
      options.onUserJoined?.(user);
      options.onUsersUpdate?.(usersList);
    });

    socketIo.on('user-left', ({ userId, users: usersList }: { userId: string, users: User[] }) => {
      console.log(`User left: ${userId}`);
      setUsers(usersList);
      options.onUserLeft?.(userId);
      options.onUsersUpdate?.(usersList);
    });

    socketIo.on('translation', (message: TranslationMessage) => {
      console.log(`Received translation from ${message.userName}:`, message.translatedText.substring(0, 30));
      options.onTranslation?.(message);
    });

    return () => {
      socketIo.disconnect();
      socketRef.current = null;
      initializedRef.current = false;
      
      // Clean up window reference
      if (typeof window !== 'undefined') {
        delete window.socket;
      }
    };
  }, [options]);

  // Join the translation room
  const joinRoom = useCallback((name: string, sourceLanguage: string, targetLanguage: string) => {
    if (!socketRef.current || !isConnected) return;
    
    console.log(`Joining room as ${name} with target language: ${targetLanguage}`);
    
    socketRef.current.emit('join', {
      name,
      targetLanguage,
    });
  }, [isConnected]);

  // Update language preferences
  const updateLanguages = useCallback((sourceLanguage: string, targetLanguage: string) => {
    if (!socketRef.current || !isConnected) return;
    
    console.log(`Updating target language: ${targetLanguage}`);
    
    socketRef.current.emit('update-languages', {
      targetLanguage,
    });
  }, [isConnected]);

  // Send speech recognition text to other users
  const sendSpeech = useCallback((text: string, isFinal: boolean) => {
    if (!socketRef.current || !isConnected || !text.trim()) return;
    
    socketRef.current.emit('speech', {
      originalText: text,
      isFinal,
    });
  }, [isConnected]);

  // Initialize socket connection when component mounts
  useEffect(() => {
    const cleanup = initializeSocket();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [initializeSocket]);

  return {
    isConnected,
    users,
    joinRoom,
    updateLanguages,
    sendSpeech,
  };
}; 