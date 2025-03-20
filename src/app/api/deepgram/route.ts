/**
 * Deepgram API Route
 * 
 * This route securely provides the Deepgram API key to the frontend.
 * I implemented this as a separate endpoint to:
 * - Keep the API key secure on the server
 * - Follow security best practices
 * - Enable easy key rotation if needed
 * 
 * @route GET /api/deepgram
 * @returns {Object} Response containing the API key or error message
 */

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
    
    // Return API key to the client
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Error fetching Deepgram API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Deepgram API key' },
      { status: 500 }
    );
  }
} 