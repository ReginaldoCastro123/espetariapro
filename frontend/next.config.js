/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  // DESABILITADO TEMPORARIAMENTE para o site parar de recarregar
  disable: true, 
  register: false,
  skipWaiting: true,
});

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api'}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);