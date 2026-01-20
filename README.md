# Top Trends Dashboard

A modern, responsive dashboard for tracking trending topics across different platforms, inspired by Trends24.in.

## Features

- 🌍 **Searchable Country List**: Browse and search through 40+ countries
- ⏰ **Time-based Trend Columns**: View trends from 1 hour ago up to 12 hours ago
- 📊 **Multi-platform Support**: Track trends from Reddit, YouTube, Twitter, TikTok, Instagram, and Facebook
- 🎨 **Dark Mode Design**: Clean, modern dark theme with high readability
- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🔍 **Real-time Volume Data**: See mention counts for each trending topic

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout with dark mode
│   ├── page.tsx         # Main dashboard page
│   └── globals.css      # Global styles
├── components/
│   ├── Sidebar.tsx      # Desktop sidebar with country search
│   ├── TopNav.tsx       # Top navigation with mobile menu
│   ├── TrendColumns.tsx # Time-based trend columns
│   └── TrendItem.tsx   # Individual trend item component
└── package.json
```

## Customization

The dashboard uses sample data. To connect to a real API:

1. Update `components/TrendColumns.tsx` to fetch data from your API
2. Modify the `generateTrends` function to use real data
3. Add loading states and error handling as needed

## License

MIT

