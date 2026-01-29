import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Top Trends Dashboard',
  description: 'Real-time trending topics dashboard',
  icons: {
    icon: '/buzzify-logo.png',
    apple: '/buzzify-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}


