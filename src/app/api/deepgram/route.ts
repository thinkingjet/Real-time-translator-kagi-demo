import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not found' },
        { status: 500 }
      );
    }
    
    // Return API key
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Error fetching Deepgram API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Deepgram API key' },
      { status: 500 }
    );
  }
} 