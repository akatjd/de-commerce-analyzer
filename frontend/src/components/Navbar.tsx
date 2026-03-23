import { NavLink } from 'react-router-dom'

const links = [
  { to: '/sourcing', label: '🇩🇪 독일 소싱' },
  { to: '/discover', label: '트렌드 발굴' },
  { to: '/search', label: '상품 검색' },
  { to: '/trends', label: '트렌드 분석' },
  { to: '/compare', label: '가격 비교' },
]

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl flex items-center gap-8 h-14">
        <span className="font-bold text-lg text-blue-600 tracking-tight">DE Commerce</span>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
