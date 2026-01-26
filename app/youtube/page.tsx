export const metadata = {
  title: 'YouTube Trends | Top Trends',
  description:
    'Explore trending YouTube topics and videos by country and time range.',
}

import YouTubeTrendsClient from '@/components/YouTubeTrendsClient'

export default function YouTubePage() {
  return (
    <YouTubeTrendsClient />
  )
}
