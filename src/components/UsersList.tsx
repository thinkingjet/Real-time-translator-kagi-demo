/**
 * UsersList Component
 * 
 * Displays a list of active users in the translation room with their language settings.
 * Shows a speaking indicator when users are actively talking.
 * 
 * I added some neat features:
 * - Visual speaking indicators
 * - Compact but informative design
 * - Language code display with flags
 * - Active user highlighting
 */

import { useState, useEffect } from 'react';
import { User } from '@/hooks/useSocket';

interface UsersListProps {
  users: User[];
  currentUserId?: string;
  speakingUsers: Set<string>;
}

export default function UsersList({ users, currentUserId, speakingUsers }: UsersListProps) {
  const sortedUsers = [...users].sort((a, b) => {
    // Current user always at the top
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    
    // Sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Language code to emoji flag mapping (simplified)
  const getLanguageEmoji = (code: string) => {
    const langToEmoji: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'hi': '🇮🇳',
      'nl': '🇳🇱',
      'pl': '🇵🇱',
      'sv': '🇸🇪',
      'tr': '🇹🇷',
    };
    
    if (!code) return '🌐'; // Default emoji for undefined/null code
    const baseCode = code.split('-')[0].toLowerCase();
    return langToEmoji[baseCode] || code.toUpperCase();
  };

  return (
    <div className="glass-card p-6 w-full mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Active Users ({users.length})</h2>
      
      {users.length === 0 ? (
        <p className="text-gray-400 italic">No users currently in the room</p>
      ) : (
        <ul className="space-y-3">
          {sortedUsers.map(user => (
            <li 
              key={user.id} 
              className={`flex items-center justify-between p-3 rounded-lg 
                ${user.id === currentUserId ? 'bg-purple-900/30 border border-purple-500/30' : 'bg-gray-800/30'}
                ${speakingUsers.has(user.id) ? 'border border-green-500/50' : ''}`}
            >
              <div className="flex items-center">
                {/* Speaking indicator */}
                {speakingUsers.has(user.id) && (
                  <div className="relative mr-3">
                    <span className="absolute flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                )}
                
                {/* User name with "You" indicator */}
                <span className="font-medium text-gray-200">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs bg-purple-500 px-2 py-0.5 rounded-full text-white">You</span>
                  )}
                </span>
              </div>
              
              {/* Language settings */}
              <div className="flex items-center text-sm text-gray-300">
                {/* For English-only hub, show only target language */}
                <span className="flex items-center">
                  {getLanguageEmoji('en')} 
                  <span className="mx-1">EN</span>
                </span>
                <span className="mx-2">→</span>
                <span className="flex items-center">
                  {getLanguageEmoji(user.targetLanguage)} 
                  <span className="mx-1">{user.targetLanguage?.toUpperCase() || 'EN'}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 