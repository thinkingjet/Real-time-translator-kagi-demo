import React from 'react';

/**
 * Available languages for translation
 * I selected these languages based on cartesia support
 * Could easily add more languages in the future using eleven labs+cartesia together
 */
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
];

/**
 * Props interface for the LanguageSelector component
 * I used TypeScript to make the code more maintainable and catch errors early
 */
interface LanguageSelectorProps {
  selectedLanguage: string;      // Currently selected language code
  onChange: (languageCode: string) => void;  // Callback when language changes
  label: string;                 // Label text for the selector
  disabled?: boolean;            // Optional: Disable selector during speech
  otherLanguage?: string;        // Optional: Currently selected language in the other selector
}

/**
 * LanguageSelector Component
 * A reusable dropdown component for selecting languages. I implemented this with:
 * - TypeScript for type safety
 * - Tailwind CSS for styling
 * - Smart filtering to prevent selecting same language in both dropdowns
 * - Custom styling for better UX
 * 
 * @param props - See LanguageSelectorProps interface
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onChange,
  label,
  disabled = false,
  otherLanguage,
}) => {
  // Filter out the language that's selected in the other dropdown
  // This prevents users from selecting the same language for source and target
  const availableLanguages = languages.filter(lang => 
    !otherLanguage || lang.code !== otherLanguage
  );

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-sm font-medium text-gray-300">{label}</label>
      <select
        value={selectedLanguage}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5
          appearance-none cursor-pointer focus:ring-2 focus:ring-purple-600 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
          backgroundRepeat: 'no-repeat', 
          backgroundPosition: 'right 0.75rem center', 
          backgroundSize: '1rem',
          paddingRight: '2.5rem' 
        }}
      >
        {availableLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 