export default function DebtsLoading() {
  return (
    <div className="page-enter">
      <div className="px-4 pt-4 pb-2">
        <div className="skeleton h-6 w-28 rounded-full mb-1" />
        <div className="skeleton h-3.5 w-40 rounded-full" />
      </div>
      <div className="px-4 py-2 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #FFE8F1', borderRadius: 14, overflow: 'hidden' }}>
            <div className="skeleton" style={{ height: 4 }} />
            <div style={{ padding: 16 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton w-11 h-11 rounded-xl" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-3.5 rounded-full" style={{ width: '55%' }} />
                  <div className="skeleton h-2.5 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
              <div className="skeleton h-2 rounded-full w-full mb-3" />
              <div className="flex justify-between">
                <div className="skeleton h-3.5 w-16 rounded-full" />
                <div className="skeleton h-3.5 w-16 rounded-full" />
                <div className="skeleton h-3.5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
