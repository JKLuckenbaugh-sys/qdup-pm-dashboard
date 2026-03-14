export default function TopBar({ onMenuToggle, title, subtitle, logo, logoAlt }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0e12]/80 backdrop-blur-md border-b border-[#1e2d3a] px-4 lg:px-6 py-3 flex items-center gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {logo && (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <img src={logo} alt={logoAlt || title} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-display font-bold text-white text-lg leading-tight truncate">{title}</h1>
        )}
        {subtitle && (
          <p className="text-gray-500 text-xs mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </header>
  )
}
