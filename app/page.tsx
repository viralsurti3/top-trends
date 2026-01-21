import { Suspense } from 'react'
import ClientHome from '@/components/ClientHome'

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] items-center justify-center">
          Loading...
        </div>
      }
    >
      <ClientHome />
    </Suspense>
  )
}

