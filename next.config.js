/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    CARTESIA_API_KEY: process.env.CARTESIA_API_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ['socket.io', 'socket.io-client'],
  },
  
  // Use edge runtime for better WebSocket support
  // But exclude certain API routes that need Node.js features
  excludeDefaultMomentLocales: false,
};

module.exports = nextConfig;
