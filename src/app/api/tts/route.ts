//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();
    
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

    // Call Cartesia's TTS API
    const response = await fetch('https://api.cartesia.ai/tts/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10'
      },
      body: JSON.stringify({
        model_id: 'sonic',
        transcript: text,
        voice: {
          mode: 'id',
          id: '694f9389-aac1-45b6-b726-9d9369183238', // Default voice ID
          __experimental_controls: {
            speed: 'normal',
            emotion: ['positivity']
          }
        },
        language: language,
        output_format: {
          container: 'raw',
          sample_rate: 44100,
          encoding: 'pcm_f32le'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    // Stream the audio data back to the client
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