/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Since GitHub Pages serves from a subdirectory
  basePath: '',
}

module.exports = nextConfig