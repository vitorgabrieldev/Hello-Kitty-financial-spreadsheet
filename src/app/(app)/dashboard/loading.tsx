export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="hk-gradient px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-2">
            <div className="skeleton-white h-3 w-24 rounded-full" />
            <div className="skeleton-white h-6 w-32 rounded-full" />
          </div>
          <div className="skeleton-white w-10 h-10 rounded-full" />
        </div>
        <div className="skeleton-white h-10 w-48 rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="skeleton-white h-3 w-16 rounded-full mb-2" />
            <div className="skeleton-white h-5 w-24 rounded-full" />
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="skeleton-white h-3 w-16 rounded-full mb-2" />
            <div className="skeleton-white h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* Cartões */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-36 rounded-full" />
            <div className="skeleton h-3 w-14 rounded-full" />
          </div>
          <div className="flex gap-3 overflow-hidden -mx-4 px-4">
            {[1, 2].map(i => (
              <div key={i} className="skeleton rounded-2xl flex-shrink-0" style={{ width: 200, height: 110 }} />
            ))}
          </div>
        </div>

        {/* Contas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-20 rounded-full" />
            <div className="skeleton h-3 w-16 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="skeleton h-3 w-28 rounded-full" />
                    <div className="skeleton h-2.5 w-20 rounded-full" />
                  </div>
                </div>
                <div className="skeleton h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Lançamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-40 rounded-full" />
            <div className="skeleton h-3 w-14 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <div className="skeleton h-3 w-32 rounded-full" />
                    <div className="skeleton h-2.5 w-24 rounded-full" />
                  </div>
                </div>
                <div className="skeleton h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
