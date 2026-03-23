import { useState } from 'react'
import { compareProducts, Product } from '../utils/api'

const SOURCE_COLORS: Record<string, string> = {
  쿠팡: 'text-red-600',
  네이버쇼핑: 'text-green-600',
  'G마켓': 'text-orange-500',
  '11번가': 'text-purple-600',
}

function MinPriceBadge({ products }: { products: Product[] }) {
  const minPrice = Math.min(...products.map(p => p.price))
  return (
    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
      최저 {minPrice.toLocaleString()}원
    </span>
  )
}

function PriceRow({ label, products, highlight }: { label: string; products: Product[]; highlight?: boolean }) {
  const minPrice = Math.min(...products.map(p => p.price))
  return (
    <tr className={highlight ? 'bg-gray-50' : ''}>
      <td className="px-4 py-3 text-sm text-gray-500 font-medium whitespace-nowrap">{label}</td>
      {products.map(p => (
        <td
          key={p.id}
          className={`px-4 py-3 text-sm text-center font-semibold ${
            p.price === minPrice ? 'text-blue-600' : 'text-gray-800'
          }`}
        >
          {p.price === minPrice && <span className="mr-1">🏆</span>}
          {p.price.toLocaleString()}원
        </td>
      ))}
    </tr>
  )
}

export default function ComparePage() {
  const [keywords, setKeywords] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Record<string, Product[]> | null>(null)

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault()
    const kws = keywords.filter(k => k.trim())
    if (kws.length < 2) {
      setError('비교할 상품을 2개 이상 입력하세요.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await compareProducts(kws, 6)
      setResult(res.comparisons)
    } catch {
      setError('비교 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">가격 비교</h1>

      <form onSubmit={handleCompare} className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((kw, i) => (
            <input
              key={i}
              type="text"
              value={kw}
              onChange={e => {
                const next = [...keywords]
                next[i] = e.target.value
                setKeywords(next)
              }}
              placeholder={`상품 ${i + 1} (예: 아이폰15)`}
              className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          {keywords.length < 4 && (
            <button
              type="button"
              onClick={() => setKeywords([...keywords, ''])}
              className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400"
            >
              + 상품 추가
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '비교 중...' : '가격 비교'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          {Object.entries(result).map(([keyword, products]) => (
            <div key={keyword} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900">{keyword}</h2>
                <MinPriceBadge products={products} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        구분
                      </th>
                      {products.map(p => (
                        <th
                          key={p.id}
                          className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                            SOURCE_COLORS[p.source] ?? 'text-gray-500'
                          }`}
                        >
                          {p.source}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500">상품명</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-xs text-gray-700 text-center max-w-[140px]">
                          <p className="line-clamp-2">{p.name}</p>
                        </td>
                      ))}
                    </tr>
                    <PriceRow label="판매가" products={products} />
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500">할인율</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-sm text-center">
                          {p.discount_rate ? (
                            <span className="text-red-500 font-semibold">{p.discount_rate}%</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">평점</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-sm text-center text-gray-700">
                          {p.rating !== null ? (
                            <span><span className="text-yellow-400">★</span> {p.rating}</span>
                          ) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500">리뷰수</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-sm text-center text-gray-600">
                          {p.review_count !== null ? p.review_count.toLocaleString() : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">링크</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-center">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            바로가기
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="text-center py-20 text-gray-400 text-sm">
          상품명을 2개 이상 입력하고 가격을 비교하세요
        </div>
      )}
    </div>
  )
}
