import { useState } from 'react'
import { getTrends, getTrendsComparison, TrendsResponse, TrendsComparisonResponse } from '../utils/api'
import { SingleTrendChart, ComparisonTrendChart } from '../components/TrendChart'

const TIMEFRAMES = [
  { value: '1w', label: '1주' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '12m', label: '12개월' },
  { value: '5y', label: '5년' },
]

type Mode = 'single' | 'compare'

export default function TrendsPage() {
  const [mode, setMode] = useState<Mode>('single')
  const [query, setQuery] = useState('')
  const [compareKeywords, setCompareKeywords] = useState(['', ''])
  const [timeframe, setTimeframe] = useState('3m')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [singleResult, setSingleResult] = useState<TrendsResponse | null>(null)
  const [compareResult, setCompareResult] = useState<TrendsComparisonResponse | null>(null)

  const handleSingleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSingleResult(null)
    try {
      const res = await getTrends(query.trim(), timeframe)
      if (res.error) setError(`Google Trends 오류: ${res.error}`)
      setSingleResult(res)
    } catch {
      setError('트렌드 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompareSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const kws = compareKeywords.filter(k => k.trim())
    if (kws.length < 2) {
      setError('비교할 키워드를 2개 이상 입력하세요.')
      return
    }
    setLoading(true)
    setError('')
    setCompareResult(null)
    try {
      const res = await getTrendsComparison(kws, timeframe)
      if (res.error) setError(`Google Trends 오류: ${res.error}`)
      setCompareResult(res)
    } catch {
      setError('트렌드 비교 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">트렌드 분석</h1>

      <div className="flex gap-2 mb-6">
        {(['single', 'compare'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m === 'single' ? '단일 키워드' : '키워드 비교'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {TIMEFRAMES.map(t => (
          <button
            key={t.value}
            onClick={() => setTimeframe(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              timeframe === t.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSearch} className="flex gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="키워드 입력 (예: 에어팟)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '조회 중...' : '분석'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCompareSearch} className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {compareKeywords.map((kw, i) => (
              <input
                key={i}
                type="text"
                value={kw}
                onChange={e => {
                  const next = [...compareKeywords]
                  next[i] = e.target.value
                  setCompareKeywords(next)
                }}
                placeholder={`키워드 ${i + 1}`}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
            {compareKeywords.length < 5 && (
              <button
                type="button"
                onClick={() => setCompareKeywords([...compareKeywords, ''])}
                className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400"
              >
                + 추가
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '조회 중...' : '비교 분석'}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {mode === 'single' && singleResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              "{singleResult.keyword}" 검색 관심도
            </h2>
            {singleResult.timeline.length > 0 ? (
              <SingleTrendChart data={singleResult.timeline} keyword={singleResult.keyword} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">데이터가 없습니다.</p>
            )}
          </div>

          {(singleResult.related_top.length > 0 || singleResult.related_rising.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {singleResult.related_top.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">관련 검색어 TOP</h3>
                  <ul className="space-y-1">
                    {singleResult.related_top.map((r, i) => (
                      <li key={i} className="flex justify-between text-sm text-gray-600">
                        <span>{r.query}</span>
                        <span className="text-gray-400">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {singleResult.related_rising.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">급상승 검색어</h3>
                  <ul className="space-y-1">
                    {singleResult.related_rising.map((r, i) => (
                      <li key={i} className="flex justify-between text-sm text-gray-600">
                        <span>{r.query}</span>
                        <span className="text-green-600 font-medium">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'compare' && compareResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            키워드 비교: {compareResult.keywords.join(' vs ')}
          </h2>
          {compareResult.timeline.length > 0 ? (
            <ComparisonTrendChart
              data={compareResult.timeline}
              keywords={compareResult.keywords}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">데이터가 없습니다.</p>
          )}
        </div>
      )}

      {!loading && !singleResult && !compareResult && !error && (
        <div className="text-center py-20 text-gray-400 text-sm">
          키워드를 입력하고 트렌드를 분석하세요
        </div>
      )}
    </div>
  )
}
