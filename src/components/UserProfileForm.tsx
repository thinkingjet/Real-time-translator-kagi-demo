/**
 * UserProfileForm Component
 * 
 * Allows users to set their name and language preferences before joining
 * the translation room.
 * 
 * Features I added:
 * - Simple name input with validation
 * - Language selection using existing LanguageSelector
 * - Responsive design
 * - Form validation
 */

import { useState } from 'react';
import LanguageSelector from './LanguageSelector';

interface UserProfileFormProps {
  onJoin: (name: string, targetLanguage: string) => void;
  initialTargetLanguage?: string;
}

export default function UserProfileForm({ 
  onJoin,
  initialTargetLanguage = 'es'
}: UserProfileFormProps) {
  const [name, setName] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    onJoin(name.trim(), targetLanguage);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6">Join Translation Room</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Translate To
            </label>
            <LanguageSelector
              selectedLanguage={targetLanguage}
              onChange={setTargetLanguage}
              disabled={false}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-full font-medium text-white bg-purple-600 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
} 