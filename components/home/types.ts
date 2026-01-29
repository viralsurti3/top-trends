export type Trend = {
  name: string
  url: string
  source: string
  volume?: string
  timestamp: string
  stale?: boolean
}

export type SourceStat = {
  id: string
  label: string
  count: number
}
