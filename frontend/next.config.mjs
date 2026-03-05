/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    // Ensure the URL has a protocol (required by Next.js rewrites)
    if (backendUrl && !backendUrl.startsWith('http')) {
      backendUrl = `https://${backendUrl}`
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
