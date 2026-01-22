import { Suspense } from 'react'
import ClientHome from '@/components/ClientHome'
import { getCountryName } from '@/lib/countries'

type PageProps = {
  params: { country: string; date: string }
}

export function generateMetadata({ params }: PageProps) {
  const countryCode = params.country.toUpperCase()
  const countryName = getCountryName(countryCode)
  return {
    title: `${countryName} Trends for ${params.date} | Top Trends`,
    description: `Trending topics for ${countryName} on ${params.date}.`,
  }
}

export default function CountryDatePage({ params }: PageProps) {
  const countryCode = params.country.toUpperCase()
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] items-center justify-center">
          Loading...
        </div>
      }
    >
      <ClientHome initialCountryCode={countryCode} initialDate={params.date} />
    </Suspense>
  )
}


