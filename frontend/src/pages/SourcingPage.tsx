import { useEffect, useState } from 'react'
import axios from 'axios'
import { Product } from '../utils/api'
import { ComparisonTrendChart } from '../components/TrendChart'
import ProductCard from '../components/ProductCard'

interface SourcingItem {
  keyword: string
  brand: string
  note: string
  kr_interest: number
  kr_price_min: number | null
  kr_price_max: number | null
  products: Product[]
}

interface AnalyzeResponse {
  category: string
  timeframe: string
  keywords: string[]
  kr_timeline: Record<string, number | string>[]
  items: SourcingItem[]
  trends_available: boolean
  error?: string
}

const TIMEFRAMES = [
  { value: '1w', label: '1주' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '12m', label: '12개월' },
]

function InterestBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const color = pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-blue-300' : 'bg-gray-200'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

export default function SourcingPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCat, setSelectedCat] = useState('')
  const [timeframe, setTimeframe] = useState('3m')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    axios.get('/api/v1/sourcing/categories').then(r => {
      setCategories(r.data.categories)
      setSelectedCat(r.data.categories[0] ?? '')
    })
  }, [])

  const handleAnalyze = async () => {
    if (!selectedCat) return
    setLoading(true)
    setError('')
    setData(null)
    setExpandedIdx(null)
    try {
      const res = await axios.get<AnalyzeResponse>('/api/v1/sourcing/analyze', {
        params: { category: selectedCat, timeframe },
        timeout: 60000,
      })
      setData(res.data)
    } catch {
      setError('분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const maxInterest = data ? Math.max(...data.items.map(i => i.kr_interest), 1) : 1

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">독일 소싱 분석</h1>
      <p className="text-sm text-gray-500 mb-6">
        독일 상품 카테고리별 한국 내 수요를 분석하고 소싱 기회를 발굴합니다.
      </p>

      {/* 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">분석 기간</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {TIMEFRAMES.map(t => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
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

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedCat}
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
          ) : '소싱 분석'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {data && (
        <div className="space-y-5">
          {/* 트렌드 차트 */}
          {data.trends_available && data.kr_timeline.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">한국 내 검색 관심도 비교</h2>
              <p className="text-xs text-gray-400 mb-4">카테고리 내 상위 5개 키워드 비교 (Google Trends · KR)</p>
              <ComparisonTrendChart data={data.kr_timeline} keywords={data.keywords} />
            </div>
          )}

          {!data.trends_available && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm flex gap-2">
              <span>⚠️</span>
              <span>Google Trends API 제한으로 관심도 차트 없이 상품 데이터만 표시됩니다.</span>
            </div>
          )}

          {/* 아이템 목록 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">{data.category} — 소싱 후보 상품</h2>
              <span className="text-xs text-gray-400">한국 수요 높은 순</span>
            </div>

            <div className="divide-y divide-gray-100">
              {data.items.map((item, i) => (
                <div key={i}>
                  {/* 요약 행 */}
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{item.keyword}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.brand}</span>
                      </div>
                      <p className="text-xs text-gray-400">{item.note}</p>
                    </div>

                    <div className="flex-shrink-0 w-32">
                      <p className="text-xs text-gray-400 mb-1">한국 수요</p>
                      <InterestBar value={item.kr_interest} max={maxInterest} />
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {item.kr_price_min ? (
                        <>
                          <p className="text-xs text-gray-400">국내 최저가</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.kr_price_min.toLocaleString()}원~
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">가격 정보 없음</span>
                      )}
                    </div>

                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 펼침: 상품 카드 */}
                  {expandedIdx === i && (
                    <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-3">
                        국내 판매 중인 상품
                      </p>
                      {item.products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {item.products.map(p => (
                            <ProductCard key={p.id} product={p} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">검색된 상품이 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🇩🇪</div>
          <p className="text-sm">카테고리를 선택하고 소싱 분석을 시작하세요</p>
        </div>
      )}
    </div>
  )
}
