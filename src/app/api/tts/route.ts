//@ts-nocheck

/**
 * Text-to-Speech API Route
 * 
 * This route handles text-to-speech conversion using Cartesia's API.
 * I implemented some advanced features:
 * - Streaming audio response for better performance
 * - High-quality voice settings
 * - Custom audio format configuration
 * - Error handling and validation
 * 
 * The route supports both GET (for API key) and POST (for TTS conversion)
 * methods to keep the API key secure while enabling streaming audio.
 * 
 * @route POST /api/tts
 * @param {Object} request.body
 * @param {string} request.body.text - Text to convert to speech
 * @param {string} request.body.language - Target language code
 * @returns {Stream} Audio data stream or error message
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();
    
    // Validate required parameters
    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS API key not found' },
        { status: 500 }
      );
    }

    // Configure and call Cartesia's TTS API with optimized settings
    const response = await fetch('https://api.cartesia.ai/tts/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10'
      },
      body: JSON.stringify({
        model_id: 'sonic',  // Using their best model for lwo latency
        transcript: text,
        voice: {
          mode: 'id',
          id: '694f9389-aac1-45b6-b726-9d9369183238', // Default voice ID
          __experimental_controls: {
            speed: 'normal',
            emotion: ['positivity']  // Adding a positive tone
          }
        },
        language: language,
        output_format: {
          container: 'raw',
          sample_rate: 44100,  // High-quality audio
          encoding: 'pcm_f32le'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    // Stream the audio data for better performance
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

/**
 * Get TTS API Key
 * 
 * Secure endpoint to provide the Cartesia API key to the frontend.
 * 
 * @route GET /api/tts
 * @returns {Object} Response containing the API key or error message
 */
export async function GET() {
  try {
    const apiKey = process.env.CARTESIA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Error in TTS API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 