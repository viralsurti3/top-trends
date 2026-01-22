const isStaticExport = process.env.NEXT_OUTPUT === 'export' && !process.env.VERCEL

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: isStaticExport ? 'export' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/proxy/reddit/:subreddit',
        destination: 'https://www.reddit.com/r/:subreddit/top.json?limit=10&t=day',
      },
      {
        source: '/proxy/google/:geo',
        destination: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=:geo',
      },
      {
        source: '/proxy/hn',
        destination: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10',
      },
      {
        source: '/proxy/bbc',
        destination: 'https://feeds.bbci.co.uk/news/rss.xml',
      },
      {
        source: '/proxy/techcrunch',
        destination: 'https://techcrunch.com/feed/',
      },
    ]
  },
}

module.exports = nextConfig

