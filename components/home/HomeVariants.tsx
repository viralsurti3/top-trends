import type { SourceStat, Trend } from '@/components/home/types'
import PlatformGrid from '@/components/home/PlatformGrid'

type HomeVariantProps = {
  copy: {
    loading: string
    noTrends: string
    hotTopicsGlobal: string
    hotTopicsIn: string
  }
  language: 'EN' | 'IT'
  selectedCountryName: string
  hotCountryName: string
  isLoading: boolean
  mixedHotGlobal: Trend[]
  hotLocal: Trend[]
  platformTrends: Record<string, Trend[]>
  platformLimits: Record<string, number>
  onShowMore: (platformId: string) => void
  sourceBreakdown: SourceStat[]
  watchlist: Trend[]
  lastUpdatedLabel: string
}

const sourceLabels: Record<string, string> = {
  x: 'X',
  reddit: 'Reddit',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

function TopicListCard({
  title,
  accent,
  icon,
  trends,
  isLoading,
  loadingLabel,
  emptyLabel,
}: {
  title: string
  accent?: string
  icon?: string
  trends: Trend[]
  isLoading: boolean
  loadingLabel: string
  emptyLabel: string
}) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-lg font-semibold mb-3">
        {icon && <span className={accent ?? 'text-[#f97316]'}>{icon}</span>}
        {title}
      </div>
      <div className="space-y-3 text-sm text-[#1f2937]">
        {isLoading ? (
          <div className="text-[#9ca3af]">{loadingLabel}</div>
        ) : trends.length === 0 ? (
          <div className="text-[#9ca3af]">{emptyLabel}</div>
        ) : (
          trends.map((trend) => (
            <a
              key={`${trend.source}-${trend.timestamp}-${trend.url}`}
              href={trend.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
            >
              <span className="font-medium">{trend.name}</span>
              <span className="text-[11px] font-semibold text-[#6b7280] bg-[#f3f4f6] border border-[#e5e7eb] rounded-full px-2 py-0.5">
                {sourceLabels[trend.source] ?? trend.source}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  )
}

function SourceBreakdownList({ items }: { items: SourceStat[] }) {
  const max = items.reduce((acc, item) => Math.max(acc, item.count), 1)
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
      <div className="text-sm font-semibold text-[#111827] mb-4">Source mix</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex items-center justify-between text-xs text-[#6b7280]">
              <span>{item.label}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2 bg-[#f3f4f6] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#22c55e]"
                style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WatchlistPanel({
  trends,
  title,
  subtitle,
  emptyLabel,
}: {
  trends: Trend[]
  title: string
  subtitle: string
  emptyLabel: string
}) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-sm font-semibold text-[#111827]">{title}</div>
          <div className="text-xs text-[#9ca3af] mt-1">{subtitle}</div>
        </div>
        <span className="text-xs font-semibold text-[#6366f1] bg-[#eef2ff] px-2 py-1 rounded-full">
          Live
        </span>
      </div>
      <div className="space-y-3 text-sm text-[#1f2937]">
        {trends.length === 0 ? (
          <div className="text-[#9ca3af]">{emptyLabel}</div>
        ) : (
          trends.map((trend) => (
            <a
              key={`${trend.source}-${trend.timestamp}-${trend.url}`}
              href={trend.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition"
            >
              <span className="font-medium">{trend.name}</span>
              <span className="text-[11px] font-semibold text-[#6b7280]">
                {sourceLabels[trend.source] ?? trend.source}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  )
}

export function HomeVariantOne(props: HomeVariantProps) {
  const {
    copy,
    language,
    selectedCountryName,
    hotCountryName,
    isLoading,
    mixedHotGlobal,
    hotLocal,
    platformTrends,
    platformLimits,
    onShowMore,
    sourceBreakdown,
    watchlist,
  } = props
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <TopicListCard
          title={`${copy.hotTopicsGlobal} 🔥`}
          trends={mixedHotGlobal}
          isLoading={isLoading}
          loadingLabel={copy.loading}
          emptyLabel={copy.noTrends}
        />
        <TopicListCard
          title={`${copy.hotTopicsIn} ${hotCountryName} 🏁`}
          trends={hotLocal}
          isLoading={isLoading}
          loadingLabel={copy.loading}
          emptyLabel={copy.noTrends}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WatchlistPanel
          trends={watchlist}
          title={language === 'IT' ? 'Trend da seguire' : 'Watchlist now'}
          subtitle={
            language === 'IT'
              ? `Focus su ${selectedCountryName}`
              : `Focus on ${selectedCountryName}`
          }
          emptyLabel={copy.noTrends}
        />
        <SourceBreakdownList items={sourceBreakdown} />
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-[#111827] mb-4">
            {language === 'IT' ? 'Perche tornare' : 'Why people return'}
          </div>
          <ul className="space-y-3 text-sm text-[#4b5563]">
            <li>• Real-time updates across multiple platforms.</li>
            <li>• A single view for global + local momentum.</li>
            <li>• Always-on watchlist for your market.</li>
          </ul>
        </div>
      </div>

      <PlatformGrid
        platformTrends={platformTrends}
        platformLimits={platformLimits}
        onShowMore={onShowMore}
        isLoading={isLoading}
        language={language}
        labels={{
          loading: copy.loading,
          noTrends: copy.noTrends,
          showMore: language === 'IT' ? 'Mostra di piu' : 'Show more',
        }}
      />
    </div>
  )
}

export function HomeVariantTwo(props: HomeVariantProps) {
  const {
    copy,
    language,
    selectedCountryName,
    hotCountryName,
    isLoading,
    mixedHotGlobal,
    hotLocal,
    platformTrends,
    platformLimits,
    onShowMore,
    sourceBreakdown,
    lastUpdatedLabel,
  } = props
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-[#6b7280]">
                {language === 'IT' ? 'Ultimo aggiornamento' : 'Last updated'}
              </div>
              <div className="text-lg font-semibold text-[#111827]">
                {lastUpdatedLabel}
              </div>
            </div>
            <div className="text-xs text-[#6b7280] bg-[#f3f4f6] px-3 py-1 rounded-full">
              {language === 'IT' ? 'Snapshot globale' : 'Global snapshot'}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TopicListCard
              title={language === 'IT' ? 'Top mondiale' : 'World hot list'}
              trends={mixedHotGlobal}
              isLoading={isLoading}
              loadingLabel={copy.loading}
              emptyLabel={copy.noTrends}
            />
            <TopicListCard
              title={`${language === 'IT' ? 'Focus su' : 'Country pulse'} ${hotCountryName}`}
              trends={hotLocal}
              isLoading={isLoading}
              loadingLabel={copy.loading}
              emptyLabel={copy.noTrends}
            />
          </div>
        </div>
        <div className="space-y-6">
          <SourceBreakdownList items={sourceBreakdown} />
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-[#111827] mb-2">
              {language === 'IT' ? 'Cosa guardare' : 'What to watch'}
            </div>
            <ul className="space-y-2 text-sm text-[#4b5563]">
              <li>• Sudden spikes in Reddit conversations.</li>
              <li>• YouTube creators driving new demand.</li>
              <li>• Cross-platform topics for campaigns.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-[#6b7280]">
              {language === 'IT' ? 'Sezione piattaforme' : 'Platform feed'}
            </div>
            <div className="text-lg font-semibold text-[#111827]">
              {language === 'IT' ? 'Ultimi trend per canale' : 'Latest by channel'}
            </div>
          </div>
          <div className="text-xs text-[#6b7280]">{selectedCountryName}</div>
        </div>
        <PlatformGrid
          platformTrends={platformTrends}
          platformLimits={platformLimits}
          onShowMore={onShowMore}
          isLoading={isLoading}
          language={language}
          labels={{
            loading: copy.loading,
            noTrends: copy.noTrends,
            showMore: language === 'IT' ? 'Mostra di piu' : 'Show more',
          }}
        />
      </div>
    </div>
  )
}

export function HomeVariantThree(props: HomeVariantProps) {
  const {
    copy,
    language,
    selectedCountryName,
    hotCountryName,
    isLoading,
    mixedHotGlobal,
    hotLocal,
    platformTrends,
    platformLimits,
    onShowMore,
    sourceBreakdown,
    watchlist,
  } = props
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-[#6b7280]">
                {language === 'IT' ? 'Briefing giornaliero' : 'Daily trend briefing'}
              </div>
              <div className="text-2xl font-semibold text-[#111827]">
                {language === 'IT'
                  ? `Cosa sta crescendo in ${selectedCountryName}`
                  : `What is rising in ${selectedCountryName}`}
              </div>
            </div>
            <span className="text-xs font-semibold text-[#111827] bg-[#f3f4f6] px-3 py-1 rounded-full">
              {language === 'IT' ? 'Aggiornato live' : 'Live updated'}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#eef2f7] rounded-2xl px-4 py-4 bg-[#f9fafb]">
              <div className="text-xs uppercase tracking-wide text-[#9ca3af]">
                {language === 'IT' ? 'Panoramica' : 'Overview'}
              </div>
              <div className="text-sm text-[#4b5563] mt-2">
                {language === 'IT'
                  ? 'Segnali principali, trend locali e globali in un unico spazio.'
                  : 'Top signals, local momentum, and global context in one view.'}
              </div>
            </div>
            <div className="border border-[#eef2f7] rounded-2xl px-4 py-4 bg-[#f9fafb]">
              <div className="text-xs uppercase tracking-wide text-[#9ca3af]">
                {language === 'IT' ? 'Suggerimenti rapidi' : 'Quick tips'}
              </div>
              <ul className="mt-2 text-sm text-[#4b5563] space-y-2">
                <li>• {language === 'IT' ? 'Monitora i cambiamenti improvvisi.' : 'Watch sudden spikes.'}</li>
                <li>• {language === 'IT' ? 'Confronta le piattaforme.' : 'Compare platforms.'}</li>
                <li>• {language === 'IT' ? 'Salva i trend ricorrenti.' : 'Save recurring topics.'}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <TopicListCard
            title={`${copy.hotTopicsGlobal} 🌍`}
            trends={mixedHotGlobal}
            isLoading={isLoading}
            loadingLabel={copy.loading}
            emptyLabel={copy.noTrends}
          />
          <TopicListCard
            title={`${copy.hotTopicsIn} ${hotCountryName} ⭐`}
            trends={hotLocal}
            isLoading={isLoading}
            loadingLabel={copy.loading}
            emptyLabel={copy.noTrends}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-[#6b7280]">
                {language === 'IT' ? 'Flusso centrale' : 'Central feed'}
              </div>
              <div className="text-lg font-semibold text-[#111827]">
                {language === 'IT'
                  ? `Trend principali per ${selectedCountryName}`
                  : `Top signals for ${selectedCountryName}`}
              </div>
            </div>
            <div className="text-xs text-[#9ca3af]">{selectedCountryName}</div>
          </div>
          <div className="space-y-3 text-sm">
            {watchlist.map((trend) => (
              <a
                key={`${trend.source}-${trend.timestamp}-${trend.url}`}
                href={trend.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition border border-transparent hover:border-[#e5e7eb]"
              >
                <span className="font-medium">{trend.name}</span>
                <span className="text-[11px] font-semibold text-[#6b7280]">
                  {sourceLabels[trend.source] ?? trend.source}
                </span>
              </a>
            ))}
            {watchlist.length === 0 && (
              <div className="text-[#9ca3af]">{copy.noTrends}</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SourceBreakdownList items={sourceBreakdown} />
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-[#111827] mb-2">
              {language === 'IT' ? 'Suggerimenti' : 'Ideas for teams'}
            </div>
            <ul className="space-y-2 text-sm text-[#4b5563]">
              <li>• Monitor emerging topics for content planning.</li>
              <li>• Compare platform signals in one view.</li>
              <li>• Save weekly reports for recurring visits.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-[#6b7280]">
              {language === 'IT' ? 'Trend su tutte le piattaforme' : 'Trending across platforms'}
            </div>
            <div className="text-lg font-semibold text-[#111827]">
              {language === 'IT' ? 'Panoramica per canale' : 'Channel overview'}
            </div>
          </div>
          <div className="text-xs text-[#9ca3af]">{selectedCountryName}</div>
        </div>
        <PlatformGrid
          platformTrends={platformTrends}
          platformLimits={platformLimits}
          onShowMore={onShowMore}
          isLoading={isLoading}
          language={language}
          labels={{
            loading: copy.loading,
            noTrends: copy.noTrends,
            showMore: language === 'IT' ? 'Mostra di piu' : 'Show more',
          }}
        />
      </div>
    </div>
  )
}

export function HomeVariantFour(props: HomeVariantProps) {
  const {
    copy,
    language,
    selectedCountryName,
    hotCountryName,
    isLoading,
    mixedHotGlobal,
    hotLocal,
    platformTrends,
    platformLimits,
    onShowMore,
    sourceBreakdown,
  } = props
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          <div className="text-sm text-[#6b7280] mb-2">
            {language === 'IT' ? 'Storie principali' : 'Top stories'}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TopicListCard
              title={`${copy.hotTopicsGlobal} 🔥`}
              trends={mixedHotGlobal}
              isLoading={isLoading}
              loadingLabel={copy.loading}
              emptyLabel={copy.noTrends}
            />
            <TopicListCard
              title={`${copy.hotTopicsIn} ${hotCountryName} 🧭`}
              trends={hotLocal}
              isLoading={isLoading}
              loadingLabel={copy.loading}
              emptyLabel={copy.noTrends}
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-[#111827] mb-2">
              {language === 'IT' ? 'Newsletter' : 'Daily briefing'}
            </div>
            <div className="text-sm text-[#6b7280]">
              {language === 'IT'
                ? 'Ricevi un riepilogo dei trend piu importanti.'
                : 'Get a short daily digest of the top trends.'}
            </div>
            <button className="mt-4 w-full rounded-lg bg-[#111827] text-white text-sm py-2">
              {language === 'IT' ? 'Iscriviti' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SourceBreakdownList items={sourceBreakdown} />
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-[#111827] mb-2">
            {language === 'IT' ? 'FAQ rapide' : 'Quick FAQ'}
          </div>
          <div className="space-y-3 text-sm text-[#4b5563]">
            <div>
              <div className="font-medium text-[#111827]">
                {language === 'IT' ? 'Da dove arrivano i dati?' : 'Where do the signals come from?'}
              </div>
              <div>Multi-source tracking across social and video platforms.</div>
            </div>
            <div>
              <div className="font-medium text-[#111827]">
                {language === 'IT' ? 'Quanto spesso si aggiorna?' : 'How often is it refreshed?'}
              </div>
              <div>Updates appear throughout the day, with hourly checks.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-[#6b7280]">
              {language === 'IT' ? 'Trend per piattaforma' : 'Trends by platform'}
            </div>
            <div className="text-lg font-semibold text-[#111827]">
              {language === 'IT' ? `Focus: ${selectedCountryName}` : `Focus: ${selectedCountryName}`}
            </div>
          </div>
          <div className="text-xs text-[#9ca3af]">
            {language === 'IT' ? 'Curato per te' : 'Curated for you'}
          </div>
        </div>
        <PlatformGrid
          platformTrends={platformTrends}
          platformLimits={platformLimits}
          onShowMore={onShowMore}
          isLoading={isLoading}
          language={language}
          labels={{
            loading: copy.loading,
            noTrends: copy.noTrends,
            showMore: language === 'IT' ? 'Mostra di piu' : 'Show more',
          }}
        />
      </div>
    </div>
  )
}
