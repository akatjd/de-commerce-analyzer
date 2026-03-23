import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120000,  // discover는 API 다중 호출로 오래 걸릴 수 있음
})

export interface Product {
  id: string
  name: string
  price: number
  original_price: number | null
  discount_rate: number | null
  source: string
  url: string
  image_url: string | null
  rating: number | null
  review_count: number | null
}

export interface SearchResponse {
  keyword: string
  count: number
  products: Product[]
}

export interface TrendPoint {
  date: string
  value: number
}

export interface RelatedQuery {
  query: string
  value: number | string
}

export interface TrendsResponse {
  keyword: string
  timeframe: string
  timeline: TrendPoint[]
  related_top: RelatedQuery[]
  related_rising: RelatedQuery[]
  error?: string
}

export interface TrendsComparisonResponse {
  keywords: string[]
  timeframe: string
  timeline: Record<string, number | string>[]
  error?: string
}

export interface CompareResponse {
  keywords: string[]
  comparisons: Record<string, Product[]>
}

export const searchProducts = (q: string, limit = 20) =>
  api.get<SearchResponse>('/products/search', { params: { q, limit } }).then(r => r.data)

export const getTrends = (q: string, timeframe = '3m') =>
  api.get<TrendsResponse>('/trends', { params: { q, timeframe } }).then(r => r.data)

export const getTrendsComparison = (keywords: string[], timeframe = '3m') =>
  api.post<TrendsComparisonResponse>('/trends/comparison', { keywords, timeframe }).then(r => r.data)

export const compareProducts = (keywords: string[], limit = 6) =>
  api.post<CompareResponse>('/compare', { keywords, limit }).then(r => r.data)

export interface DiscoverTrendEntry {
  keyword: string
  timeline: TrendPoint[]
  products: Product[]
  avg_interest: number
}

export interface DiscoverResponse {
  timeframe: string
  trends: DiscoverTrendEntry[]
  error?: string
}

export const discoverTrends = (timeframe = '3m', limit = 6) =>
  api.get<DiscoverResponse>('/trends/discover', { params: { timeframe, limit } }).then(r => r.data)
