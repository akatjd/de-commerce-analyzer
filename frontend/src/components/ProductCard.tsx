import { Product } from '../utils/api'

interface Props {
  product: Product
}

const SOURCE_COLORS: Record<string, string> = {
  쿠팡: 'bg-red-100 text-red-700',
  네이버쇼핑: 'bg-green-100 text-green-700',
  'G마켓': 'bg-orange-100 text-orange-700',
  '11번가': 'bg-purple-100 text-purple-700',
}

export default function ProductCard({ product }: Props) {
  const badgeClass = SOURCE_COLORS[product.source] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {product.source}
          </span>
          {product.discount_rate && (
            <span className="text-xs font-bold text-red-500">{product.discount_rate}% OFF</span>
          )}
        </div>

        <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug">{product.name}</p>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {product.price.toLocaleString()}원
            </span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">
                {product.original_price.toLocaleString()}원
              </span>
            )}
          </div>

          {product.rating !== null && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <span className="text-yellow-400">★</span>
              <span>{product.rating}</span>
              {product.review_count !== null && (
                <span className="ml-1">({product.review_count.toLocaleString()})</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          바로가기
        </a>
      </div>
    </div>
  )
}
