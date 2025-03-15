/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    CARTESIA_API_KEY: process.env.CARTESIA_API_KEY,
  },
};

module.exports = nextConfig;
