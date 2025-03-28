/**
 * Global TypeScript definitions
 * 
 * This file adds type definitions for global objects used throughout the application.
 */

import { Server as SocketIOServer } from 'socket.io';

declare global {
  /**
   * Global Socket.io server instance
   * Used for accessing the socket server from anywhere in the application
   */
  var io: SocketIOServer;
  
  /**
   * Global metrics tracking
   * Used for monitoring application performance and usage
   */
  var metrics: {
    connections: number;
    messagesProcessed: number;
    peakConcurrentUsers: number;
    startTime: number;
  };
  
  /**
   * Extended Window interface with socket property
   * Used for accessing the socket from client-side code
   */
  interface Window {
    socket?: any;
  }
} 