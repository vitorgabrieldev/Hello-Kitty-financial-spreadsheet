export default function SettingsLoading() {
  return (
    <div>
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: 'rgba(255,255,255,0.75)', borderBottom: '1px solid #FFE8F1' }}
      >
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Perfil */}
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
          <div className="skeleton w-16 h-16 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton h-4 w-36 rounded-full" />
            <div className="skeleton h-3 w-48 rounded-full" />
          </div>
        </div>
        {/* Seções */}
        {[5, 3, 2].map((rows, g) => (
          <div key={g} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
            <div className="skeleton h-3 w-24 rounded-full m-4 mb-2" />
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #FFE8F1' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="skeleton h-3 rounded-full" style={{ width: `${80 + (i % 2) * 40}px` }} />
                </div>
                <div className="skeleton w-5 h-5 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
