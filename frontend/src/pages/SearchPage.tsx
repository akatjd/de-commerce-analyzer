import { useState } from 'react'
import { searchProducts, Product } from '../utils/api'
import ProductCard from '../components/ProductCard'

const SOURCES = ['전체', '쿠팡', '네이버쇼핑', 'G마켓', '11번가']
const SORT_OPTIONS = [
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
  { value: 'rating', label: '평점순' },
  { value: 'review', label: '리뷰순' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState('전체')
  const [sort, setSort] = useState('price_asc')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await searchProducts(query.trim(), 24)
      setProducts(res.products)
      setKeyword(res.keyword)
      setSourceFilter('전체')
    } catch {
      setError('검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = products
    .filter(p => sourceFilter === '전체' || p.source === sourceFilter)
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sort === 'review') return (b.review_count ?? 0) - (a.review_count ?? 0)
      return 0
    })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">상품 검색</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요 (예: 무선 이어폰)"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{keyword}</span> 검색 결과{' '}
                {filtered.length}개
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {SOURCES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      sourceFilter === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400 text-sm">
          검색어를 입력하고 상품을 찾아보세요
        </div>
      )}
    </div>
  )
}
