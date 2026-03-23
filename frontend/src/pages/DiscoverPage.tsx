import { useState } from 'react'
import { discoverTrends, DiscoverResponse } from '../utils/api'
import { SingleTrendChart } from '../components/TrendChart'
import ProductCard from '../components/ProductCard'

const TIMEFRAMES = [
  { value: '1w', label: '1주' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '12m', label: '12개월' },
]

export default function DiscoverPage() {
  const [timeframe, setTimeframe] = useState('3m')
  const [limit, setLimit] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DiscoverResponse | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const handleDiscover = async () => {
    setLoading(true)
    setError('')
    setData(null)
    setExpanded({})
    try {
      const res = await discoverTrends(timeframe, limit)
      if (res.error) setError(`오류: ${res.error}`)
      setData(res)
    } catch {
      setError('트렌드 발굴 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (i: number) =>
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">트렌드 발굴</h1>
      <p className="text-sm text-gray-500 mb-6">
        선택한 기간의 한국 인기 트렌드를 분석하고, 관련 상품을 추천합니다.
      </p>

      {/* 설정 영역 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">분석 기간</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {TIMEFRAMES.map(t => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  timeframe === t.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            트렌드 수: <span className="text-blue-600">{limit}개</span>
          </label>
          <input
            type="range"
            min={3}
            max={10}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="w-32 accent-blue-600"
          />
        </div>

        <button
          onClick={handleDiscover}
          disabled={loading}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              분석 중...
            </span>
          ) : '트렌드 발굴'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              <div className="h-32 bg-gray-100 rounded mb-4" />
              <div className="grid grid-cols-4 gap-3">
                {[0,1,2,3].map(j => (
                  <div key={j} className="h-48 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {data.trends.map((trend, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* 헤더 */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(i)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-gray-900 text-base">{trend.keyword}</span>
                  {trend.avg_interest > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                      관심도 {trend.avg_interest}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">상품 {trend.products.length}개</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expanded[i] ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 기본: 관심도 차트 + 상품 미리보기 */}
              <div className="px-5 pb-5 border-t border-gray-100">
                {trend.timeline.length > 0 && (
                  <div className="mt-4 mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      검색 관심도 추이
                    </p>
                    <SingleTrendChart data={trend.timeline} keyword={trend.keyword} />
                  </div>
                )}

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  관련 추천 상품
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(expanded[i] ? trend.products : trend.products.slice(0, 4)).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {trend.products.length > 4 && (
                  <button
                    onClick={() => toggleExpand(i)}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    {expanded[i] ? '접기' : `+${trend.products.length - 4}개 더 보기`}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">기간을 선택하고 트렌드를 발굴해보세요</p>
        </div>
      )}
    </div>
  )
}
