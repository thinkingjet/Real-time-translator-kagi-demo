/**
 * Type definitions for langdetect
 * 
 * These type definitions provide TypeScript support for the langdetect module,
 * which is used for language detection in the application.
 */

declare module 'langdetect' {
  /**
   * Result of language detection
   */
  export interface DetectionResult {
    /** ISO 639-1 language code */
    lang: string;
    /** Probability score (0-1) */
    prob: number;
  }

  /**
   * Language detection class
   */
  export class DetectLanguage {
    constructor();
    
    /**
     * Detect the language of a text
     * @param text - Text to analyze
     * @returns Array of potential language matches with probabilities
     */
    detect(text: string): DetectionResult[];
    
    /**
     * Get the most likely language
     * @param text - Text to analyze
     * @returns Language code of the most likely match
     */
    detectOne(text: string): string;
  }
} 