import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hostinger Node.js Web App roda `next start` direto — sem standalone.
  // Para deploy em Docker/Kubernetes que se beneficie do bundle reduzido,
  // reabilite descomentando a linha abaixo e ajustando o script `start`
  // do package.json para `node .next/standalone/server.js`.
  // output: 'standalone',

  experimental: {
    ppr: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.felipesbakery.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      // Imagens de demonstração (Pexels — licença gratuita para uso comercial)
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // Imagens de demonstração (Unsplash)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Dev: localhost uploads
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers de segurança (complementam o Nginx em produção)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // Redirecionar /admin para /admin/dashboard
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ]
  },

  // Logs de desenvolvimento
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

export default nextConfig
