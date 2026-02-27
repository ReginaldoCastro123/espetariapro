/** @type {import('next').NextConfig} */
const nextConfig = {
  // A propriedade 'experimental' com 'appDir' foi removida porque é padrão no Next.js 14
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // IMPORTANTE: Em produção, o localhost não existe na Vercel!
        // Use a variável de ambiente para que ele saiba onde está seu Render
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;